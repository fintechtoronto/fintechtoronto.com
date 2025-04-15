import { Analytics as PostHogAnalytics } from './posthog-provider';
import { GoogleAnalytics4 } from './google-analytics';

// Check if analytics platforms are enabled
const isPostHogEnabled = typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;
const isGAEnabled = typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_GA_ID;

/**
 * Unified Analytics API that sends events to both PostHog and Google Analytics 4
 */
export const Analytics = {
  /**
   * Track an event in both PostHog and Google Analytics
   * @param eventName The name of the event to track
   * @param properties Properties to send with the event
   */
  track: (eventName: string, properties?: Record<string, any>) => {
    try {
      // Track in PostHog
      if (isPostHogEnabled) {
        PostHogAnalytics.track(eventName, properties);
      }
      
      // Track in Google Analytics 4
      if (isGAEnabled) {
        GoogleAnalytics4.event(eventName, properties);
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  },
  
  /**
   * Identify a user in analytics platforms
   * @param userId The user's ID
   * @param traits User properties/traits
   */
  identify: (userId: string, traits?: Record<string, any>) => {
    try {
      // Identify in PostHog
      if (isPostHogEnabled) {
        PostHogAnalytics.identify(userId, traits);
      }
      
      // Set user ID in Google Analytics
      if (isGAEnabled) {
        GoogleAnalytics4.setUser(userId);
      }
    } catch (error) {
      console.error('Error identifying user:', error);
    }
  },
  
  /**
   * Reset the current user (typically used on logout)
   */
  reset: () => {
    try {
      // Reset in PostHog
      if (isPostHogEnabled) {
        PostHogAnalytics.reset();
      }
    } catch (error) {
      console.error('Error resetting user:', error);
    }
  },
  
  /**
   * Register persistent super properties in PostHog
   * @param properties The properties to register
   */
  register: (properties: Record<string, any>) => {
    try {
      // Only available in PostHog
      if (isPostHogEnabled) {
        PostHogAnalytics.register(properties);
      }
    } catch (error) {
      console.error('Error registering properties:', error);
    }
  },
  
  /**
   * Track a page view (typically not needed as it's handled automatically)
   * @param url The URL that was viewed
   * @param title The page title
   */
  pageview: (url: string, title?: string) => {
    try {
      // Page views are handled automatically in the providers,
      // but this can be used for manual tracking if needed
      if (isGAEnabled) {
        GoogleAnalytics4.pageview(url, title);
      }
    } catch (error) {
      console.error('Error tracking pageview:', error);
    }
  }
};

export default Analytics; 