# Test Timeout Optimization Guide

## Overview

This guide explains the tiered timeout system implemented to optimize test performance and provide appropriate timeout expectations for different types of tests.

## Problem

Previously, all tests used blanket 30-second timeouts, which:
- Made unit tests unnecessarily slow
- Hidden performance issues in fast tests
- Provided poor feedback on test execution time
- Created inefficient test suites

## Solution: Tiered Timeout System

### Available Timeout Categories

#### 1. UNIT Tests (Default: 2s)
- **Use for**: Fast synchronous tests, validation, pure functions
- **Test timeout**: 2 seconds
- **Setup/Teardown**: 0.5-1 second
- **Examples**: Model validation, utility functions, error handling

#### 2. SERVICE Tests (Default: 5s)
- **Use for**: Business logic, service layer operations
- **Test timeout**: 5 seconds  
- **Setup/Teardown**: 1-2 seconds
- **Examples**: UserService, SongService business logic

#### 3. DATABASE Tests (Default: 10s)
- **Use for**: MongoDB operations, model CRUD
- **Test timeout**: 10 seconds
- **Setup/Teardown**: 5 seconds (database clearing)
- **Examples**: Model tests, database constraints

#### 4. INTEGRATION Tests (Default: 15s)
- **Use for**: Cross-service operations, complex workflows
- **Test timeout**: 15 seconds
- **Setup/Teardown**: 7 seconds
- **Examples**: Cross-service interactions, data consistency

#### 5. PERFORMANCE Tests (Default: 30s)
- **Use for**: Compression, benchmarking, load testing
- **Test timeout**: 30 seconds
- **Setup/Teardown**: 5 seconds
- **Examples**: ZSTD compression, concurrent operations

#### 6. API Tests (Default: 8s)
- **Use for**: HTTP request/response cycles, endpoint testing
- **Test timeout**: 8 seconds
- **Setup/Teardown**: 3 seconds
- **Examples**: Controller tests, webhook processing

## Usage Examples

### Import and Apply Timeouts

```typescript
import { testTimeout, suiteTimeouts, OPERATION_TIMEOUTS } from '../shared/test-utils/timeout-config'

// Apply timeout to specific test
it('should compress large files', async () => {
  // Test implementation
}, testTimeout('PERFORMANCE'))

// Apply timeout to database operation
it('should handle concurrent updates', async () => {
  // Test implementation  
}, testTimeout('DATABASE'))

// For integration tests
it('should maintain data consistency', async () => {
  // Test implementation
}, testTimeout('INTEGRATION'))
```

### Setup/Teardown with Optimized Timeouts

```typescript
import { suiteTimeouts } from '../shared/test-utils/timeout-config'

const timeouts = suiteTimeouts('DATABASE')

beforeAll(async () => {
  // Database setup
}, timeouts.beforeAll)

beforeEach(async () => {
  // Clear database
}, timeouts.beforeEach)

afterAll(async () => {
  // Cleanup
}, timeouts.afterAll)
```

### Using Operation-Specific Timeouts

```typescript
import { OPERATION_TIMEOUTS } from '../shared/test-utils/timeout-config'

beforeAll(async () => {
  await connectDatabase()
}, OPERATION_TIMEOUTS.DB_CONNECT) // 20 seconds for MongoDB Memory Server

beforeEach(async () => {
  await clearDatabase()
}, OPERATION_TIMEOUTS.DB_CLEAR) // 5 seconds for clearing collections
```

## File-Based Timeout Recommendations

The system automatically suggests timeouts based on file patterns:

```typescript
**/*.model.test.ts        → DATABASE timeouts
**/*.service.test.ts      → SERVICE timeouts
**/*.controller.test.ts   → API timeouts
**/integration/**/*.test.ts → INTEGRATION timeouts
**/performance/**/*.test.ts → PERFORMANCE timeouts
**/*.validation.test.ts   → UNIT timeouts
```

## Best Practices

### 1. Choose Appropriate Categories
- Start with the most restrictive category that works
- Upgrade to higher timeout only if needed
- Document why longer timeouts are required

### 2. Monitor Test Performance
- Fast tests should complete in milliseconds
- Database tests should complete in 1-3 seconds typically
- Integration tests should complete in 2-8 seconds typically
- Performance tests may need the full timeout

### 3. Avoid Blanket Timeouts
```typescript
// ❌ Bad: Blanket timeout
describe('User Tests', () => {}, 30000)

// ✅ Good: Specific timeouts per test
describe('User Tests', () => {
  it('validates email format', () => {
    // Fast unit test - uses default 2s
  })
  
  it('saves to database', async () => {
    // Database operation
  }, testTimeout('DATABASE'))
})
```

### 4. Use Operation-Specific Timeouts for Infrastructure
```typescript
// ✅ Good: Specific timeouts for specific operations
beforeAll(async () => {
  await connectDatabase()
}, OPERATION_TIMEOUTS.DB_CONNECT)

beforeEach(async () => {
  await clearCollections() 
}, OPERATION_TIMEOUTS.DB_CLEAR)
```

## Timeout Values Reference

| Category | Test | beforeEach | afterEach | beforeAll | afterAll |
|----------|------|------------|-----------|-----------|----------|
| UNIT | 2s | 0.5s | 0.5s | 1s | 1s |
| SERVICE | 5s | 1s | 1s | 2s | 2s |
| DATABASE | 10s | 5s | 2s | 20s | 15s |
| INTEGRATION | 15s | 7s | 3s | 25s | 20s |
| PERFORMANCE | 30s | 5s | 3s | 30s | 15s |
| API | 8s | 3s | 2s | 20s | 10s |

## Migration Guide

### From Old System
```typescript
// Old: Blanket 30-second timeout
beforeAll(async () => {
  // setup
}, 30000)

// New: Appropriate timeout
beforeAll(async () => {
  // setup  
}, OPERATION_TIMEOUTS.DB_CONNECT)
```

### Identifying Slow Tests
1. Run tests with `--reporter=verbose`
2. Look for tests taking >50% of their timeout
3. Either optimize the test or use appropriate timeout category
4. Document why longer timeouts are needed

## Performance Impact

### Before Optimization
- All tests: 30-second timeout
- Average test suite time: Slow
- Test feedback: Poor (long waits for failures)

### After Optimization  
- Unit tests: 2-second timeout (15x faster feedback)
- Database tests: 10-second timeout (3x faster)
- Integration tests: 15-second timeout (2x faster)
- Performance tests: Still 30 seconds (appropriate)

### Expected Results
- 60-80% faster test feedback for unit tests
- Better identification of slow tests
- More appropriate timeout expectations
- Improved developer experience

## Troubleshooting

### Tests Timing Out Frequently
1. Check if test category is appropriate
2. Optimize test setup/teardown
3. Consider if test is testing too much (split it)
4. Use higher timeout category if justified

### Tests Too Slow Despite Short Timeouts
1. Profile test execution
2. Optimize database operations
3. Use test doubles/mocks where appropriate
4. Consider parallel test execution

### Finding the Right Timeout
1. Start with lowest appropriate category
2. Run tests multiple times to check consistency
3. Add 20-30% buffer to average execution time
4. Document rationale in test comments