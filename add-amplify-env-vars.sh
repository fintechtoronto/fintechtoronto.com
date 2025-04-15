#!/bin/bash

# Amplify app ID
APP_ID="d190wfj1muggnx"
PROFILE="kabadigital"
REGION="us-east-1"

# First, get the current environment variables
echo "Getting current environment variables..."
CURRENT_ENV_VARS=$(aws amplify get-app --app-id $APP_ID --profile $PROFILE --region $REGION --query 'app.environmentVariables' --output json)

# Convert to a format we can use
CURRENT_ENV_VARS=$(echo $CURRENT_ENV_VARS | tr -d '{}' | tr ',' '\n' | tr -d '"' | tr ':' '=')

# Create an associative array to store current env vars
declare -A ENV_VARS

# Parse the current environment variables
if [ -n "$CURRENT_ENV_VARS" ]; then
  while IFS='=' read -r key value; do
    if [ -n "$key" ]; then
      ENV_VARS["$key"]="$value"
    fi
  done <<< "$CURRENT_ENV_VARS"
fi

# Add or update the environment variables
# Note: You need to replace the placeholders with actual values

# Sanity Configuration
ENV_VARS["NEXT_PUBLIC_SANITY_PROJECT_ID"]="your_project_id"
ENV_VARS["SANITY_API_TOKEN"]="your_sanity_token"

# Supabase Configuration
ENV_VARS["NEXT_PUBLIC_SUPABASE_URL"]="https://your-project-id.supabase.co"
ENV_VARS["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="your_anon_key"
ENV_VARS["SUPABASE_SERVICE_ROLE_KEY"]="your_service_role_key"

# Novu Configuration
ENV_VARS["NOVU_API_KEY"]="your_novu_api_key"

# PostHog Configuration
ENV_VARS["NEXT_PUBLIC_POSTHOG_KEY"]="your_posthog_key"
ENV_VARS["NEXT_PUBLIC_POSTHOG_HOST"]="https://us.i.posthog.com"

# CloudFront and S3 Configuration
ENV_VARS["NEXT_PUBLIC_CLOUDFRONT_URL"]="https://d1kqhqtkvy9vds.cloudfront.net"
ENV_VARS["NEXT_PUBLIC_S3_BUCKET_NAME"]="fintoronto-media"

# AWS Amplify specific
ENV_VARS["AMPLIFY_DIFF_DEPLOY"]="false"
ENV_VARS["AMPLIFY_DIFF_DEPLOY_ROOT"]=".next"

# Build the environment variables parameter
ENV_VARS_PARAM=""
for key in "${!ENV_VARS[@]}"; do
  if [ -n "$ENV_VARS_PARAM" ]; then
    ENV_VARS_PARAM="$ENV_VARS_PARAM,"
  fi
  ENV_VARS_PARAM="$ENV_VARS_PARAM\"$key=${ENV_VARS[$key]}\""
done

# Update the app with all environment variables
echo "Updating environment variables..."
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables "{$ENV_VARS_PARAM}" \
  --profile $PROFILE \
  --region $REGION

echo "Environment variables have been updated in the Amplify app." 