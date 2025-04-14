'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, user } = useAuth()
  
  // Get the redirect path from URL if it exists
  const redirectPath = searchParams.get('redirect') || '/dashboard'
  
  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to:', redirectPath);
      router.push(redirectPath);
    }
  }, [user, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('Attempting to sign in...');
      const { error } = await signIn(email, password)
      if (error) {
        console.error('Sign in error:', error);
        setError(error.message)
        return
      }
      
      // Adding a delay to ensure tokens are stored properly
      setTimeout(() => {
        console.log('Sign in successful, redirecting to:', redirectPath);
        
        // Force a page reload to ensure all auth state is properly recognized
        window.location.href = redirectPath;
      }, 500);
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-16 max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
          {redirectPath !== '/dashboard' && (
            <p className="text-sm text-muted-foreground mt-2">
              You'll be redirected to {redirectPath.replace(/^\/+/, '')} after signing in
            </p>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Link href="/auth/reset-password" className="text-sm underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/register" className="underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 