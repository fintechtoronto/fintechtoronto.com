/**
 * This script verifies the Sanity token has appropriate permissions
 * Run with: node scripts/verify-sanity-token.js
 */

require('dotenv').config();
const { createClient } = require('@sanity/client');

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error('❌ NEXT_PUBLIC_SANITY_PROJECT_ID is not defined');
  process.exit(1);
}

if (!token) {
  console.error('❌ SANITY_API_TOKEN is not defined');
  process.exit(1);
}

console.log('Verifying Sanity token...');
console.log(`Project ID: ${projectId}`);
console.log(`Dataset: ${dataset}`);
console.log(`Token: ${token.substring(0, 5)}...${token.substring(token.length - 5)}`);

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-04-11',
  token,
  useCdn: false,
});

async function testWrite() {
  try {
    // Test creating a document
    const doc = {
      _type: 'test',
      title: 'Test Document',
      _id: `test-${Date.now()}`,
    };

    console.log('Creating test document...');
    const result = await client.createOrReplace(doc);
    console.log('✅ Document created successfully:', result._id);

    // Test deleting the document
    console.log('Deleting test document...');
    await client.delete(result._id);
    console.log('✅ Document deleted successfully');

    console.log('\n✅ Sanity token has write permissions');
    return true;
  } catch (error) {
    console.error('\n❌ Error testing Sanity token:', error.message);
    console.log('\nPlease check:');
    console.log('1. Your token value is correct');
    console.log('2. The token has write permissions in Sanity');
    console.log('3. The token has access to the specified dataset');
    
    return false;
  }
}

// Test read permissions
async function testRead() {
  try {
    console.log('Testing read access...');
    const result = await client.fetch('*[_type == "sanity.documents"][0...1]');
    console.log(`✅ Successfully read from dataset`);
    return true;
  } catch (error) {
    console.error('\n❌ Error reading from Sanity:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n=== Testing Sanity Permissions ===\n');
  
  const readOk = await testRead();
  const writeOk = await testWrite();
  
  if (readOk && writeOk) {
    console.log('\n✅ All tests passed. Your Sanity setup is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check your Sanity configuration.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
}); 