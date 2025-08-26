# Generic ESLint Parallel Fix PRP

## Purpose
A reusable, parallel-execution PRP for fixing ESLint errors in any TypeScript/JavaScript codebase. This PRP automatically analyzes error patterns and distributes fixes across multiple concurrent subagents for maximum efficiency.

## Pre-Execution Analysis Phase

### Step 1: Error Discovery
```bash
# Capture current ESLint state
npm run lint 2>&1 | tee eslint-errors.log

# Analyze error patterns
grep "error" eslint-errors.log | awk '{print $NF}' | sort | uniq -c | sort -rn
```

### Step 2: Error Categorization
The system will automatically categorize errors into:

1. **Auto-fixable** - Can be fixed with `--fix` flag
2. **Type-related** - `any` types, missing types, type assertions
3. **Import-related** - Unused imports, missing imports, circular dependencies
4. **Code-quality** - Unused variables, unreachable code, complexity
5. **Format-related** - Spacing, quotes, semicolons (if not using Prettier)
6. **Config-related** - Parser errors, rule conflicts

## Dynamic Parallel Execution Strategy

### Phase 1: Foundation Setup (Sequential - 5 min)

```yaml
foundation_agent:
  tasks:
    - Analyze ESLint configuration
    - Create shared type definitions if needed
    - Set up type declaration files
    - Update ESLint ignores for build artifacts
  
  type_definitions_template: |
    // shared/types/common.ts
    export type TODO = any; // Temporary type for gradual migration
    export type UnknownObject = Record<string, unknown>;
    export type UnknownArray = unknown[];
    export type AnyFunction = (...args: any[]) => any;
    
    // shared/types/test.ts (if test files exist)
    import { Mock } from 'vitest';
    export type MockedFunction = Mock<any[], any>;
    export type TestContext = Record<string, unknown>;
    
    // shared/types/api.ts (if API files exist)
    import { Request, Response, NextFunction } from 'express';
    export interface TypedRequest<T = any> extends Request {
      body: T;
      user?: any;
    }
```

### Phase 2: Parallel Fix Groups

#### Group A: Critical Path (Production Code)
```yaml
production_fix_agent:
  selection_criteria:
    - Files in src/ or app/ directories
    - Files not in __tests__ or *.test.* or *.spec.*
    - Files with business logic
  
  parallel_strategy:
    - Split files by directory
    - Each subagent handles one directory
    - Priority: Files with most errors first
  
  fix_approach:
    1. Run auto-fix first
    2. Add explicit types for parameters
    3. Add return types for functions
    4. Replace `any` with specific types or `unknown`
    5. Fix import issues
```

#### Group B: Test Files
```yaml
test_fix_agent:
  selection_criteria:
    - Files matching *.test.*, *.spec.*, __tests__
    - Test utility files
    - Mock files
  
  parallel_strategy:
    - Group by test type (unit, integration, e2e)
    - Each subagent handles one test type
  
  fix_approach:
    1. More permissive typing allowed
    2. Use type assertions for mocks
    3. Use `any` sparingly for test data
    4. Focus on test readability
```

#### Group C: Configuration Files
```yaml
config_fix_agent:
  selection_criteria:
    - *.config.js, *.config.ts files
    - Build tool configurations
    - Environment files
  
  fix_approach:
    1. Add type imports for config objects
    2. Export with proper types
    3. Handle dynamic imports
```

## Subagent Task Distribution Algorithm

```javascript
// Pseudocode for task distribution
function distributeTasks(eslintErrors) {
  const errorsByFile = groupErrorsByFile(eslintErrors);
  const filesByPriority = sortByPriority(errorsByFile);
  
  const subagentTasks = [];
  const MAX_AGENTS = 10;
  const filesPerAgent = Math.ceil(filesByPriority.length / MAX_AGENTS);
  
  for (let i = 0; i < MAX_AGENTS; i++) {
    const files = filesByPriority.slice(
      i * filesPerAgent,
      (i + 1) * filesPerAgent
    );
    
    if (files.length > 0) {
      subagentTasks.push({
        agentId: `subagent_${i + 1}`,
        files: files,
        errorCount: files.reduce((sum, f) => sum + f.errors.length, 0)
      });
    }
  }
  
  return subagentTasks;
}
```

## Generic Subagent Prompt Template

