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
  },
  webpack(config, { isServer, dev }) {
    if (isServer && dev) {
      config.output.chunkFilename = "[id].js"
    }
    return config
  },
}

export default nextConfig
