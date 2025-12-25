/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? '/sosd' : ''

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // Required for GitHub Pages
  },
  output: 'export', // Static export for GitHub Pages
  trailingSlash: true,
  basePath: basePath,
  assetPrefix: basePath,
}

module.exports = nextConfig


