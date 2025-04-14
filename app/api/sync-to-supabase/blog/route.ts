import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { adminClient as sanityClient } from '@/lib/sanity'

// Simple function to verify webhook signatures
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  // If no secret is provided, skip verification in development
  if (!secret && process.env.NODE_ENV === 'development') {
    console.warn('No webhook secret configured, skipping verification')
    return true
  }
  
  // If no signature is provided, reject
  if (!signature || !secret) {
    return false
  }
  
  // In a real implementation, this would use crypto to verify HMAC
  // For now, this is a simple implementation that should be replaced with proper verification
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body)
  const computedSignature = hmac.digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}

export async function POST(request: Request) {
  try {
    // Get the request body as text for signature verification
    const bodyText = await request.text()
    
    // Get the signature from headers
    const signature = request.headers.get('sanity-webhook-signature') || ''
    
    // Verify the signature
    const isValid = verifyWebhookSignature(
      bodyText,
      signature,
      process.env.SANITY_WEBHOOK_SECRET || ''
    )
    
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Parse the body as JSON
    const sanityEvent = JSON.parse(bodyText)
    
    // Check if this is a publish event for a blog document
    if (
      sanityEvent.operation === 'create' || 
      sanityEvent.operation === 'update'
    ) {
      const blogData = sanityEvent.result
      
      // Make sure this is a blog document
      if (blogData._type !== 'blog') {
        return NextResponse.json({ 
          message: 'Not a blog document' 
        }, { status: 200 })
      }
      
      // Check if we already have this article in Supabase by sanity_id
      const { data: existingArticle, error: lookupError } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('sanity_id', blogData._id)
        .maybeSingle()
      
      if (lookupError) {
        console.error('Error looking up article:', lookupError)
        return NextResponse.json({ 
          error: 'Failed to look up article in Supabase' 
        }, { status: 500 })
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
            slug: blogData.slug?.current || '',
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
          return NextResponse.json({ 
            error: 'Failed to update article in Supabase' 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Article updated in Supabase',
          articleId: existingArticle.id
        })
      } else {
        // Create new article
        const { data, error: insertError } = await supabaseAdmin
          .from('articles')
          .insert({
            title: blogData.title,
            slug: blogData.slug?.current || '',
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
          return NextResponse.json({ 
            error: 'Failed to create article in Supabase' 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Article created in Supabase',
          articleId: data.id
        })
      }
    }
    
    // Handle delete events if needed
    if (sanityEvent.operation === 'delete') {
      const documentId = sanityEvent.documentId
      if (documentId && documentId.startsWith('article-')) {
        const { error } = await supabaseAdmin
          .from('articles')
          .update({ 
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('sanity_id', documentId)
        
        if (error) {
          console.error('Error marking article as deleted:', error)
          return NextResponse.json({ 
            error: 'Failed to mark article as deleted' 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Article marked as deleted in Supabase'
        })
      }
    }
    
    return NextResponse.json({ 
      message: 'No action taken' 
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error processing Sanity webhook:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { status: 500 })
  }
} 