@echo off
echo Updating AWS Amplify environment variables...

set APP_ID=d190wfj1muggnx
set PROFILE=kabadigital
set REGION=us-east-1

REM Create individual environment variables one by one
echo Setting NEXT_PUBLIC_SANITY_PROJECT_ID...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"NEXT_PUBLIC_SANITY_PROJECT_ID\":\"4zr8bnt8\"}" --profile %PROFILE% --region %REGION%

echo Setting SANITY_API_TOKEN...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"SANITY_API_TOKEN\":\"sk_sanity_token_value\"}" --profile %PROFILE% --region %REGION%

echo Setting NEXT_PUBLIC_SUPABASE_URL...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"NEXT_PUBLIC_SUPABASE_URL\":\"https://fintoronto.supabase.co\"}" --profile %PROFILE% --region %REGION%

echo Setting NEXT_PUBLIC_SUPABASE_ANON_KEY...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"NEXT_PUBLIC_SUPABASE_ANON_KEY\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\"}" --profile %PROFILE% --region %REGION%

echo Setting SUPABASE_SERVICE_ROLE_KEY...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"SUPABASE_SERVICE_ROLE_KEY\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.serviceRole\"}" --profile %PROFILE% --region %REGION%

echo Setting NOVU_API_KEY...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"NOVU_API_KEY\":\"novu_api_key_123456\"}" --profile %PROFILE% --region %REGION%

echo Setting NEXT_PUBLIC_POSTHOG_KEY...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"NEXT_PUBLIC_POSTHOG_KEY\":\"phc_posthogkeyvalue\"}" --profile %PROFILE% --region %REGION%

echo Setting NEXT_PUBLIC_POSTHOG_HOST...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"NEXT_PUBLIC_POSTHOG_HOST\":\"https://us.i.posthog.com\"}" --profile %PROFILE% --region %REGION%

echo Setting AMPLIFY_DIFF_DEPLOY...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"AMPLIFY_DIFF_DEPLOY\":\"false\"}" --profile %PROFILE% --region %REGION%

echo Setting AMPLIFY_DIFF_DEPLOY_ROOT...
aws amplify update-app --app-id %APP_ID% --environment-variables "{\"AMPLIFY_DIFF_DEPLOY_ROOT\":\".next\"}" --profile %PROFILE% --region %REGION%

echo Environment variables have been updated in the Amplify app. 