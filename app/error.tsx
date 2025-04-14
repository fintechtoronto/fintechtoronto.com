'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-xl text-center">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          We apologize for the inconvenience. Please try again or contact us if the problem persists.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
} 