// ============================================================================
// Tiered Test Timeout Configuration
// ============================================================================
// Optimized timeout values for different types of tests to improve performance
// and provide appropriate timeout expectations

/**
 * Test timeout categories with appropriate durations
 */
export const TEST_TIMEOUTS = {
  // Unit Tests - Fast synchronous tests (default)
  UNIT: {
    test: 2000,        // 2 seconds - most unit tests should complete in milliseconds
    beforeEach: 500,   // 0.5 seconds - quick setup
    afterEach: 500,    // 0.5 seconds - quick cleanup
    beforeAll: 1000,   // 1 second - minimal setup
    afterAll: 1000     // 1 second - minimal cleanup
  },
  
  // Service Tests - Business logic with minimal dependencies
  SERVICE: {
    test: 5000,        // 5 seconds - service layer operations
    beforeEach: 1000,  // 1 second - service setup
    afterEach: 1000,   // 1 second - service cleanup
    beforeAll: 2000,   // 2 seconds - service initialization
    afterAll: 2000     // 2 seconds - service teardown
  },
  
  // Database Tests - MongoDB Memory Server operations
  DATABASE: {
    test: 10000,       // 10 seconds - database operations
    beforeEach: 5000,  // 5 seconds - database clearing/setup
    afterEach: 2000,   // 2 seconds - cleanup
    beforeAll: 20000,  // 20 seconds - MongoDB Memory Server startup
    afterAll: 15000    // 15 seconds - MongoDB Memory Server shutdown
  },
  
  // Integration Tests - Cross-service operations
  INTEGRATION: {
    test: 15000,       // 15 seconds - complex multi-service operations
    beforeEach: 7000,  // 7 seconds - integration setup
    afterEach: 3000,   // 3 seconds - integration cleanup
    beforeAll: 25000,  // 25 seconds - full system setup
    afterAll: 20000    // 20 seconds - full system teardown
  },
  
  // Performance Tests - Compression, concurrent operations
  PERFORMANCE: {
    test: 30000,       // 30 seconds - performance benchmarks
    beforeEach: 5000,  // 5 seconds - performance test setup
    afterEach: 3000,   // 3 seconds - performance cleanup
    beforeAll: 30000,  // 30 seconds - performance environment setup
    afterAll: 15000    // 15 seconds - performance cleanup
  },
  
  // E2E/API Tests - Full request/response cycles
  API: {
    test: 8000,        // 8 seconds - API request/response cycles
    beforeEach: 3000,  // 3 seconds - API test setup
    afterEach: 2000,   // 2 seconds - API cleanup
    beforeAll: 20000,  // 20 seconds - API server setup
    afterAll: 10000    // 10 seconds - API server teardown
  }
} as const

/**
 * Test timeout helpers for common scenarios
 */
export const getTimeoutForTestType = (type: keyof typeof TEST_TIMEOUTS) => {
  return TEST_TIMEOUTS[type]
}

/**
 * Helper to apply timeout to a specific test
 * Usage: it('test name', testFunction, testTimeout('DATABASE'))
 */
export const testTimeout = (type: keyof typeof TEST_TIMEOUTS) => {
  return TEST_TIMEOUTS[type].test
}

/**
 * Helper to get all timeouts for a test suite
 * Usage: const timeouts = suiteTimeouts('DATABASE')
 */
export const suiteTimeouts = (type: keyof typeof TEST_TIMEOUTS) => {
  return TEST_TIMEOUTS[type]
}

/**
 * Default timeout recommendations by file pattern
 */
export const TIMEOUT_BY_PATTERN = {
  '**/*.model.test.ts': 'DATABASE',
  '**/*.service.test.ts': 'SERVICE', 
  '**/*.controller.test.ts': 'API',
  '**/integration/**/*.test.ts': 'INTEGRATION',
  '**/performance/**/*.test.ts': 'PERFORMANCE',
  '**/*.validation.test.ts': 'UNIT'
} as const

/**
 * Get recommended timeout type based on test file path
 */
export const getTimeoutTypeForFile = (filePath: string): keyof typeof TEST_TIMEOUTS => {
  for (const [pattern, type] of Object.entries(TIMEOUT_BY_PATTERN)) {
    // Simple pattern matching - could be enhanced with glob matching
    if (filePath.includes(pattern.replace('**/', '').replace('*.', '.'))) {
      return type as keyof typeof TEST_TIMEOUTS
    }
  }
  return 'UNIT' // Default to unit test timeouts
}

/**
 * Timeout constants for specific operations
 */
export const OPERATION_TIMEOUTS = {
  // Database operations
  DB_CONNECT: 20000,      // 20 seconds to connect to MongoDB Memory Server
  DB_DISCONNECT: 10000,   // 10 seconds to disconnect
  DB_CLEAR: 5000,         // 5 seconds to clear all collections
  
  // Compression operations
  COMPRESS_SMALL: 1000,   // 1 second for small files (<1KB)
  COMPRESS_MEDIUM: 3000,  // 3 seconds for medium files (1KB-10KB)
  COMPRESS_LARGE: 10000,  // 10 seconds for large files (>10KB)
  
  // Concurrent operations
  CONCURRENT_LIGHT: 5000,  // 5 seconds for light concurrent operations (5-10 operations)
  CONCURRENT_HEAVY: 15000, // 15 seconds for heavy concurrent operations (50+ operations)
  
  // Network operations (if any)
  NETWORK_REQUEST: 5000,   // 5 seconds for network requests
  WEBHOOK_PROCESSING: 3000 // 3 seconds for webhook processing
} as const