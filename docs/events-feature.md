# Events Feature Documentation

This document provides an overview of the Events feature implementation in the FinTech Toronto website.

## Overview

The Events feature allows:
- Creating and managing events in the Sanity CMS
- Displaying upcoming events on the website
- Allowing users to register for events
- Sending notifications for event registrations, reminders, and follow-ups
- Cal.com integration for calendar sync and event management

## Architecture

The Events feature uses a dual-database approach:
1. **Content in Sanity**: Event details, descriptions, and media are stored in Sanity CMS
2. **Registrations in Supabase**: User registrations and attendance data are stored in Supabase

### Database Schema in Supabase

Two main tables:
- `events`: Mirrors event data from Sanity for quick queries
- `event_registrations`: Stores registration information

## Components

1. **Admin Panel**
   - Located at: `/app/admin/events/page.tsx`
   - Allows admins to create, edit, and manage events
   - Cal.com integration for event scheduling

2. **Events Listing**
   - Located at: `/app/events/page.tsx`
   - Shows upcoming events with filtering options
   - Features highlighted events

3. **Event Detail Page**
   - Located at: `/app/events/[slug]/page.tsx`
   - Shows complete event information
   - Registration form
   - Event countdown

4. **Registration Form**
   - Located at: `/app/events/[slug]/register-form.tsx`
   - Collects attendee information
   - Integrates with Novu for confirmation emails

## API Endpoints

1. **Event Registration**
   - Route: `/api/events/register`
   - Handles user registration for events
   - Sends confirmation emails via Novu

2. **Sanity to Supabase Sync**
   - Route: `/api/sync-to-supabase/event`
   - Syncs event data from Sanity to Supabase

## Notification System (Novu)

Event-related notifications are handled through Novu:

1. **Registration Confirmation**
   - Sent immediately after successful registration
   - Template: `event-registration`

2. **Event Reminder**
   - Sent 24 hours before the event
   - Template: `event-reminder`

3. **Event Follow-up**
   - Sent after the event concludes
   - Template: `event-followup`

## Cal.com Integration

The events system integrates with Cal.com for:
- Calendar synchronization
- Scheduling availability
- Attendee management

## Setup Instructions

1. **Sanity Schema**
   - The event schema is defined in `sanity/schemas/event.ts`
   - Key fields: title, description, date, location, eventType, calId, etc.

2. **Supabase Database**
   - Run the migration in `supabase/migrations/20240707_create_events_tables.sql`
   - This creates the necessary tables and functions

3. **Novu Setup**
   - Create templates in Novu dashboard using the examples in `lib/novu-templates.ts`
   - Set the `NOVU_API_KEY` in your `.env` file

4. **Cal.com Setup**
   - Create an account at Cal.com
   - Generate an API key and add it to your environment variables

## Usage Examples

### Creating an Event

1. Go to the Sanity Studio
2. Create a new event with required details
3. Publish the event
4. Event will sync to Supabase for registration tracking

### Registering for an Event

1. Users visit `/events` page
2. Click on an event to view details
3. Fill out registration form
4. Receive confirmation email via Novu

## Future Enhancements

- QR code check-in system
- Virtual event integrations (Zoom, Google Meet)
- Event series and recurring events
- Attendance tracking and analytics dashboard 