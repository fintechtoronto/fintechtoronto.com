// This script creates sample content for the FinTech Toronto website
// Run with: npx ts-node scripts/create-sample-content-ts.ts

require('dotenv').config();
const { adminClient } = require('../lib/sanity');

// Sample content data
const seriesData = [
  {
    title: 'Payments Innovation',
    description: 'Exploring the evolving landscape of payment technologies, from real-time payments to digital wallets and cryptocurrency.',
    slug: { current: 'payments-innovation' },
  },
  {
    title: 'Wealth Management Tech',
    description: 'Examining how technology is transforming wealth management through robo-advisors, personalized investing, and financial planning tools.',
    slug: { current: 'wealth-management-tech' },
  },
  {
    title: 'Financial Inclusion',
    description: 'Highlighting initiatives and technologies that aim to bring financial services to underserved communities across Canada.',
    slug: { current: 'financial-inclusion' },
  },
];

// Main function to create series
async function createSeries() {
  console.log('Creating series...');
  
  for (const series of seriesData) {
    try {
      // Check if series already exists
      const existingSeries = await adminClient.fetch(
        `*[_type == "series" && slug.current == $slug][0]`,
        { slug: series.slug.current }
      );
      
      if (existingSeries) {
        console.log(`Series "${series.title}" already exists`);
        continue;
      }
      
      // Create series
      const newSeries = await adminClient.create({
        _type: 'series',
        title: series.title,
        description: series.description,
        slug: series.slug,
      });
      
      console.log(`Series "${series.title}" created successfully with ID: ${newSeries._id}`);
    } catch (error) {
      console.error(`Error creating series "${series.title}":`, error);
    }
  }
}

// Run the script
async function main() {
  try {
    console.log('Starting content creation script...');
    await createSeries();
    console.log('Content creation completed!');
  } catch (error) {
    console.error('Script failed:', error);
  }
}

main(); 