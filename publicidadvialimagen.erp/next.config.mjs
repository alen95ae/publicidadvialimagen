/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: false, // importante - habilita optimización automática
    minimumCacheTTL: 31536000, // 1 año en CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ibmihmfpogmzofvctmjz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
