# Project Issues

## High Priority

### 1. Series Creation RLS Policy Violation

**Status:** Open  
**Priority:** High  
**Assignee:** TBD

#### Description

When attempting to create a new series from the admin dashboard, the operation fails with a Row-Level Security (RLS) policy violation:

```
Error creating series: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "series"'
}
```

The error occurs even after implementing a server-side API route (`/api/admin/series`) to bypass client-side restrictions.

#### Logs

The server logs show:
- "No SUPABASE_SERVICE_ROLE_KEY found. Admin functions may not work properly."
- Verification that the user is authenticated and has superadmin privileges
- RLS policy violations when attempting to create series

#### Steps to Reproduce

1. Log in as a superadmin user
2. Navigate to `/admin/series`
3. Click "New Series"
4. Fill in the form details
5. Click "Create Series"
6. Observe 400 Bad Request error and RLS policy violation message

#### Attempted Solutions

1. Added proper service role key to .env.local
2. Created server-side API routes to handle database operations
3. Implemented RLS policies to allow admins to perform operations

#### Next Steps

1. **Verify Service Role Key:** Confirm the service role key is being correctly loaded from .env.local
2. **Debug API Route:** Add logging to /api/admin/series route to confirm environment variables are available
3. **Apply RLS Policies Directly:** Run SQL to explicitly grant admin access to series table
4. **Consider Server Actions:** Replace API routes with Next.js server actions for better environment variable handling

#### SQL for RLS Policy Fix

```sql
-- Enable RLS on series table
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- Clear any existing policies 
DROP POLICY IF EXISTS "Admins can perform all operations on series" ON public.series;
DROP POLICY IF EXISTS "Anyone can read approved series" ON public.series;
DROP POLICY IF EXISTS "Users can read their own series" ON public.series;

-- Create admin access policy
CREATE POLICY "Admins can perform all operations on series" ON public.series
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'superadmin')
    )
  );

-- Create policy for reading approved series
CREATE POLICY "Anyone can read approved series" ON public.series
  FOR SELECT
  USING (status = 'approved');

-- Create policy for users to read their own series  
CREATE POLICY "Users can read their own series" ON public.series
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
```

### 2. PostHog Analytics Integration

**Status:** Complete  
**Priority:** Medium  
**Assignee:** N/A

#### Description

Implement PostHog analytics tracking throughout the application to capture user behavior, page views, and key interactions to better understand user engagement and improve the application.

#### Implementation Details

1. Added PostHog JavaScript client (`posthog-js`) to the project
2. Created a `PostHogProvider` component that:
   - Initializes PostHog with the project's API key
   - Tracks page views automatically
   - Provides utility functions for tracking custom events
3. Integrated user identification in the authentication flow:
   - Identifies users upon login with email and metadata
   - Sets persistent super properties for user segmentation
   - Tracks sign-in and sign-out events
4. Made analytics available throughout the application via the `Analytics` object

#### Configuration

The PostHog provider is initialized with the following configuration:
- API Key: `phx_LXjGZ1EC7mUdPOKz91bAgO0BFHX4u3zlQy60f0I4VH4tK7t`
- Host URL: `https://app.posthog.com` (default)
- Manual page view capturing for better control
- Automatic page leave tracking

#### Usage Examples

Track a custom event:
```typescript
import { Analytics } from '@/components/analytics/posthog-provider'

// Track a button click
Analytics.track('button_clicked', { 
  button_name: 'sign_up', 
  location: 'homepage' 
})
```

Identify a user:
```typescript
// Identify user with additional traits
Analytics.identify(userId, {
  plan: 'premium',
  company: 'Acme Inc'
})
```

#### Next Steps

1. Create dashboards in the PostHog UI to analyze user behavior
2. Set up funnels to track conversion paths
3. Implement more detailed event tracking for key user flows
4. Consider setting up A/B testing for future feature development 