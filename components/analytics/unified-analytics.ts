import { Analytics as PostHogAnalytics } from './posthog-provider';
import { GoogleAnalytics4 } from './google-analytics';

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
    // Track in PostHog
    PostHogAnalytics.track(eventName, properties);
    
    // Track in Google Analytics 4
    GoogleAnalytics4.event(eventName, properties);
  },
  
  /**
   * Identify a user in analytics platforms
   * @param userId The user's ID
   * @param traits User properties/traits
   */
  identify: (userId: string, traits?: Record<string, any>) => {
    // Identify in PostHog
    PostHogAnalytics.identify(userId, traits);
    
    // Set user ID in Google Analytics
    GoogleAnalytics4.setUser(userId);
  },
  
  /**
   * Reset the current user (typically used on logout)
   */
  reset: () => {
    // Reset in PostHog
    PostHogAnalytics.reset();
  },
  
  /**
   * Register persistent super properties in PostHog
   * @param properties The properties to register
   */
  register: (properties: Record<string, any>) => {
    // Only available in PostHog
    PostHogAnalytics.register(properties);
  },
  
  /**
   * Track a page view (typically not needed as it's handled automatically)
   * @param url The URL that was viewed
   * @param title The page title
   */
  pageview: (url: string, title?: string) => {
    // Page views are handled automatically in the providers,
    // but this can be used for manual tracking if needed
    GoogleAnalytics4.pageview(url, title);
  }
};

export default Analytics; 