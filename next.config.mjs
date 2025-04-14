/** @type {import('next').NextConfig} */
const nextConfig = {
  // Comment out Netlify-specific settings when deploying to Amplify
  // output: 'export',
  // distDir: 'out',
  
  // Make sure no static prerendering (useSearchParams issue)
  staticPageGenerationTimeout: 0,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  experimental: {
    // Add serverActions options
  },
  typescript: {
    // Set this to false in production to ignore TypeScript errors during build
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    // Set this to false in production to ignore ESLint errors during build
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig; 