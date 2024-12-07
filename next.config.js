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
  
  webpack: (config, { isServer, dev }) => {
    // Handle OpenTelemetry modules
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/api': require.resolve('./src/lib/noop.js'),
        '@opentelemetry/core': require.resolve('./src/lib/noop.js'),
        '@opentelemetry/sdk-trace-base': require.resolve('./src/lib/noop.js'),
        '@opentelemetry/sdk-trace-node': require.resolve('./src/lib/noop.js'),
        '@opentelemetry/resources': require.resolve('./src/lib/noop.js'),
        '@opentelemetry/semantic-conventions': require.resolve('./src/lib/noop.js'),
        '@opentelemetry/instrumentation': require.resolve('./src/lib/noop.js'),
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
