import { Novu } from '@novu/node'
import { NOVU_TEMPLATES } from './novu-templates'

const novu = new Novu(process.env.NOVU_API_KEY!)

export async function sendNewsletter(subject: string, content: string, subscribers: string[]) {
  try {
    await novu.trigger(NOVU_TEMPLATES.NEWSLETTER, {
      to: subscribers.map(email => ({ subscriberId: email, email })),
      payload: {
        subject,
        content,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending newsletter:', error)
    return { success: false, error }
  }
}

/**
 * Send event registration confirmation email
 */
export async function sendEventRegistrationConfirmation(
  email: string,
  name: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  registrationId: string
) {
  try {
    await novu.trigger(NOVU_TEMPLATES.EVENT_REGISTRATION, {
      to: { subscriberId: email, email },
      payload: {
        name,
        eventName,
        eventDate,
        eventLocation,
        registrationId
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending event registration confirmation:', error)
    return { success: false, error }
  }
}

/**
 * Send event reminder email (typically 24 hours before event)
 */
export async function sendEventReminder(
  email: string,
  name: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  registrationId: string
) {
  try {
    await novu.trigger(NOVU_TEMPLATES.EVENT_REMINDER, {
      to: { subscriberId: email, email },
      payload: {
        name,
        eventName,
        eventDate,
        eventLocation,
        registrationId
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending event reminder:', error)
    return { success: false, error }
  }
}

/**
 * Send post-event follow-up email
 */
export async function sendEventFollowup(
  email: string,
  name: string,
  eventName: string,
  surveyLink?: string,
  resourceLinks?: string[]
) {
  try {
    await novu.trigger(NOVU_TEMPLATES.EVENT_FOLLOWUP, {
      to: { subscriberId: email, email },
      payload: {
        name,
        eventName,
        surveyLink: surveyLink || '',
        resourceLinks: resourceLinks || []
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending event follow-up:', error)
    return { success: false, error }
  }
}

/**
 * Schedule event reminders for all registered attendees
 */
export async function scheduleEventReminders(
  eventId: string,
  eventName: string,
  eventDate: string,
  eventLocation: string
) {
  try {
    // Calculate reminder time (24 hours before event)
    const eventTime = new Date(eventDate).getTime()
    const reminderTime = new Date(eventTime - 24 * 60 * 60 * 1000)
    
    // Schedule the job with Novu
    await novu.scheduleJobs.create({
      name: `event-reminder-${eventId}`,
      scheduledFor: reminderTime,
      workflowIdentifier: NOVU_TEMPLATES.EVENT_REMINDER,
      // In a real implementation, you would fetch all attendees and schedule reminders for each
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error scheduling event reminders:', error)
    return { success: false, error }
  }
} 