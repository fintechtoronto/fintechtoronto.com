import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { sendEventRegistrationConfirmation, scheduleEventReminders } from '@/lib/novu'

export async function POST(request: Request) {
  try {
    // Parse request body
    const { eventId, name, email, company, attendeeDetails } = await request.json()

    // Validate required fields
    if (!eventId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, name, and email are required' },
        { status: 400 }
      )
    }

    // Get Supabase instance
    const supabase = createRouteHandlerClient({ cookies })

    // First check if user already registered
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('email', email)
      .single()

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You have already registered for this event', id: existingRegistration.id },
        { status: 400 }
      )
    }

    // Insert registration into database
    const { data: registration, error } = await supabase
      .from('event_registrations')
      .insert([
        {
          event_id: eventId,
          name,
          email,
          company: company || null,
          attendee_details: attendeeDetails || null,
          status: 'confirmed'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error registering for event:', error)
      return NextResponse.json(
        { error: 'Failed to register for the event' },
        { status: 500 }
      )
    }

    // Get event details to include in notification
    const { data: event } = await supabase
      .from('events')
      .select('title, date, location')
      .eq('id', eventId)
      .single()

    // Send confirmation notification via Novu
    if (event) {
      const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      
      // Send confirmation email
      await sendEventRegistrationConfirmation(
        email,
        name,
        event.title,
        formattedDate,
        event.location,
        registration.id
      )
      
      // Schedule reminder for this event if not already scheduled
      try {
        await scheduleEventReminders(
          eventId,
          event.title,
          event.date,
          event.location
        )
      } catch (err) {
        // Log error but don't fail registration if reminder scheduling fails
        console.error('Error scheduling event reminders:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for the event',
      registrationId: registration.id
    })
  } catch (error) {
    console.error('Error processing event registration:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 