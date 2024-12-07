const { withSentryConfig } = require('@sentry/nextjs')

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
  
  webpack: (config, { isServer }) => {
    // Handle OpenTelemetry in middleware
    if (config.target === 'middleware' || isServer) {
      config.module = {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /node_modules\/@opentelemetry/,
            use: 'null-loader'
          }
        ]
      }
    }
    return config
  },
  
  images: {
    domains: ['res.cloudinary.com']
  },
  
  experimental: {
    // Disable instrumentation hook since we're not using it
    instrumentationHook: false
  }
}

// Separate Sentry config
const sentryConfig = {
  silent: true,
  hideSourceMaps: true,
  include: './src',
  ignore: ['node_modules/**/*', '.next/**/*', 'public/**/*']
}

// Export with Sentry
module.exports = withSentryConfig(nextConfig, sentryConfig)
