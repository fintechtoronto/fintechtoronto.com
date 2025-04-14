import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendNewsletter } from '@/lib/novu'
import { client, groq } from '@/lib/sanity'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Verify the webhook is from Sanity
    if (!body._type || body._type !== 'newsletter' || body.status !== 'sent') {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Get newsletter content from Sanity
    const newsletter = await client.fetch(
      groq`*[_type == "newsletter" && _id == $id][0]{
        subject,
        body,
        status
      }`,
      { id: body._id }
    )

    if (!newsletter || newsletter.status !== 'sent') {
      return NextResponse.json({ error: 'Newsletter not found or not sent' }, { status: 404 })
    }

    // Get subscribers from Supabase
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email')

    if (error) {
      console.error('Error fetching subscribers:', error)
      return NextResponse.json({ error: 'Error fetching subscribers' }, { status: 500 })
    }

    // Send newsletter via Novu
    const result = await sendNewsletter(
      newsletter.subject,
      newsletter.body,
      subscribers.map((sub: any) => sub.email)
    )

    if (!result.success) {
      return NextResponse.json({ error: 'Error sending newsletter' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 