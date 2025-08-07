# ESLint Fix Plan - HSA Songbook

## Summary
283 ESLint errors identified, primarily TypeScript `any` types in server-side test files.

## Priority 1: Quick Wins (Auto-fixable)
These can be fixed immediately with minimal risk:

### Unused Variables (prefix with underscore)
```bash
# Already prefixed with _ but still showing errors - need to update ESLint config
# Or remove completely if truly unused
```

Files affected:
- `vite.config.ts` - _req, _res parameters
- `server/shared/test-utils/setup.ts` - unused mock variables
- Test files with unused imports

## Priority 2: Test File `any` Types
Most `any` types are in test files where type safety is less critical.

### Strategy: Create Test Type Definitions
```typescript
// server/shared/test-utils/test-types.ts
export type TestDocument<T = Record<string, unknown>> = T & {
  _id?: unknown;
  __v?: number;
  save?: () => Promise<unknown>;
  [key: string]: unknown;
};

export type TestError = Error & {
  code?: number;
  statusCode?: number;
  [key: string]: unknown;
};

export type MockFunction = jest.Mock | vi.Mock;
```

### Files to Update (161 `any` violations):
1. `server/__tests__/validation/model-validation.test.ts` (45 violations)
2. `server/shared/test-utils/factories.ts` (13 violations)
3. `server/shared/test-utils/mock-services.ts` (8 violations)
4. `server/shared/test-utils/custom-matchers.ts` (15 violations)

## Priority 3: Production Code `any` Types
These are more critical and need proper typing:

### Files Requiring Immediate Attention:
1. `server/shared/middleware/auth.ts` (8 violations)
2. `server/shared/middleware/errorHandler.ts` (7 violations)
3. `server/shared/services/logger.ts` (10 violations)
4. `src/features/songs/services/songService.ts` (3 violations)

### Recommended Types:
```typescript
// For Express middleware
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
}

// For error handling
interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

// For logger
type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogData = Record<string, unknown>;
```

## Priority 4: Build Artifacts
The `server/dist` folder contains generated `.d.ts` files with empty object type issues.

### Solution:
1. Add `dist` to `.gitignore`
2. Add `dist` to ESLint ignore patterns
3. Clean before build: `rm -rf server/dist`

## Implementation Steps

### Step 1: Update ESLint Config
```javascript
// eslint.config.js
export default [
  // ... existing config
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/*.d.ts']
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  }
];
```

### Step 2: Create Shared Test Types
Create `server/shared/test-utils/test-types.ts` with common test types.

### Step 3: Fix Critical Production Code
Update auth, error handling, and logger with proper types.

### Step 4: Batch Fix Test Files
Update test files to use shared test types.

## Estimated Time
- Priority 1: 15 minutes
- Priority 2: 1 hour
- Priority 3: 30 minutes
- Priority 4: 10 minutes

Total: ~2 hours

## Validation
After fixes:
```bash
npm run lint
npm run build
npm test
```

Target: 0 ESLint errors