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

// Debug logger for PostHog
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PostHog Debug] ${message}`, data || '');
  }
};

// PostHog configuration from environment variables
const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

// Initialize PostHog in the client side only
if (typeof window !== 'undefined') {
  if (!posthogApiKey) {
    debugLog('⚠️ PostHog API key is missing! Check your .env file for NEXT_PUBLIC_POSTHOG_KEY');
  } else {
    debugLog('Initializing PostHog with config:', { 
      apiKey: posthogApiKey?.substring(0, 4) + '...',
      host: posthogHost
    });
    
    try {
      posthog.init(posthogApiKey, {
        api_host: posthogHost,
        capture_pageview: false, // We'll manually capture pageviews
        capture_pageleave: true,
        ui_host: posthogHost,
        loaded: (posthog) => {
          debugLog('PostHog loaded successfully');
          if (process.env.NODE_ENV === 'development') {
            // Make available during development
            window.posthog = posthog
          }
        },
      })
    } catch (error) {
      debugLog('❌ Error initializing PostHog:', error);
    }
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!posthogApiKey) {
      debugLog('⚠️ Skipping pageview capture: PostHog API key is missing');
      return;
    }
    
    if (pathname) {
      let url = window.origin + pathname
      
      // If search parameters exist, append them to the URL
      if (searchParams && searchParams.toString()) {
        url = `${url}?${searchParams.toString()}`
      }
      
      // Capture pageview with current URL
      try {
        debugLog('Capturing pageview for:', url);
        posthog.capture('$pageview', {
          current_url: url,
        })
      } catch (error) {
        debugLog('❌ Error capturing pageview:', error);
      }
    }
  }, [pathname, searchParams])

  // If PostHog is not configured, render children without the provider
  if (!posthogApiKey) {
    debugLog('Rendering without PostHog provider - API key missing');
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Utility functions for analytics with error handling
export const Analytics = {
  // Track event with properties
  track: (eventName: string, properties?: Record<string, any>) => {
    if (!posthogApiKey) {
      debugLog(`⚠️ Skipped tracking "${eventName}": PostHog API key is missing`);
      return;
    }
    
    try {
      debugLog(`Tracking event: ${eventName}`, properties);
      posthog.capture(eventName, properties)
    } catch (error) {
      debugLog(`❌ Error tracking "${eventName}":`, error);
    }
  },
  
  // Identify user
  identify: (userId: string, traits?: Record<string, any>) => {
    if (!posthogApiKey) {
      debugLog('⚠️ Skipped identify: PostHog API key is missing');
      return;
    }
    
    try {
      debugLog(`Identifying user: ${userId.substring(0, 4)}...`, traits);
      posthog.identify(userId, traits)
    } catch (error) {
      debugLog('❌ Error identifying user:', error);
    }
  },
  
  // Reset user (logout)
  reset: () => {
    if (!posthogApiKey) return;
    
    try {
      debugLog('Resetting user identity');
      posthog.reset()
    } catch (error) {
      debugLog('❌ Error resetting user:', error);
    }
  },
  
  // Register persistent super properties
  register: (properties: Record<string, any>) => {
    if (!posthogApiKey) {
      debugLog('⚠️ Skipped register: PostHog API key is missing');
      return;
    }
    
    try {
      debugLog('Registering super properties', properties);
      posthog.register(properties)
    } catch (error) {
      debugLog('❌ Error registering properties:', error);
    }
  }
}

// Export posthog instance for direct access if needed
export { posthog } 