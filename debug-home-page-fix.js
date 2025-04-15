// Debug script to test home page data query
require('dotenv').config(); // Load environment variables
const { createClient } = require('next-sanity');

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

// Function to update all blog posts with missing publishDate
async function fixAllBlogPostsWithMissingPublishDates() {
  try {
    console.log('Finding blog posts with missing publishDate...');
    
    const blogsWithMissingDates = await client.fetch(
      groq`*[_type == "blog" && !defined(publishDate)]{
        _id,
        title,
        _createdAt
      }`
    );
    
    console.log(`Found ${blogsWithMissingDates.length} blog posts with missing publishDate`);
    
    for (const blog of blogsWithMissingDates) {
      console.log(`Updating blog: ${blog.title}`);
      
      // Use the _createdAt timestamp as the publishDate
      await client.patch(blog._id)
        .set({ publishDate: blog._createdAt })
        .commit();
      
      console.log(`✓ Updated publishDate for "${blog.title}" to ${blog._createdAt}`);
    }
    
    console.log('All blog posts updated with publishDate!');
  } catch (error) {
    console.error('Error fixing blog post dates:', error.message);
  }
}

// Run the fix
async function run() {
  try {
    await fixAllBlogPostsWithMissingPublishDates();
    
    // Verify our changes
    const blogs = await client.fetch(
      groq`*[_type == "blog"] | order(publishDate desc){
        _id,
        title,
        publishDate
      }`
    );
    
    console.log('\nVerification - All blog posts with publish dates:');
    blogs.forEach((blog, i) => {
      console.log(`${i+1}. ${blog.title}: ${blog.publishDate}`);
    });
    
  } catch (error) {
    console.error('Error during script execution:', error);
  }
}

run(); 