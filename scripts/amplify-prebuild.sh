#!/bin/bash

# Amplify pre-build script for verifying environment setup
# This script runs during the Amplify build process to ensure proper configuration

echo "FinTech Toronto - Amplify Pre-Build Script"
echo "=========================================="

# Check for required environment variables
echo "Checking environment variables..."

# Function to warn about missing variables but not fail the build
check_var() {
  if [ -z "${!1}" ]; then
    echo "⚠️ Warning: $1 is not defined. Some features may not work correctly."
    return 1
  else
    return 0
  fi
}

# Check all required variables but don't exit on failure
VARS_OK=true

check_var "NEXT_PUBLIC_SUPABASE_URL" || VARS_OK=false
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" || VARS_OK=false
check_var "SUPABASE_SERVICE_ROLE_KEY" || VARS_OK=false
check_var "NEXT_PUBLIC_SANITY_PROJECT_ID" || VARS_OK=false

if [ "$VARS_OK" = false ]; then
  echo "⚠️ Some environment variables are missing. The application may not function correctly."
  echo "⚠️ Continuing with build process anyway..."
fi

# Create .env.local file with environment variables
echo "Creating .env.local file..."
cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-"placeholder-value"}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-"placeholder-value"}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-"placeholder-value"}

# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=${NEXT_PUBLIC_SANITY_PROJECT_ID:-"placeholder-value"}
SANITY_API_TOKEN=${SANITY_API_TOKEN:-"placeholder-value"}

# Novu Configuration
NOVU_API_KEY=${NOVU_API_KEY:-"placeholder-value"}

# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY:-"placeholder-value"}
NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST:-"https://us.i.posthog.com"}
EOL

echo "✅ .env.local file created successfully"

# Ensure correct pnpm version
echo "Setting up pnpm..."
npm i -g pnpm@latest

# Display versions for debugging
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PNPM version: $(pnpm -v)"

echo "Pre-build script completed successfully"
exit 0 