// Debug script to test Sanity client and fetching
require('dotenv').config(); // Load environment variables from .env files

// Import the createClient function from next-sanity
const { createClient } = require('next-sanity');

// Log environment variables for debugging
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SANITY_PROJECT_ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
console.log('SANITY_TOKEN:', process.env.SANITY_TOKEN ? 'Present (value hidden)' : 'Missing');
console.log('NEXT_PUBLIC_SANITY_DATASET:', process.env.NEXT_PUBLIC_SANITY_DATASET || 'production (default)');

// Create client with the same configuration as in the app
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-04-11',
  useCdn: false, // Set to false to ensure we're not getting cached data
  token: process.env.SANITY_TOKEN, // Include token for authenticated requests
});

// Helper for GROQ queries (same as in the app)
const groq = String.raw;

// Fetch and log blog posts
async function fetchBlogPosts() {
  try {
    console.log('\nAttempting to fetch blog posts...');
    
    const query = groq`*[_type == "blog"] | order(publishDate desc)[0...5]{
      _id,
      title,
      slug,
      publishDate,
      _createdAt,
      _updatedAt
    }`;
    
    const posts = await client.fetch(query);
    
    console.log(`\nFound ${posts.length} blog posts:`);
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`);
      console.log(`   ID: ${post._id}`);
      console.log(`   Slug: ${post.slug?.current || 'No slug'}`);
      console.log(`   Created: ${post._createdAt}`);
      console.log(`   Updated: ${post._updatedAt}`);
      console.log(`   Published: ${post.publishDate || 'No publish date'}`);
    });
  } catch (error) {
    console.error('\nError fetching blog posts:', error.message);
    if (error.response) {
      console.error('Response details:', error.response);
    }
  }
}

// Fetch all document types to verify connectivity
async function fetchDocumentTypes() {
  try {
    console.log('\nAttempting to fetch all document types...');
    
    const query = groq`*[]{_type} | group by _type | {_type: _type}`;
    
    const types = await client.fetch(query);
    
    console.log('\nDocument types in dataset:');
    console.log(types.map(t => t._type));
  } catch (error) {
    console.error('\nError fetching document types:', error.message);
  }
}

// Run all checks
async function runDiagnostics() {
  try {
    await fetchDocumentTypes();
    await fetchBlogPosts();
    console.log('\nDiagnostics completed.');
  } catch (error) {
    console.error('\nAn error occurred during diagnostics:', error);
  }
}

runDiagnostics(); 