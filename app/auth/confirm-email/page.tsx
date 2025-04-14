'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MailCheck } from 'lucide-react'

export default function ConfirmEmailPage() {
  return (
    <div className="container py-16 max-w-md text-center">
      <Card>
        <CardHeader>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-lg">
            Confirm your email address to complete registration
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p className="mb-4">
            We sent you a verification link to your email address. Please click the link to verify your account.
          </p>
          <p>
            If you don't see the email in your inbox, please check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Continue to Login
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Didn't receive an email?{' '}
            <Button variant="link" className="h-auto p-0">
              Resend verification email
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 