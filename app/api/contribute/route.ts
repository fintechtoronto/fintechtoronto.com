import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// This is the API route that handles article proposals from non-logged in users
export async function POST(request: Request) {
  try {
    const { name, email, title, summary } = await request.json()

    // Simple validation
    if (!name || !email || !title || !summary) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Add entry to article proposals table
    const { data, error } = await supabaseAdmin
      .from('article_proposals')
      .insert({
        name,
        email,
        title,
        summary,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('Error submitting article proposal:', error)
      return NextResponse.json(
        { message: 'Failed to submit proposal. Please try again.' },
        { status: 500 }
      )
    }

    // Send notification (can be implemented with Novu if needed)
    
    return NextResponse.json(
      { message: 'Proposal submitted successfully', data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in article proposal submission:', error)
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 