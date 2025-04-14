#!/bin/bash

# This script provides placeholder environment variables for Netlify builds

echo "Setting placeholder environment variables for build..."

# Create placeholder environment variables
export NEXT_PUBLIC_SANITY_PROJECT_ID="placeholder-for-build"
export NEXT_PUBLIC_SANITY_DATASET="production"
export NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder-for-build"
export SUPABASE_SERVICE_ROLE_KEY="placeholder-for-build"
export NEXT_PUBLIC_POSTHOG_KEY="placeholder-for-build"

# Log message for debugging
echo "Build variables set. Starting Next.js build..."

# Run the actual build command
pnpm build 