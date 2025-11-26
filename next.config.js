/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      // AWS S3 buckets for file uploads
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      // Cloudinary (alternative CDN)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Add additional trusted domains as needed
    ],
  },
}

module.exports = nextConfig
