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
        hostname: 'images.unsplash.com',
      },
    ],
  },
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
  },
  webpack(config, { isServer, dev }) {
    if (isServer && dev) {
      config.output.chunkFilename = "[id].js"
    }
    return config
  },
}

module.exports = nextConfig
