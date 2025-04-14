import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { requestId, adminId, status, feedback } = await req.json()
    
    if (!requestId || !adminId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID, admin ID, and status are required' 
      }, { status: 400 })
    }
    
    // Validate status
    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ 
        success: false, 
        error: 'Status must be either "approved" or "rejected"' 
      }, { status: 400 })
    }
    
    // Check if admin has appropriate permissions
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single()
      
    if (adminError || !adminProfile) {
      console.error('Error fetching admin profile:', adminError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to verify admin permissions' 
      }, { status: 500 })
    }
    
    if (adminProfile.role !== 'admin' && adminProfile.role !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not have permission to review requests' 
      }, { status: 403 })
    }
    
    // Get the request details
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('admin_requests')
      .select('id, user_id, requested_role, status')
      .eq('id', requestId)
      .single()
      
    if (requestError || !requestData) {
      console.error('Error fetching request:', requestError)
      return NextResponse.json({ 
        success: false, 
        error: 'Request not found' 
      }, { status: 404 })
    }
    
    // Ensure request is not already processed
    if (requestData.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        error: 'This request has already been processed' 
      }, { status: 400 })
    }
    
    // Start a transaction to update both the request and user profile if approved
    const { error: updateError } = await supabaseAdmin.rpc('process_role_request', {
      p_request_id: requestId,
      p_admin_id: adminId,
      p_status: status,
      p_feedback: feedback || null,
      p_requested_role: requestData.requested_role,
      p_user_id: requestData.user_id
    })
    
    if (updateError) {
      console.error('Error processing request:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to process request' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully` 
    })
  } catch (error) {
    console.error('Error in admin-request review API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 