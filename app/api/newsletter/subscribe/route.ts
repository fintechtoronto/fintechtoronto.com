import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use a placeholder key for build time to prevent errors
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-for-build-time'

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const { data: existingSubscriber } = await supabase
      .from('newsletter_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', email)
      .single()

    if (existingSubscriber) {
      if (!existingSubscriber.unsubscribed_at) {
        return NextResponse.json(
          { error: 'Email already subscribed' },
          { status: 400 }
        )
      }

      // Re-subscribe if previously unsubscribed
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({ unsubscribed_at: null })
        .eq('id', existingSubscriber.id)

      if (updateError) throw updateError

      return NextResponse.json({
        message: 'Successfully re-subscribed to newsletter'
      })
    }

    // Add new subscriber
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email }])

    if (insertError) throw insertError

    // TODO: Send confirmation email using Novu
    // await novu.trigger('newsletter-confirmation', {
    //   to: { subscriberId: email, email },
    //   payload: {
    //     confirmationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/newsletter/confirm?token=${token}`
    //   }
    // })

    return NextResponse.json({
      message: 'Successfully subscribed to newsletter'
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
} 