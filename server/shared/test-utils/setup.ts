import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { connectTestDatabase, clearTestDatabase, closeTestDatabase } from './database-handler'
import { createLogger } from '../services/logger'
import { OPERATION_TIMEOUTS } from './timeout-config'
import './custom-matchers' // Import custom matchers

const logger = createLogger('TestSetup')

// Global test database setup
beforeAll(async () => {
  logger.info('Setting up test environment...')
  
  // Connect to MongoDB Memory Server
  await connectTestDatabase()
  
  logger.info('Test environment setup complete')
}, OPERATION_TIMEOUTS.DB_CONNECT) // Optimized timeout for database connection

// Clean database between each test
beforeEach(async () => {
  await clearTestDatabase()
}, OPERATION_TIMEOUTS.DB_CLEAR) // Optimized timeout for database clearing

// Global cleanup after all tests
afterAll(async () => {
  logger.info('Cleaning up test environment...')
  
  // Close database connection and stop MongoDB Memory Server
  await closeTestDatabase()
  
  logger.info('Test environment cleanup complete')
}, OPERATION_TIMEOUTS.DB_DISCONNECT) // Optimized timeout for database disconnect

// Optional: Clean up any remaining resources after each test
afterEach(async () => {
  // Additional cleanup if needed
  // This can be used for cleaning up any test-specific resources
  
  // Force garbage collection in test environment
  if (global.gc) {
    global.gc()
  }
}, 3000) // 3 second timeout for afterEach cleanup

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise)
  logger.error('Reason:', reason)
})

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
})

export {
  connectTestDatabase,
  clearTestDatabase,
  closeTestDatabase
}