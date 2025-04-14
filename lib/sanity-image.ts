import imageUrlBuilder from '@sanity/image-url'
import { client } from './sanity'

// Initialize the Sanity image URL builder
const builder = imageUrlBuilder(client)

/**
 * Helper function that provides an ImageUrlBuilder for Sanity images
 *
 * @param source Image object from Sanity with asset reference
 * @returns ImageUrlBuilder object with methods like url(), width(), height(), etc.
 */
export function urlForImage(source: any) {
  // Return the builder for the image source
  return builder.image(source)
} 