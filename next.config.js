/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Configure output
  distDir: '.next',
  output: 'standalone',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ]
  }
}

module.exports = nextConfig
