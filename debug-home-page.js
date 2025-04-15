// Debug script to test home page data query
require('dotenv').config(); // Load environment variables
const { createClient } = require('next-sanity');

// Log environment variables
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SANITY_PROJECT_ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
console.log('SANITY_TOKEN:', process.env.SANITY_TOKEN ? 'Present (value hidden)' : 'Missing');
console.log('NEXT_PUBLIC_SANITY_DATASET:', process.env.NEXT_PUBLIC_SANITY_DATASET || 'production (default)');

// Create client with same config as app
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-04-11',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
});

// Helper for GROQ queries
const groq = String.raw;

// Query function from home page
async function getHomePageData() {
  console.log('\nRunning exact home page query...');
  
  try {
    const blogs = await client.fetch(
      groq`*[_type == "blog"] | order(publishDate desc)[0...3]{
        _id,
        title,
        slug,
        publishDate,
        image,
        series->{
          title,
          slug
        },
        authors[]->{
          name,
          slug
        }
      }`
    );
    
    console.log(`\nFound ${blogs.length} blogs with the home page query`);
    return { blogs };
  } catch (error) {
    console.error('Error fetching blog posts:', error.message);
    return { blogs: [] };
  }
}

// Query without order or filtering
async function getAllBlogPosts() {
  console.log('\nRunning simple query for all blog posts...');
  
  try {
    const blogs = await client.fetch(
      groq`*[_type == "blog"]{
        _id,
        title,
        slug,
        publishDate,
        _createdAt,
        _updatedAt
      }`
    );
    
    console.log(`\nFound ${blogs.length} total blog posts`);
    blogs.forEach((blog, index) => {
      console.log(`\n${index + 1}. ${blog.title || 'No title'}`);
      console.log(`   ID: ${blog._id}`);
      console.log(`   Slug: ${blog.slug?.current || 'No slug'}`);
      console.log(`   Created: ${blog._createdAt}`);
      console.log(`   Updated: ${blog._updatedAt}`);
      console.log(`   publishDate: ${blog.publishDate || 'MISSING PUBLISH DATE'}`);
    });
    
    return blogs;
  } catch (error) {
    console.error('Error fetching all blog posts:', error.message);
    return [];
  }
}

// Test for empty string or null publish dates
async function checkPublishDateFormats() {
  console.log('\nChecking publish date formats...');
  
  try {
    const blogs = await client.fetch(
      groq`*[_type == "blog"]{
        _id,
        title,
        publishDate
      }`
    );
    
    console.log('\nAnalyzing publishDate values:');
    
    const withMissingDates = blogs.filter(b => !b.publishDate);
    const withEmptyDates = blogs.filter(b => b.publishDate === '');
    const withValidDates = blogs.filter(b => b.publishDate && b.publishDate !== '');
    
    console.log(`- Posts with missing publishDate: ${withMissingDates.length}`);
    console.log(`- Posts with empty publishDate: ${withEmptyDates.length}`);
    console.log(`- Posts with valid publishDate: ${withValidDates.length}`);
    
    if (withValidDates.length > 0) {
      console.log('\nValid publishDate formats found:');
      withValidDates.forEach((blog, i) => {
        console.log(`${i+1}. ${blog.title}: ${blog.publishDate}`);
      });
    }
    
    return { withMissingDates, withEmptyDates, withValidDates };
  } catch (error) {
    console.error('Error checking publish dates:', error.message);
    return {};
  }
}

// Run diagnostics
async function run() {
  try {
    // Get all blog posts without filtering or ordering
    await getAllBlogPosts();
    
    // Check publishDate formats
    await checkPublishDateFormats();
    
    // Test the exact home page query
    const { blogs } = await getHomePageData();
    
    console.log('\nBlog posts that would show on home page:');
    if (blogs.length === 0) {
      console.log('NO BLOG POSTS WOULD SHOW ON HOME PAGE');
    } else {
      blogs.forEach((blog, index) => {
        console.log(`${index + 1}. ${blog.title || 'No title'}`);
        console.log(`   Slug: ${blog.slug?.current || 'No slug'}`);
        console.log(`   publishDate: ${blog.publishDate || 'MISSING'}`);
        console.log(`   Series: ${blog.series?.title || 'None'}`);
      });
    }
    
    console.log('\nDiagnostics completed');
  } catch (error) {
    console.error('Error during diagnostics:', error);
  }
}

run(); 