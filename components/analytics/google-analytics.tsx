'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-B0ZQ7G73W8';

// Debug logger for development
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GA Debug] ${message}`, data || '');
  }
};

// Type definition for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize gtag function
export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.gtag(...args);
  }
};

// Google Analytics component
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Track page views
  useEffect(() => {
    if (pathname && window.gtag) {
      // Construct the full URL
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url += '?' + searchParams.toString();
      }
      
      // Send pageview with the updated path
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_location: url,
        page_title: document.title,
      });
      
      debugLog(`Page viewed: ${pathname}`);
    }
  }, [pathname, searchParams]);
  
  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: false // We'll handle this in useEffect
            });
          `,
        }}
      />
    </>
  );
}

// Analytics utility functions
export const GoogleAnalytics4 = {
  // Track event
  event: (action: string, params?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, params);
        debugLog(`Event tracked: ${action}`, params);
      }
    } catch (error) {
      debugLog(`❌ Error tracking event "${action}":`, error);
    }
  },
  
  // Track page view
  pageview: (url: string, title?: string) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_location: url,
          page_title: title || document.title,
        });
        debugLog(`Page view tracked: ${url}`);
      }
    } catch (error) {
      debugLog(`❌ Error tracking page view for "${url}":`, error);
    }
  },
  
  // Set user properties
  setUser: (userId: string) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('set', { user_id: userId });
        debugLog(`User set: ${userId.substring(0, 4)}...`);
      }
    } catch (error) {
      debugLog('❌ Error setting user:', error);
    }
  }
}; 