import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminClient as sanityClient, groq } from '@/lib/sanity'

// This is a utility endpoint to manually sync all existing blog posts
// from Sanity to Supabase. Use it when you first set up the integration.
export async function GET(request: Request) {
  try {
    // Only allow this to be run in development or with a special key
    const url = new URL(request.url)
    const key = url.searchParams.get('key')
    
    if (process.env.NODE_ENV !== 'development' && key !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 1. Fetch all published blog posts from Sanity
    const blogPosts = await sanityClient.fetch(
      groq`*[_type == "blog" && !(_id in path("drafts.**"))]{
        _id,
        title,
        content,
        excerpt,
        "slug": slug.current,
        publishDate,
        image,
        authors[] {
          _ref
        }
      }`
    )
    
    if (!blogPosts || !blogPosts.length) {
      return NextResponse.json({
        message: 'No blog posts found in Sanity',
        count: 0
      })
    }
    
    console.log(`Found ${blogPosts.length} blog posts in Sanity`)
    
    // 2. Process each blog post
    const syncResults = []
    
    for (const blogData of blogPosts) {
      try {
        // Check if we already have this article in Supabase by sanity_id
        const { data: existingArticle, error: lookupError } = await supabaseAdmin
          .from('articles')
          .select('id')
          .eq('sanity_id', blogData._id)
          .maybeSingle()
        
        if (lookupError) {
          console.error('Error looking up article:', lookupError)
          syncResults.push({
            sanityId: blogData._id,
            title: blogData.title,
            status: 'error',
            message: `Failed to check article existence: ${lookupError.message}`
          })
          continue
        }
        
        // Get author information from Sanity reference
        let authorId = null
        if (blogData.authors && blogData.authors.length > 0) {
          const authorRef = blogData.authors[0]._ref
          if (authorRef && authorRef.startsWith('user-')) {
            authorId = authorRef.replace('user-', '')
          }
        }
        
        // If no author is found, use a default admin user or system account
        if (!authorId) {
          // Fetch first admin user as fallback
          const { data: adminUsers } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('is_admin', true)
            .limit(1)
            
          authorId = adminUsers && adminUsers.length > 0 
            ? adminUsers[0].id 
            : null
        }
        
        // Create or update article in Supabase
        if (existingArticle) {
          // Update existing article
          const { error: updateError } = await supabaseAdmin
            .from('articles')
            .update({
              title: blogData.title,
              slug: blogData.slug || '',
              content: blogData.content || '',
              excerpt: blogData.excerpt || '',
              status: 'published',
              published_at: blogData.publishDate || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              featured_image: blogData.image || null,
            })
            .eq('id', existingArticle.id)
          
          if (updateError) {
            console.error('Error updating article in Supabase:', updateError)
            syncResults.push({
              sanityId: blogData._id,
              title: blogData.title,
              status: 'error',
              message: `Failed to update: ${updateError.message}`
            })
            continue
          }
          
          syncResults.push({
            sanityId: blogData._id,
            title: blogData.title,
            status: 'updated',
            articleId: existingArticle.id
          })
        } else {
          // Create new article
          const { data, error: insertError } = await supabaseAdmin
            .from('articles')
            .insert({
              title: blogData.title,
              slug: blogData.slug || '',
              content: blogData.content || '',
              excerpt: blogData.excerpt || '',
              status: 'published',
              author_id: authorId,
              sanity_id: blogData._id,
              published_at: blogData.publishDate || new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              featured_image: blogData.image || null,
            })
            .select()
            .single()
          
          if (insertError) {
            console.error('Error creating article in Supabase:', insertError)
            syncResults.push({
              sanityId: blogData._id,
              title: blogData.title,
              status: 'error',
              message: `Failed to create: ${insertError.message}`
            })
            continue
          }
          
          syncResults.push({
            sanityId: blogData._id,
            title: blogData.title,
            status: 'created',
            articleId: data.id
          })
        }
      } catch (error: any) {
        console.error(`Error processing blog post ${blogData._id}:`, error)
        syncResults.push({
          sanityId: blogData._id,
          title: blogData.title,
          status: 'error',
          message: error.message || 'Unknown error'
        })
      }
    }
    
    // 3. Return summary of the sync process
    const created = syncResults.filter(r => r.status === 'created').length
    const updated = syncResults.filter(r => r.status === 'updated').length
    const errors = syncResults.filter(r => r.status === 'error').length
    
    return NextResponse.json({
      success: true,
      message: `Sync completed: ${created} created, ${updated} updated, ${errors} errors`,
      total: blogPosts.length,
      results: syncResults
    })
    
  } catch (error: any) {
    console.error('Error in sync all blogs:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred during sync',
      message: error.message
    }, { status: 500 })
  }
} 