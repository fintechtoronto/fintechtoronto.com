'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

// Declare posthog on the window object for TypeScript
declare global {
  interface Window {
    posthog?: typeof posthog
  }
}

// PostHog API key
const posthogApiKey = 'phx_LXjGZ1EC7mUdPOKz91bAgO0BFHX4u3zlQy60f0I4VH4tK7t'
// PostHog host URL - use default if not specified
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

// Initialize PostHog in the client side only
if (typeof window !== 'undefined') {
  posthog.init(posthogApiKey, {
    api_host: posthogHost,
    capture_pageview: false, // We'll manually capture pageviews
    capture_pageleave: true,
    ui_host: 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        // Make available during development
        window.posthog = posthog
      }
    },
  })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      
      // If search parameters exist, append them to the URL
      if (searchParams && searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`
      }
      
      // Capture pageview with current URL
      posthog.capture('$pageview', {
        current_url: url,
      })
    }
  }, [pathname, searchParams])

  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Utility functions for analytics
export const Analytics = {
  // Track event with properties
  track: (eventName: string, properties?: Record<string, any>) => {
    posthog.capture(eventName, properties)
  },
  
  // Identify user
  identify: (userId: string, traits?: Record<string, any>) => {
    posthog.identify(userId, traits)
  },
  
  // Reset user (logout)
  reset: () => {
    posthog.reset()
  },
  
  // Register persistent super properties
  register: (properties: Record<string, any>) => {
    posthog.register(properties)
  }
}

// Export posthog instance for direct access if needed
export { posthog } 