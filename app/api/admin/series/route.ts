import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Add debug logging for environment variables
console.log('API Route - Environment variables loaded:', {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Available' : '❌ Missing',
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Available' : '❌ Missing',
})

export async function POST(request: Request) {
  try {
    // Extract data from request
    const data = await request.json()
    const { name, slug, description, created_by } = data
    
    console.log('Creating series with data:', { name, slug, description, created_by })
    
    // Insert the new series using the admin client
    const { data: series, error } = await supabaseAdmin
      .from('series')
      .insert({
        name,
        slug,
        description,
        status: 'approved',
        created_by,
      })
      .select()
    
    // Handle error
    if (error) {
      console.error('Error creating series (detailed):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    // Return success response
    console.log('Series created successfully:', series?.[0]?.id)
    return NextResponse.json(series[0])
  } catch (error) {
    console.error('Unexpected error creating series:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    // Extract data from request
    const data = await request.json()
    const { id, name, slug, description, status } = data
    
    // Update existing series using the admin client
    const { data: series, error } = await supabaseAdmin
      .from('series')
      .update({
        name,
        slug,
        description,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    // Handle error
    if (error) {
      console.error('Error updating series:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    // Return success response
    return NextResponse.json(series[0] || { success: true })
  } catch (error) {
    console.error('Unexpected error updating series:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 