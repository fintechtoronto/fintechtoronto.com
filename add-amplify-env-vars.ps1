# PowerShell script to update AWS Amplify environment variables

# Amplify app ID
$APP_ID = "d190wfj1muggnx"
$PROFILE = "kabadigital"
$REGION = "us-east-1"

# Get the current app configuration
Write-Host "Getting current environment variables..."
$appConfig = aws amplify get-app --app-id $APP_ID --profile $PROFILE --region $REGION | ConvertFrom-Json

# Get current environment variables
$envVars = @{}
if ($appConfig.app.environmentVariables -ne $null) {
    foreach ($prop in $appConfig.app.environmentVariables.PSObject.Properties) {
        $envVars[$prop.Name] = $prop.Value
    }
}

# Add or update variables with actual values
$envVars["NEXT_PUBLIC_SANITY_PROJECT_ID"] = "4zr8bnt8"
$envVars["SANITY_API_TOKEN"] = "sk_sanity_token_value"
$envVars["NEXT_PUBLIC_SUPABASE_URL"] = "https://fintoronto.supabase.co"
$envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
$envVars["SUPABASE_SERVICE_ROLE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.serviceRole"
$envVars["NOVU_API_KEY"] = "novu_api_key_123456"
$envVars["NEXT_PUBLIC_POSTHOG_KEY"] = "phc_posthogkeyvalue"
$envVars["NEXT_PUBLIC_POSTHOG_HOST"] = "https://us.i.posthog.com"
$envVars["AMPLIFY_DIFF_DEPLOY"] = "false"
$envVars["AMPLIFY_DIFF_DEPLOY_ROOT"] = ".next"

# Convert the environment variables to properly formatted JSON
$envVarsJson = $envVars | ConvertTo-Json -Compress

# Update the app with the new environment variables
Write-Host "Updating environment variables..."
Write-Host "JSON: $envVarsJson"

aws amplify update-app --app-id $APP_ID --environment-variables "$envVarsJson" --profile $PROFILE --region $REGION

Write-Host "Environment variables have been updated in the Amplify app." 