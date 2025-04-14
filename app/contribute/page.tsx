'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ContributePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is logged in, redirect to the dashboard
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      title: formData.get('title'),
      summary: formData.get('summary'),
    }

    try {
      const response = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setMessage('Thanks for your submission! We\'ll review it and get back to you soon.')
        e.currentTarget.reset()
      } else {
        const error = await response.json()
        setMessage(error.message || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return <div className="container py-16 text-center">Loading...</div>
  }

  if (user) {
    return null // Will redirect in the useEffect
  }

  return (
    <main className="container max-w-4xl py-12">
      <Card className="border-2 mb-8">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">Contribute an Article</CardTitle>
          <CardDescription className="text-lg">
            Share your insights with Toronto's fintech community. We welcome articles about fintech trends, AI applications, startup experiences, and industry analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6 text-center">
            <h3 className="text-xl font-medium mb-3">Create an account to get started</h3>
            <p className="text-muted-foreground mb-6">
              Register for an account to access our rich text editor and dashboard to manage your articles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/login">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/register">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or submit a proposal</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input id="email" name="email" type="email" required />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Article Title
              </label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="summary" className="text-sm font-medium">
                Article Summary
              </label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="Please provide a brief summary of your article (300-500 words)"
                className="h-32"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Article Proposal'
              )}
            </Button>
            {message && (
              <p className={`text-sm ${message.includes('wrong') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
          </form>
          <div className="mt-8 space-y-4">
            <h3 className="font-medium">Writing Guidelines:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Articles should be original and not published elsewhere</li>
              <li>Focus on practical insights and real-world experiences</li>
              <li>Include relevant data and sources to support your points</li>
              <li>Aim for 1,000-2,000 words in length</li>
              <li>We'll review your proposal and get back to you within 3-5 business days</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  )
} 