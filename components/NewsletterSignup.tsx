'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email }])

      if (error) {
        if (error.code === '23505') {
          setMessage('You are already subscribed!')
          setStatus('error')
        } else {
          setMessage('Something went wrong. Please try again.')
          setStatus('error')
        }
        return
      }

      setMessage('Thanks for subscribing!')
      setStatus('success')
      setEmail('')
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        required
        className="bg-white text-neutral-900"
      />
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </Button>
      {message && (
        <p className={`text-sm ${status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </form>
  )
} 