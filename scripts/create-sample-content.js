// This script creates sample content for the FinTech Toronto website
// Run with: node --experimental-modules scripts/create-sample-content.mjs

// Import required dependencies
import dotenv from 'dotenv';
import { adminClient as client } from '../lib/sanity.ts';

dotenv.config({ path: '.env.local' });

// Create a user for the team
async function createUser() {
  console.log('Creating user for FinTech Toronto team...');
  
  try {
    // Check if user already exists
    const existingUser = await client.fetch(
      `*[_type == "user" && email == "teamfintechtoronto@gmail.com"][0]`
    );
    
    if (existingUser) {
      console.log('User already exists:', existingUser._id);
      return existingUser;
    }
    
    // Create user
    const user = await client.create({
      _type: 'user',
      name: 'FinTech Toronto Team',
      email: 'teamfintechtoronto@gmail.com',
      bio: 'The team behind FinTech Toronto - dedicated to building and supporting the fintech ecosystem in the Greater Toronto Area.',
      slug: {
        current: 'fintech-toronto-team',
      },
      // Using a generic avatar - in production, you'd upload a real image
      avatar: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: 'image-placeholder-128x128-' + Math.random().toString(36).substring(2, 7),
        },
      },
    });
    
    console.log('User created successfully:', user._id);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Create series
async function createSeries() {
  console.log('Creating series...');
  
  const seriesData = [
    {
      title: 'Open Banking Revolution',
      description: 'A comprehensive series exploring the implementation, challenges, and opportunities of open banking in Canada and globally.',
      slug: { current: 'open-banking-revolution' },
    },
    {
      title: 'AI in Finance',
      description: 'Examining the innovative applications of artificial intelligence and machine learning in financial services.',
      slug: { current: 'ai-in-finance' },
    },
    {
      title: 'Blockchain & DeFi',
      description: 'Exploring blockchain technology, cryptocurrencies, and the growing decentralized finance ecosystem.',
      slug: { current: 'blockchain-defi' },
    },
    {
      title: 'Startup Spotlight',
      description: 'Highlighting promising fintech startups from the Greater Toronto Area and their innovative solutions.',
      slug: { current: 'startup-spotlight' },
    },
    {
      title: 'Regulatory Landscape',
      description: 'Navigating the complex regulatory environment for financial technology companies in Canada.',
      slug: { current: 'regulatory-landscape' },
    },
  ];
  
  const createdSeries = [];
  
  for (const series of seriesData) {
    try {
      // Check if series already exists
      const existingSeries = await client.fetch(
        `*[_type == "series" && slug.current == $slug][0]`,
        { slug: series.slug.current }
      );
      
      if (existingSeries) {
        console.log(`Series "${series.title}" already exists`);
        createdSeries.push(existingSeries);
        continue;
      }
      
      // Create series with placeholder cover image
      const newSeries = await client.create({
        _type: 'series',
        title: series.title,
        description: series.description,
        slug: series.slug,
        coverImage: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: 'image-placeholder-600x400-' + Math.random().toString(36).substring(2, 7),
          },
        },
      });
      
      console.log(`Series "${series.title}" created successfully`);
      createdSeries.push(newSeries);
    } catch (error) {
      console.error(`Error creating series "${series.title}":`, error);
    }
  }
  
  return createdSeries;
}

