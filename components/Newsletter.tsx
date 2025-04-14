'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      // First check if email already exists
      const { data: exists, error: checkError } = await supabase
        .rpc('check_email_exists', { email_address: email })

      if (checkError) throw checkError

      if (exists) {
        setStatus('error')
        setMessage('This email is already subscribed to our newsletter.')
        return
      }

      // If email doesn't exist, insert it
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert([{ email }])

      if (insertError) throw insertError

      setStatus('success')
      setMessage('Thank you for subscribing to our newsletter!')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again later.')
      console.error('Newsletter subscription error:', error)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
            className="flex-1"
            disabled={status === 'loading'}
          />
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </div>
        {message && (
          <p className={`text-sm ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>
  )
} 