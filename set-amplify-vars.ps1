# PowerShell script to update AWS Amplify environment variables one at a time

# Amplify app ID
$APP_ID = "d190wfj1muggnx"
$PROFILE = "kabadigital"
$REGION = "us-east-1"

# Function to set a single environment variable
function Set-AmplifyEnvVar {
    param (
        [string]$Key,
        [string]$Value
    )
    
    Write-Host "Setting $Key..."
    
    # Create JSON for single variable
    $jsonVar = "{`"$Key`":`"$Value`"}"
    
    # Run the command
    aws amplify update-app --app-id $APP_ID --environment-variables $jsonVar --profile $PROFILE --region $REGION
    
    # Check the result
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully set $Key"
    } else {
        Write-Host "Failed to set $Key"
    }
}

# Set environment variables one at a time
Set-AmplifyEnvVar "NEXT_PUBLIC_SANITY_PROJECT_ID" "4zr8bnt8"
Set-AmplifyEnvVar "SANITY_API_TOKEN" "sk_sanity_token_value"
Set-AmplifyEnvVar "NEXT_PUBLIC_SUPABASE_URL" "https://fintoronto.supabase.co"
Set-AmplifyEnvVar "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
Set-AmplifyEnvVar "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.serviceRole"
Set-AmplifyEnvVar "NOVU_API_KEY" "novu_api_key_123456"
Set-AmplifyEnvVar "NEXT_PUBLIC_POSTHOG_KEY" "phc_posthogkeyvalue"
Set-AmplifyEnvVar "NEXT_PUBLIC_POSTHOG_HOST" "https://us.i.posthog.com"
Set-AmplifyEnvVar "AMPLIFY_DIFF_DEPLOY" "false"
Set-AmplifyEnvVar "AMPLIFY_DIFF_DEPLOY_ROOT" ".next"

Write-Host "Environment variables have been updated in the Amplify app." 