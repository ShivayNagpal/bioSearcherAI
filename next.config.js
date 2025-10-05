/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['wikipedia']
  }
}

module.exports = nextConfig