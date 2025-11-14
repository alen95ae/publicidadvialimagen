/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ibmihmfpogmzofvctmjz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
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

export default nextConfig
