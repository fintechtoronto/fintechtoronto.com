# PowerShell script to update AWS Amplify environment variables using a JSON file

# Amplify app ID
$APP_ID = "d190wfj1muggnx"
$PROFILE = "kabadigital"
$REGION = "us-east-1"

# Read the JSON file
$jsonFile = "amplify-env-vars.json"
$jsonContent = Get-Content -Path $jsonFile -Raw

# Update the environment variables using the JSON file
Write-Host "Updating environment variables from $jsonFile..."
aws amplify update-app --app-id $APP_ID --environment-variables $jsonContent --profile $PROFILE --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "Environment variables updated successfully!"
} else {
    Write-Host "Failed to update environment variables."
} 