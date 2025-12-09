// Jest setup file
// Add any global test setup here

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-for-testing'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'

// Extend Jest matchers if needed
// import '@testing-library/jest-dom'

// Global test timeout
jest.setTimeout(10000)

// Mock console.error to fail tests on unexpected errors (optional)
// const originalError = console.error
// beforeAll(() => {
//   console.error = (...args) => {
//     if (args[0]?.includes?.('Warning:')) return
//     originalError.call(console, ...args)
//   }
// })
// afterAll(() => {
//   console.error = originalError
// })
