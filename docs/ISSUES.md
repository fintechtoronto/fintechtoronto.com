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