// Create blog posts
async function createBlogPosts(user, seriesList) {
  console.log('Creating blog posts...');
  
  const blogPosts = [
    {
      title: 'The Future of Open Banking in Canada: 2024 Outlook',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: "Canada's approach to open banking has been cautious but is gaining momentum. This article explores the current state of open banking initiatives in Canada, the key stakeholders driving change, and what financial institutions and fintech companies should prepare for in the coming year.",
            },
          ],
        },
      ],
      seriesSlug: 'open-banking-revolution',
      excerpt: "An analysis of Canada's open banking roadmap and what financial institutions and fintech companies can expect in 2024.",
    },
    {
      title: 'How AI is Transforming Risk Assessment in Lending',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'Artificial intelligence and machine learning models are revolutionizing how lenders evaluate creditworthiness. This article examines how AI-driven risk assessment differs from traditional methods, the benefits for both lenders and borrowers, and the regulatory considerations that accompany these innovative approaches.',
            },
          ],
        },
      ],
      seriesSlug: 'ai-in-finance',
      excerpt: 'Exploring how machine learning algorithms are creating more accurate and inclusive lending models while navigating regulatory considerations.',
    },
    {
      title: 'Blockchain Solutions for Cross-Border Payments',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'Cross-border payments have traditionally been slow, expensive, and opaque. This article details how blockchain technology is addressing these pain points, the companies leading innovation in this space, and the challenges that remain for widespread adoption.',
            },
          ],
        },
      ],
      seriesSlug: 'blockchain-defi',
      excerpt: 'How distributed ledger technology is making international money transfers faster, cheaper, and more transparent.',
    },
    {
      title: 'Toronto Fintech Startup Secures $30M for SMB Banking Platform',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'A Toronto-based fintech startup has secured $30 million in Series A funding to expand its banking platform for small and medium-sized businesses. The company\'s innovative approach combines banking services, accounting tools, and cash flow management in a unified platform designed specifically for the needs of growing businesses.',
            },
          ],
        },
      ],
      seriesSlug: 'startup-spotlight',
      excerpt: 'A local success story as this Toronto startup attracts significant investment for its all-in-one financial platform for small businesses.',
    },
    {
      title: 'Navigating Canada\'s Anti-Money Laundering Regulations',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'AML compliance is a critical concern for fintech companies. This comprehensive guide walks through the current regulatory landscape in Canada, upcoming changes, and practical strategies for building compliant systems and processes from the ground up.',
            },
          ],
        },
      ],
      seriesSlug: 'regulatory-landscape',
      excerpt: 'A practical guide to understanding and implementing AML compliance requirements for Canadian fintech companies.',
    },
    {
      title: 'Open APIs: Building Blocks for Financial Innovation',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'Open APIs are the foundation of modern financial services innovation. This technical deep dive explains how APIs enable secure data sharing between financial institutions and third parties, common implementation approaches, and best practices for creating developer-friendly API ecosystems.',
            },
          ],
        },
      ],
      seriesSlug: 'open-banking-revolution',
      excerpt: 'The technical underpinnings of open banking and how well-designed APIs are enabling a new era of financial services.',
    },
    {
      title: 'Natural Language Processing for Financial Sentiment Analysis',
      content: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              text: 'NLP technology is transforming how financial analysts process news, social media, and corporate disclosures. This article explores current NLP techniques used in sentiment analysis, the challenges of applying these models to financial contexts, and the potential impact on investment decision-making.',
            },
          ],
        },
      ],
      seriesSlug: 'ai-in-finance',
      excerpt: 'How advanced language models are helping investors process vast amounts of textual information for market insights.',
    },
  ];
  
  const createdPosts = [];
  
  for (const post of blogPosts) {
    try {
      // Find the corresponding series
      const series = seriesList.find(s => s.slug.current === post.seriesSlug);
      
      // Check if post already exists
      const slugifiedTitle = post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const existingPost = await client.fetch(
        `*[_type == "blog" && slug.current == $slug][0]`,
        { slug: slugifiedTitle }
      );
      
      if (existingPost) {
        console.log(`Blog post "${post.title}" already exists`);
        createdPosts.push(existingPost);
        continue;
      }
      
      // Create blog post
      const newPost = await client.create({
        _type: 'blog',
        title: post.title,
        content: post.content,
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: 'image-placeholder-1200x800-' + Math.random().toString(36).substring(2, 7),
          },
        },
        publishDate: new Date().toISOString(),
        series: series ? { _type: 'reference', _ref: series._id } : undefined,
        authors: [{ _type: 'reference', _ref: user._id }],
        slug: {
          current: slugifiedTitle,
        },
        excerpt: post.excerpt,
      });
      
      console.log(`Blog post "${post.title}" created successfully`);
      createdPosts.push(newPost);
    } catch (error) {
      console.error(`Error creating blog post "${post.title}":`, error);
    }
  }
  
  return createdPosts;
}

// Main function to run the script
async function main() {
  try {
    console.log('Starting content creation script...');
    
    // Create user
    const user = await createUser();
    
    // Create series
    const seriesList = await createSeries();
    
    // Create blog posts
    const blogPosts = await createBlogPosts(user, seriesList);
    
    console.log('Content creation completed successfully!');
    console.log(`Created ${seriesList.length} series and ${blogPosts.length} blog posts`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
main(); 