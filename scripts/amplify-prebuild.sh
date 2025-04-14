#!/bin/bash

# Amplify pre-build script for verifying environment setup
# This script runs during the Amplify build process to ensure proper configuration

echo "FinTech Toronto - Amplify Pre-Build Script"
echo "=========================================="

# Check for required environment variables
echo "Checking environment variables..."

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL is not defined"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is not defined"
  echo "This must be set in the Amplify Console Environment Variables"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SANITY_PROJECT_ID" ]; then
  echo "❌ NEXT_PUBLIC_SANITY_PROJECT_ID is not defined"
  exit 1
fi

# Create .env.local file with environment variables
echo "Creating .env.local file..."
cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=${NEXT_PUBLIC_SANITY_PROJECT_ID}
SANITY_API_TOKEN=${SANITY_API_TOKEN}

# Novu Configuration
NOVU_API_KEY=${NOVU_API_KEY}
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