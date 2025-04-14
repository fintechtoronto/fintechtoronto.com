/**
 * This file contains templates for Novu notifications.
 * These should be created in the Novu dashboard and then referenced here.
 * 
 * To use these templates in your Novu dashboard:
 * 1. Go to https://web.novu.co/workflows
 * 2. Create a new workflow for each template
 * 3. Use the templates below as reference
 */

export const NOVU_TEMPLATES = {
  // Template for newsletter subscription
  NEWSLETTER: 'newsletter',
  
  // Template for event registration confirmation
  EVENT_REGISTRATION: 'event-registration',
  
  // Template for event reminder (24 hours before)
  EVENT_REMINDER: 'event-reminder',
  
  // Template for post-event follow-up
  EVENT_FOLLOWUP: 'event-followup'
}

/**
 * Example content for the event registration template:
 * 
 * Subject: You're registered for {{eventName}}!
 * 
 * Body:
 * Hi {{name}},
 * 
 * Thank you for registering for {{eventName}}. We're excited to have you join us!
 * 
 * Event Details:
 * Date: {{eventDate}}
 * Location: {{eventLocation}}
 * 
 * Add this event to your calendar and we'll send you a reminder as the event approaches.
 * 
 * Your registration ID is: {{registrationId}}
 * 
 * See you there!
 * FinTech Toronto Team
 * 
 * 
 * Example content for the event reminder template:
 * 
 * Subject: Reminder: {{eventName}} is tomorrow!
 * 
 * Body:
 * Hi {{name}},
 * 
 * This is a friendly reminder that {{eventName}} is happening tomorrow at {{eventLocation}}.
 * 
 * Event Details:
 * Date: {{eventDate}}
 * Location: {{eventLocation}}
 * 
 * Don't forget to bring your registration ID: {{registrationId}}
 * 
 * We look forward to seeing you!
 * FinTech Toronto Team
 * 
 * 
 * Example content for the event follow-up template:
 * 
 * Subject: Thank you for attending {{eventName}}
 * 
 * Body:
 * Hi {{name}},
 * 
 * Thank you for attending {{eventName}}! We hope you enjoyed the event and made valuable connections.
 * 
 * If you'd like to share your feedback, please take a moment to complete our short survey: [Survey Link]
 * 
 * We've also attached some resources mentioned during the event that you might find useful.
 * 
 * Stay tuned for upcoming events!
 * FinTech Toronto Team
 */ 