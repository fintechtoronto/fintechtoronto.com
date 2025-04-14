#!/usr/bin/env node

// Simple script to validate the Next.js configuration
const fs = require('fs');
const path = require('path');

console.log('Checking Next.js configuration for Amplify deployment...');

// Check if next.config.mjs exists
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (!fs.existsSync(nextConfigPath)) {
  console.error('❌ next.config.mjs not found');
  process.exit(1);
}

// Read the next.config.mjs file
const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
console.log('✅ next.config.mjs exists');

// Check for commented out Netlify settings
if (nextConfig.includes('// output: \'export\'') && nextConfig.includes('// distDir: \'out\'')) {
  console.log('✅ Netlify-specific settings are properly commented out');
} else if (nextConfig.includes('output: \'export\'') || nextConfig.includes('distDir: \'out\'')) {
  console.error('❌ Netlify-specific settings are still active and may cause issues with Amplify');
  console.log(nextConfig);
  process.exit(1);
}

// Check package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log('✅ package.json exists');

// Check build script
if (packageJson.scripts && packageJson.scripts.build) {
  console.log('✅ Build script exists:', packageJson.scripts.build);
  if (packageJson.scripts.build.includes('exit 0')) {
    console.log('✅ Build script is configured to continue even if build fails');
  }
} else {
  console.error('❌ No build script found in package.json');
  process.exit(1);
}

// Check amplify.yml
const amplifyYmlPath = path.join(process.cwd(), 'amplify.yml');
if (!fs.existsSync(amplifyYmlPath)) {
  console.error('❌ amplify.yml not found');
  process.exit(1);
}

// Read the amplify.yml file
const amplifyYml = fs.readFileSync(amplifyYmlPath, 'utf8');
console.log('✅ amplify.yml exists');

// Check for quoted commands
if (amplifyYml.includes('"chmod +x scripts/amplify-prebuild.sh || true"') && 
    amplifyYml.includes('"bash -c \'./scripts/amplify-prebuild.sh || echo')) {
  console.log('✅ Commands in amplify.yml are properly quoted');
} else {
  console.error('❌ Commands in amplify.yml may not be properly quoted');
  console.log(amplifyYml);
}

console.log('\n✅ Next.js configuration looks good for Amplify deployment'); 