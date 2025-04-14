'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'

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
const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Removed global initialization. PostHog will now be initialized in the PostHogProvider component.

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      debugLog('⚠️ PostHog API key is missing! Check your .env file for NEXT_PUBLIC_POSTHOG_KEY');
      return;
    }
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      capture_pageview: false, // We capture pageviews manually
      capture_pageleave: true, // Enable pageleave capture
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) {
        url += '?' + search;
      }
      posthogClient.capture('$pageview', { '$current_url': url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
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
      posthog.capture(eventName, properties);
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
      posthog.identify(userId, traits);
    } catch (error) {
      debugLog('❌ Error identifying user:', error);
    }
  },

  // Reset user (logout)
  reset: () => {
    if (!posthogApiKey) return;

    try {
      debugLog('Resetting user identity');
      posthog.reset();
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
      posthog.register(properties);
    } catch (error) {
      debugLog('❌ Error registering properties:', error);
    }
  },
};

// Export posthog instance for direct access if needed
export { posthog };
