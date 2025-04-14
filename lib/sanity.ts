import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

// Client for reading data (public)
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-04-11',
  useCdn: process.env.NODE_ENV === 'production',
})

// Client with write access (for admin operations)
export const adminClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-04-11',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// Helper to generate GROQ queries
export const groq = String.raw 