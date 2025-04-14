# Deployment Guide - AWS Amplify

This document outlines the process for deploying the FinTech Toronto application to AWS Amplify.

## Prerequisites

1. AWS account with Amplify access
2. GitHub repository connected to AWS Amplify
3. Supabase project with service role key

## Environment Variables

The following environment variables must be set in the Amplify console:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://zxjxpmpzcsxjahfzcikg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Sanity Configuration
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
SANITY_API_TOKEN=your_sanity_token
```

### Novu Configuration (if using)
```
NOVU_API_KEY=your_novu_api_key
```

## Fixing the Service Role Key Issue

The RLS Policy issue with series creation can be resolved by:

1. Ensuring the correct `SUPABASE_SERVICE_ROLE_KEY` is set in the Amplify environment variables
2. Running the SQL script to add RLS policies to the series table (see below)

### SQL for RLS Policy Fix

Connect to your Supabase project and execute this SQL in the SQL Editor:

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

## Deployment Steps

1. **Connect Repository**
   - Log in to the AWS Management Console
   - Navigate to AWS Amplify
   - Choose "New app" > "Host web app" 
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Select the branch to deploy
   - Confirm the auto-detected settings or use the custom `amplify.yml` file in the repository

3. **Set Environment Variables**
   - Add all environment variables listed above
   - Make sure to keep the service role key secure

4. **Advanced Settings**
   - Under "Build settings" > "Advanced settings"
   - Set the build output directory to `.next`
   - Enable server-side rendering if needed

5. **Deploy**
   - Save and deploy the application
   - Monitor the build logs for any issues

## Verifying Deployment

1. Check the Amplify console for build success
2. Verify the deployed URL works correctly
3. Test admin functionality, especially series creation

## Troubleshooting

If you encounter RLS policy issues after deployment:

1. Verify environment variables are correctly set in Amplify
2. Check server logs for the message "No SUPABASE_SERVICE_ROLE_KEY found"
3. Run the SQL script again in Supabase
4. Consider modifying the server-side API route to use stronger logging

## CI/CD Configuration

For continuous deployment:

1. Set up branch-based deployments in Amplify
2. Configure preview deployments for pull requests
3. Add build notifications to your team communication channels 