```markdown
You are ESLint Fix Subagent #{AGENT_ID}. Your task is to fix ESLint errors in the following files:

**Files Assigned:**
{FILE_LIST}

**Error Summary:**
{ERROR_SUMMARY}

**Available Resources:**
- Shared types at: `@/shared/types/*` or `../shared/types/*`
- ESLint config at: `eslint.config.js`
- TypeScript config at: `tsconfig.json`

**Fix Priority Order:**
1. Auto-fixable errors (run `eslint --fix` first)
2. Type errors (`any` types, missing types)
3. Import errors (unused, missing)
4. Code quality (unused vars, etc.)

**Fix Strategies by Error Type:**

### @typescript-eslint/no-explicit-any
- Replace with specific type if known
- Use `unknown` if type is truly unknown
- Use generic types where appropriate
- For third-party libraries, check for @types packages

### @typescript-eslint/no-unused-vars
- Remove if truly unused
- Prefix with underscore if intentionally unused
- Check if it should be exported

### import/no-unresolved
- Fix import paths
- Add missing dependencies
- Check tsconfig paths

### @typescript-eslint/no-empty-object-type
- Replace `{}` with `Record<string, never>` for empty objects
- Use `object` for any object
- Define specific interface if shape is known

**Validation After Each File:**
\`\`\`bash
npx eslint {FILENAME} --max-warnings 0
\`\`\`

**Do Not:**
- Change business logic
- Remove functionality without checking usage
- Ignore test failures
- Add unnecessary type assertions

**Success Criteria:**
- Zero ESLint errors in assigned files
- All existing tests still pass
- No runtime errors introduced
```

## Parallel Execution Orchestration

```yaml
execution_plan:
  phase_1_sequential:
    duration: 5min
    tasks:
      - Run initial ESLint analysis
      - Create type definitions
      - Update configurations
  
  phase_2_parallel:
    duration: 15-30min
    groups:
      - name: "Critical Production"
        agents: 3-4
        priority: 1
      
      - name: "Test Files"  
        agents: 2-3
        priority: 2
        
      - name: "Utilities"
        agents: 2
        priority: 3
        
      - name: "Config Files"
        agents: 1
        priority: 4
  
  phase_3_validation:
    duration: 5min
    tasks:
      - Run final ESLint check
      - Run test suite
      - Run build
```

## Error Pattern Solutions

### Common TypeScript Errors

```typescript
// Problem: Implicit any in function parameters
// Before:
function process(data) { }

// After:
function process(data: unknown) { }
// OR with specific type:
function process(data: string[]) { }

// Problem: Any in catch blocks
// Before:
catch (error) { }

// After:
catch (error: unknown) { }
// OR with type guard:
catch (error) {
  if (error instanceof Error) { }
}

// Problem: Empty object type
// Before:
type Config = {};

// After:
type Config = Record<string, never>; // truly empty
// OR
type Config = Record<string, unknown>; // any properties

// Problem: Missing return type
// Before:
async function fetchData() { }

// After:
async function fetchData(): Promise<void> { }
// OR with specific type:
async function fetchData(): Promise<DataType> { }
```

### Test File Patterns

```typescript
// More permissive for test files
import { vi, Mock } from 'vitest';

// Mock typing
const mockFunction = vi.fn() as Mock<[string], Promise<void>>;

// Test data can use type assertions
const testData = {
  id: '123',
  name: 'test'
} as UserType;

// Unknown for dynamic test data
const scenarios: Array<unknown> = [
  { case: 1 },
  { case: 2 }
];
```

## Validation Commands

```bash
# Progressive validation during fixes
validate_single_file() {
  npx eslint "$1" --max-warnings 0
}

# Batch validation after group completion  
validate_directory() {
  npx eslint "$1/**/*.{ts,tsx,js,jsx}" --max-warnings 0
}

# Final validation
validate_all() {
  npm run lint &&
  npm run build &&
  npm test
}
```

## Dynamic Agent Scaling

Based on error count:
- **< 50 errors**: 2-3 parallel agents
- **50-200 errors**: 4-6 parallel agents  
- **200-500 errors**: 7-10 parallel agents
- **> 500 errors**: 10+ parallel agents with batching

## Success Metrics

- **Primary**: Zero ESLint errors
- **Secondary**: 
  - No test failures
  - Successful build
  - No runtime errors
  - Improved type coverage

## Rollback Strategy

```bash
# Before starting, create a checkpoint
git add -A && git commit -m "WIP: Before ESLint fixes"

# If issues arise, rollback to checkpoint
git reset --hard HEAD~1

# Or selectively revert files
git checkout HEAD -- path/to/problematic/file
```

## Usage Instructions

1. **Analyze Current State**
   ```bash
   npm run lint 2>&1 | tee current-errors.log
   ```

2. **Execute PRP**
   - Load this PRP
   - System will automatically analyze and distribute work
   - Multiple subagents will work in parallel

3. **Monitor Progress**
   - Each subagent reports completion
   - Validation runs automatically

4. **Final Verification**
   ```bash
   npm run lint && npm run build && npm test
   ```

This PRP is designed to be reusable across any TypeScript/JavaScript project regardless of the current error count or types of errors present.