/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable standalone output which causes symlink issues on Windows
  // output: 'standalone',
  
  // Disable image optimization during development
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
    domains: ['cdn.sanity.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '**',
      },
    ],
  },
  
  // Optimize for smaller bundles
  swcMinify: true,
  
  // Configure build timeouts for slower Amplify builds
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  webpack: (config) => {
    // Optimize bundle size by ignoring large packages in server components
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    
    // Fix for Windows EPERM issues
    if (process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/articles',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/admin/users',
        permanent: false,
      },
    ];
  },
  
  // Add PostHog rewrites for ingest APIs
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
  
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  
  // Disable static rendering for pages with client components that use contexts
  // This prevents "Cannot read properties of null (reading 'useContext')" errors
  staticPageGenerationTimeout: 30,
  poweredByHeader: false,
};

module.exports = nextConfig;
