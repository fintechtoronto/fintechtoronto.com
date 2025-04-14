/**
 * Event Notifications Script
 * 
 * This script is designed to be run as a daily cron job to:
 * 1. Send reminders for upcoming events (24 hours before the event)
 * 2. Send follow-up emails after events have ended
 * 
 * Usage:
 * - Set up as a cron job to run daily
 * - Can also be manually triggered for testing
 * 
 * Example cron setting: 0 9 * * * ts-node scripts/event-notifications.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { 
  sendEventReminder, 
  sendEventFollowup 
} from '../lib/novu'

// Load environment variables
dotenv.config()

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  try {
    console.log('Starting event notifications process...')
    
    // Get current date
    const now = new Date()
    
    // Define date ranges
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // Format dates for Postgres comparison
    const formattedOneDayFromNow = oneDayFromNow.toISOString()
    const formattedNow = now.toISOString()
    const formattedYesterday = yesterday.toISOString()
    
    // 1. Process reminders for events happening tomorrow
    await processReminders(formattedNow, formattedOneDayFromNow)
    
    // 2. Process follow-ups for events that happened yesterday
    await processFollowups(formattedYesterday, formattedNow)
    
    console.log('Event notifications process completed successfully')
  } catch (error) {
    console.error('Error in event notifications process:', error)
    process.exit(1)
  }
}

/**
 * Process event reminders for events happening in the next 24 hours
 */
async function processReminders(fromDate: string, toDate: string) {
  try {
    console.log(`Processing reminders for events from ${fromDate} to ${toDate}`)
    
    // Find events happening in the next 24 hours
    const { data: upcomingEvents, error } = await supabase
      .from('events')
      .select('id, title, date, location')
      .gte('date', fromDate)
      .lt('date', toDate)
      .eq('is_cancelled', false)
    
    if (error) {
      throw error
    }
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log('No upcoming events found in the next 24 hours')
      return
    }
    
    console.log(`Found ${upcomingEvents.length} events happening in the next 24 hours`)
    
    // Process each event
    for (const event of upcomingEvents) {
      // Get attendees for this event
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('id, name, email')
        .eq('event_id', event.id)
        .eq('status', 'confirmed')
      
      if (regError) {
        console.error(`Error fetching registrations for event ${event.id}:`, regError)
        continue
      }
      
      if (!registrations || registrations.length === 0) {
        console.log(`No confirmed registrations for event ${event.title}`)
        continue
      }
      
      // Format event date for emails
      const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      
      // Send reminder to each attendee
      console.log(`Sending reminders for event: ${event.title} to ${registrations.length} attendees`)
      
      let successCount = 0
      for (const reg of registrations) {
        try {
          await sendEventReminder(
            reg.email,
            reg.name,
            event.title,
            formattedDate,
            event.location,
            reg.id
          )
          successCount++
        } catch (err) {
          console.error(`Failed to send reminder to ${reg.email}:`, err)
        }
      }
      
      console.log(`Successfully sent ${successCount}/${registrations.length} reminders for event ${event.title}`)
    }
    
  } catch (error) {
    console.error('Error processing reminders:', error)
  }
}

/**
 * Process follow-up emails for events that happened in the past 24 hours
 */
async function processFollowups(fromDate: string, toDate: string) {
  try {
    console.log(`Processing follow-ups for events from ${fromDate} to ${toDate}`)
    
    // Find events that happened in the last 24 hours
    const { data: pastEvents, error } = await supabase
      .from('events')
      .select('id, title, date')
      .gte('date', fromDate)
      .lt('date', toDate)
      .eq('is_cancelled', false)
    
    if (error) {
      throw error
    }
    
    if (!pastEvents || pastEvents.length === 0) {
      console.log('No events found that ended in the past 24 hours')
      return
    }
    
    console.log(`Found ${pastEvents.length} events that ended in the past 24 hours`)
    
    // Process each event
    for (const event of pastEvents) {
      // Get attendees for this event
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('id, name, email')
        .eq('event_id', event.id)
        .eq('status', 'confirmed')
      
      if (regError) {
        console.error(`Error fetching registrations for event ${event.id}:`, regError)
        continue
      }
      
      if (!registrations || registrations.length === 0) {
        console.log(`No confirmed registrations for event ${event.title}`)
        continue
      }
      
      // Generate survey link (this would be customized in a real app)
      const surveyLink = `https://fintechtoronto.com/survey?event=${event.id}`
      
      // Send follow-up to each attendee
      console.log(`Sending follow-ups for event: ${event.title} to ${registrations.length} attendees`)
      
      let successCount = 0
      for (const reg of registrations) {
        try {
          await sendEventFollowup(
            reg.email,
            reg.name,
            event.title,
            surveyLink
          )
          successCount++
        } catch (err) {
          console.error(`Failed to send follow-up to ${reg.email}:`, err)
        }
      }
      
      console.log(`Successfully sent ${successCount}/${registrations.length} follow-ups for event ${event.title}`)
    }
    
  } catch (error) {
    console.error('Error processing follow-ups:', error)
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
}) 