import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId, reason, requestedRole } = await req.json()
    
    if (!userId || !reason) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and reason are required' 
      }, { status: 400 })
    }
    
    // Check if there's already a pending request from this user
    const { data: existingRequest, error: checkError } = await supabaseAdmin
      .from('admin_requests')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error checking existing requests:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check existing requests' 
      }, { status: 500 })
    }
    
    if (existingRequest) {
      return NextResponse.json({ 
        success: false, 
        error: 'You already have a pending request. Please wait for it to be reviewed.',
        requestId: existingRequest.id
      }, { status: 400 })
    }
    
    // Insert new request
    const { data, error } = await supabaseAdmin
      .from('admin_requests')
      .insert({ 
        user_id: userId, 
        reason,
        requested_role: requestedRole || 'moderator' 
      })
      .select()
      .single()
      
    if (error) {
      console.error('Error creating admin request:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to submit request' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Request submitted successfully',
      requestId: data.id 
    })
  } catch (error) {
    console.error('Error in admin-request API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 