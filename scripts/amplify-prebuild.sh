#!/bin/bash
set -e

echo "Running Amplify prebuild script..."

# Verify essential environment variables
echo "Verifying environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL is not set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "⚠️ Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY is not set"
fi

if [ -z "$NEXT_PUBLIC_SANITY_PROJECT_ID" ]; then
  echo "⚠️ Warning: NEXT_PUBLIC_SANITY_PROJECT_ID is not set"
  echo "Using default project ID: zzo0lug0"
fi

if [ -z "$SANITY_API_TOKEN" ]; then
  echo "⚠️ Warning: SANITY_API_TOKEN is not set"
fi

if [ -z "$SANITY_WEBHOOK_SECRET" ]; then
  echo "⚠️ Warning: SANITY_WEBHOOK_SECRET is not set"
fi

# Setup AWS CLI configuration if media storage is needed
if [ ! -z "$KABADIGITAL_ACCESS_KEY_ID" ] && [ ! -z "$KABADIGITAL_SECRET_ACCESS_KEY" ]; then
  echo "Setting up AWS credentials for media storage..."
  mkdir -p ~/.aws
  cat > ~/.aws/credentials << EOL
[kabadigital]
aws_access_key_id=${KABADIGITAL_ACCESS_KEY_ID}
aws_secret_access_key=${KABADIGITAL_SECRET_ACCESS_KEY}
EOL
  cat > ~/.aws/config << EOL
[profile kabadigital]
region=us-east-1
output=json
EOL
  echo "AWS credentials configured successfully."
else
  echo "⚠️ Warning: AWS credentials for media storage not set"
fi

# Run database migration check
echo "Checking for pending migrations..."
node scripts/verify-service-role.js || echo "⚠️ Warning: Service role verification failed, but continuing..."

echo "Prebuild script completed." 