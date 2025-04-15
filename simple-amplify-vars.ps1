# PowerShell script to update AWS Amplify environment variables using simpler approach

# Amplify app ID
$APP_ID = "d190wfj1muggnx"
$PROFILE = "kabadigital"
$REGION = "us-east-1"

# Set the environment variables
$cmd = "aws amplify update-app --app-id $APP_ID --profile $PROFILE --region $REGION --environment-variables '{" +
    "\"NEXT_PUBLIC_SANITY_PROJECT_ID\":\"4zr8bnt8\"," +
    "\"SANITY_API_TOKEN\":\"sk_sanity_token_value\"," +
    "\"NEXT_PUBLIC_SUPABASE_URL\":\"https://fintoronto.supabase.co\"," +
    "\"NEXT_PUBLIC_SUPABASE_ANON_KEY\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\"," +
    "\"SUPABASE_SERVICE_ROLE_KEY\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.serviceRole\"," +
    "\"NOVU_API_KEY\":\"novu_api_key_123456\"," +
    "\"NEXT_PUBLIC_POSTHOG_KEY\":\"phc_posthogkeyvalue\"," +
    "\"NEXT_PUBLIC_POSTHOG_HOST\":\"https://us.i.posthog.com\"," +
    "\"NEXT_PUBLIC_CLOUDFRONT_URL\":\"https://d1kqhqtkvy9vds.cloudfront.net\"," +
    "\"NEXT_PUBLIC_S3_BUCKET_NAME\":\"fintoronto-media\"," +
    "\"AMPLIFY_DIFF_DEPLOY\":\"false\"," +
    "\"AMPLIFY_DIFF_DEPLOY_ROOT\":\".next\"" +
"}'"

Write-Host "Executing command:"
Write-Host $cmd

# Execute the command
Invoke-Expression $cmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Environment variables updated successfully!"
} else {
    Write-Host "Failed to update environment variables."
} 