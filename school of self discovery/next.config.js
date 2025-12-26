/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
  },
  // Remove static export for Vercel deployment
  // output: 'export', // Only for GitHub Pages
  trailingSlash: true,
}

module.exports = nextConfig


