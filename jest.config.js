const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@kinde-oss|@testing-library|@babel|@swc|next/dist|next/dynamic|next/app|next/navigation|next/router|next/link|next/image|next/font|@next/env|jose|@panva|oidc-token-hash|cookie|nanoid|next-auth|@auth|preact|preact-render-to-string|swr|react-ssr-prepass|uuid|uncrypto)/.*)'
  ]
}

module.exports = createJestConfig(customJestConfig)