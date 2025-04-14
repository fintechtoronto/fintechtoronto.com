'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [cookieInfo, setCookieInfo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getSessionInfo = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setError(error.message)
        } else {
          setSessionInfo(data.session)
        }

        // Get cookies (simplified check for debugging)
        const cookies = document.cookie.split(';').map(c => c.trim())
        setCookieInfo(cookies.filter(c => c.includes('sb-')))
      } catch (err) {
        setError('An unexpected error occurred')
      }
    }

    getSessionInfo()
  }, [])

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        setError(error.message)
      } else {
        setSessionInfo(data.session)
        // Get updated cookies
        const cookies = document.cookie.split(';').map(c => c.trim())
        setCookieInfo(cookies.filter(c => c.includes('sb-')))
      }
    } catch (err) {
      setError('An unexpected error occurred during refresh')
    }
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
          <CardDescription>Debug information about your authentication status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Auth Status</h3>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <p>Loading authentication status...</p>
              </div>
            ) : user ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">✅ Authenticated</p>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p><span className="font-medium">User ID:</span> {user.id}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Full Name:</span> {user.user_metadata?.full_name || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-600 font-medium">❌ Not authenticated</p>
                <Link href="/auth/login" className="mt-2 inline-block">
                  <Button>Sign In</Button>
                </Link>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Session Info</h3>
            {sessionInfo ? (
              <div className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-40">
                <p><span className="font-medium">Access Token Available:</span> {sessionInfo.access_token ? '✅' : '❌'}</p>
                <p><span className="font-medium">Refresh Token Available:</span> {sessionInfo.refresh_token ? '✅' : '❌'}</p>
                <p><span className="font-medium">Expires At:</span> {new Date(sessionInfo.expires_at! * 1000).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No active session</p>
            )}
            
            <Button onClick={refreshSession} className="mt-3" variant="outline" size="sm">
              Refresh Session
            </Button>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Auth Cookies</h3>
            {cookieInfo.length > 0 ? (
              <div className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-40">
                <ul className="space-y-1">
                  {cookieInfo.map((cookie, i) => (
                    <li key={i}>{cookie}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground">No Supabase cookies found</p>
            )}
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md">
              <h3 className="font-medium mb-1">Error</h3>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex space-x-2 pt-4">
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
            {user && (
              <Link href="/dashboard">
                <Button>Go To Dashboard</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 