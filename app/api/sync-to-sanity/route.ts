import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { client } from '@/lib/sanity'

export async function POST(req: Request) {
  try {
    const { articleId } = await req.json()
    
    // 1. Get article data from Supabase
    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .select(`
        id, 
        title, 
        slug, 
        content, 
        excerpt,
        featured_image,
        published_at,
        author_id,
        profiles:author_id (full_name, email, username, avatar_url)
      `)
      .eq('id', articleId)
      .single()
    
    if (error || !article) {
      console.error('Error fetching article from Supabase:', error)
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    
    // Get author information
    const author = article.profiles || null
    
    // Ensure author is properly typed
    let authorData = null;
    if (author) {
      // Handle if it's an array or single object
      if (Array.isArray(author)) {
        authorData = author[0];
      } else {
        authorData = author;
      }
    }
    
    // 2. Create a document in Sanity CMS
    const sanityDoc = {
      _type: 'blog',
      _id: `article-${article.id}`, // Using a predictable ID format
      title: article.title,
      content: article.content, // Assuming this is in a compatible format
      excerpt: article.excerpt,
      slug: {
        current: article.slug
      },
      publishDate: article.published_at || new Date().toISOString(),
      image: article.featured_image || null,
      // Reference the author if we have a matching Sanity user
      authors: authorData ? [
        {
          _type: 'reference',
          _ref: `user-${article.author_id}`,
          // If we don't have a matching user in Sanity, create it
          _weak: true
        }
      ] : []
    }
    
    // 3. Create or replace the document in Sanity
    const result = await client.createOrReplace(sanityDoc)
    
    // 4. Create author document in Sanity if it doesn't exist
    if (authorData) {
      try {
        const existingAuthor = await client.fetch(
          `*[_type == "user" && _id == $id][0]`,
          { id: `user-${article.author_id}` }
        )
        
        if (!existingAuthor) {
          // Create a new author document
          await client.createIfNotExists({
            _type: 'user',
            _id: `user-${article.author_id}`,
            name: authorData.full_name || authorData.username || 'Anonymous',
            slug: {
              current: (authorData.username || `user-${article.author_id}`).toLowerCase()
            },
            image: authorData.avatar_url || null,
            email: authorData.email || null
          })
        }
      } catch (authorError) {
        console.error('Error creating author in Sanity:', authorError)
        // Continue anyway, the article was created
      }
    }
    
    // 5. Update the Supabase article with the Sanity reference
    await supabaseAdmin
      .from('articles')
      .update({ 
        sanity_id: result._id,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId)
    
    return NextResponse.json({ 
      success: true, 
      sanityId: result._id,
      message: 'Article successfully published to Sanity CMS'
    })
  } catch (error) {
    console.error('Error syncing to Sanity:', error)
    return NextResponse.json({ 
      error: 'Failed to sync content to Sanity CMS' 
    }, { status: 500 })
  }
} 