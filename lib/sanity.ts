import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { groq } from 'next-sanity'

// Configure datasets with proper fallbacks
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzo0lug0'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2023-05-03'

// Standard client for fetching data
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
})

// Admin client for content creation operations
export const adminClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

// Helper for image URL generation
const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// Wrapper function for safer queries
export async function querySanity(query: string, params = {}) {
  try {
    return await client.fetch(query, params)
  } catch (error) {
    console.error('Sanity query error:', error)
    return null
  }
}

// Export groq for easy importing throughout the app
export { groq } 