import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hrylgpvuxiglkmwlodnt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    const worker = process.env.WORKER_API_URL || 'http://127.0.0.1:8000'
    return [
      {
        source: '/api/worker/:path*',
        destination: `${worker}/:path*`,
      },
    ]
  },
}

export default nextConfig
