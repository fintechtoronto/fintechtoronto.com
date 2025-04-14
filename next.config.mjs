/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    // Add serverActions options
  },
  typescript: {
    // Set this to false in production to avoid type checking slowing builds
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    // Set this to false in production to avoid ESLint checking slowing builds
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // Configure output for Netlify
  output: 'standalone',
};

export default nextConfig; 