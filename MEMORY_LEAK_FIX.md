# Memory Leak Fix Summary

## Problem
Tests were running out of memory with "JavaScript heap out of memory" errors when running the full test suite.

## Root Causes Identified

1. **Duplicate Mock Registration**: 
   - `vi.mock('@clerk/clerk-react')` was being called both in `setup.ts` and via `setupClerkMocks()` in individual test files
   - This created duplicate mock instances that accumulated in memory

2. **Mock Function Instance Proliferation**:
   - Each `vi.fn()` created new function instances on every call
   - Mock functions were being recreated instead of reused

3. **Circular References in Mocks**:
   - Components in mocks were calling other mock functions, creating circular dependencies

4. **LocalStorage Mock Issues**:
   - Closure-based localStorage mock was retaining data across tests

5. **jsdom Memory Accumulation**:
   - DOM nodes and event listeners weren't being properly cleaned up

## Solution Implemented

### 1. Centralized Mock Setup
- Moved all Clerk mocks to `setup.ts` as singleton instances
- Created mock functions once outside of `vi.mock()` to prevent recreation
- Removed `setupClerkMocks()` function entirely

### 2. Simplified Test Utilities
- Updated `clerk-test-utils.tsx` to use mocks from `setup.ts`
- Removed duplicate mock creation
- Kept only helper functions for setting mock states

### 3. Proper Cleanup
- Added comprehensive cleanup in `afterEach()`:
  - React Testing Library cleanup
  - Clear all timers
  - Clear all mocks
  - Reset DOM (body and head)
  - Clear localStorage properly

### 4. Fixed Test Patterns
- Updated all test files to remove `setupClerkMocks()` calls
- Fixed tests to pass state directly to `renderWithClerk()`
- Removed conflicting state setups in `beforeEach()`

### 5. Optimized Vitest Configuration
- Added proper test isolation settings
- Configured mock reset behavior
- Used forks pool with single fork for better memory management

## Results
- ✅ All 38 tests passing
- ✅ No memory leaks
- ✅ Fast test execution (~700ms total)
- ✅ Consistent memory usage
- ✅ No timeouts or crashes

## Files Modified
- `src/shared/test-utils/setup.ts` - Centralized mocks
- `src/shared/test-utils/clerk-test-utils.tsx` - Simplified utilities
- `src/features/auth/components/__tests__/*.test.tsx` - Removed setupClerkMocks
- `src/features/auth/hooks/__tests__/*.test.ts` - Updated imports
- `src/features/setlists/hooks/__tests__/*.test.ts` - Fixed localStorage usage
- `vitest.config.ts` - Added isolation settings
- `package.json` - Removed memory increase workaround

## Best Practices Going Forward
1. Always use singleton mock instances
2. Define mocks outside of `vi.mock()` calls
3. Never call `vi.mock()` for the same module multiple times
4. Always clean up DOM and mocks in `afterEach()`
5. Pass test state directly to render functions instead of using `beforeEach()`