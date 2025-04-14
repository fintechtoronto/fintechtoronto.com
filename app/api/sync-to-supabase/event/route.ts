import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Verify webhook signature if needed in production
    // const signature = request.headers.get('x-sanity-signature')
    
    // Parse the Sanity webhook payload
    const sanityEvent = await request.json()
    
    // Check if this is a publish event for an event document
    if (
      sanityEvent.operation === 'create' || 
      sanityEvent.operation === 'update' || 
      sanityEvent.operation === 'delete'
    ) {
      const eventData = sanityEvent.result
      
      // Make sure this is an event document
      if (eventData._type !== 'event') {
        return NextResponse.json({ 
          message: 'Not an event document' 
        }, { status: 200 })
      }
      
      // Handle delete operation
      if (sanityEvent.operation === 'delete') {
        // We typically don't want to delete events from Supabase
        // as it would delete registration records, instead we can mark as cancelled
        const { error } = await supabaseAdmin
          .from('events')
          .update({ is_cancelled: true })
          .eq('sanity_id', eventData._id)
        
        if (error) {
          console.error('Error marking event as cancelled:', error)
          return NextResponse.json({ 
            error: 'Failed to mark event as cancelled' 
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Event marked as cancelled' 
        })
      }
      
      // Format description - convert Sanity Portable Text to plain text for Supabase
      let plainDescription = ''
      if (eventData.description) {
        plainDescription = eventData.description
          .map((block: any) => {
            if (block._type === 'block' && block.children) {
              return block.children.map((child: any) => child.text).join('')
            }
            return ''
          })
          .join('\n\n')
      }
      
      // Insert or update event in Supabase
      const { data, error } = await supabaseAdmin
        .from('events')
        .upsert({
          sanity_id: eventData._id,
          title: eventData.title,
          slug: eventData.slug?.current || '',
          description: plainDescription,
          date: eventData.date,
          location: eventData.location,
          event_type: eventData.eventType,
          max_attendees: eventData.maxAttendees,
          cal_id: eventData.calId,
          is_cancelled: false
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error syncing event to Supabase:', error)
        return NextResponse.json({ 
          error: 'Failed to sync event to Supabase' 
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Event synced to Supabase',
        eventId: data.id
      })
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