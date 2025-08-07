name: "Environment File Consolidation PRP - Single .env with .env.sample Template"
description: |

---

## Goal

**Feature Goal**: Consolidate three separate environment files (.env, .env.local, .env.server) into a single .env file that serves both frontend (Vite) and backend (Node.js) applications, with a committed .env.sample file containing documented placeholders for all environment variables.

**Deliverable**: 
- Single consolidated `.env` file (gitignored) containing all environment variables
- Committed `.env.sample` file with secure placeholders and comprehensive documentation
- Updated environment loading configuration ensuring compatibility with existing Vite and Node.js patterns
- Validation scripts to ensure .env completeness

**Success Definition**: 
- Both frontend (React/Vite) and backend (Node.js/Express) applications load environment variables from single .env file
- New developers can copy .env.sample to .env and provide values to get started
- All existing functionality works without code changes
- Security is maintained with appropriate gitignore configuration

## User Persona

**Target User**: HSA Songbook developers (including the user requesting this change)

**Use Case**: Developer wants to simplify environment variable management by using a single .env file instead of managing three separate files with duplicated variables

**User Journey**: 
1. Developer clones repository
2. Copies .env.sample to .env
3. Fills in actual values for their environment
4. Runs application successfully without additional environment setup

**Pain Points Addressed**: 
- Eliminates confusion about which env file to modify
- Reduces duplication of environment variables across multiple files
- Provides clear documentation of all required environment variables
- Simplifies deployment and development setup

## Why

- **Simplified Configuration**: Single source of truth for all environment variables reduces cognitive overhead
- **Reduced Duplication**: Currently `VITE_CLERK_PUBLISHABLE_KEY` and `MONGODB_URI` are duplicated across 3 files
- **Better Developer Experience**: New developers get comprehensive documentation in .env.sample
- **Deployment Simplification**: Single .env file is easier to manage in production environments
- **Maintenance**: Changes to environment variables only need to be made in one place

## What

Consolidate environment configuration while maintaining security and functionality:

### Success Criteria

- [ ] Single .env file contains all environment variables for both frontend and backend
- [ ] .env.sample file provides comprehensive documentation with secure placeholders
- [ ] Frontend (Vite) correctly loads VITE_* prefixed variables from consolidated .env
- [ ] Backend (Node.js) correctly loads all server variables from consolidated .env
- [ ] All existing scripts (seed, reset-database, check-songs) work with consolidated configuration
- [ ] No secrets or sensitive data committed to version control
- [ ] Environment validation continues to work for required variables

## All Needed Context

### Context Completeness Check

_This PRP provides complete context for an AI agent unfamiliar with the HSA Songbook codebase to successfully consolidate environment files while maintaining all existing functionality and security._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vitejs.dev/guide/env-and-mode
  why: Understanding how Vite handles environment variables and file precedence
  critical: VITE_ prefix requirement and build-time vs runtime loading differences

- url: https://github.com/motdotla/dotenv#readme
  why: Node.js environment loading patterns and configuration options
  critical: File path specification and variable precedence rules

- url: https://creatures.sh/blog/env-type-safety-and-validation/
  why: Modern TypeScript environment validation patterns with Zod
  critical: Type-safe environment configuration and validation best practices

- file: server/shared/config/env.ts
  why: Current server-side environment loading and validation pattern to preserve
  pattern: Config interface structure, validation logic, fallback values
  gotcha: Production validation is stricter than development

- file: src/app/main.tsx  
  why: Frontend environment variable usage pattern with Clerk integration
  pattern: import.meta.env usage, validation before app initialization
  gotcha: Frontend variables must be prefixed with VITE_ to be accessible

- file: server/scripts/seed-songs.ts
  why: Script-level environment loading pattern that must continue working
  pattern: Standalone dotenv.config() usage with path specification
  gotcha: Scripts load environment independently from main server configuration

- docfile: PRPs/ai_docs/mongodb_express_integration.md
  why: MongoDB connection and security patterns already established
  section: Database configuration and connection string security
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
hsa-songbook/
├── .env                    # Frontend/shared vars (gitignored)
├── .env.local              # Local development overrides (gitignored)  
├── .env.server             # Server-specific configuration (gitignored)
├── .gitignore              # Contains .env file exclusions
├── src/
│   ├── app/main.tsx        # Frontend env loading (VITE_CLERK_PUBLISHABLE_KEY)
│   └── vite-env.d.ts       # Vite environment types
├── server/
│   ├── package.json        # Contains dotenv dependency
│   ├── shared/
│   │   └── config/env.ts   # Server env configuration and validation
│   └── scripts/
│       ├── seed-songs.ts   # Independent env loading
│       ├── reset-database.ts
│       └── check-songs.ts
├── vite.config.ts          # Vite configuration
└── package.json            # Frontend dependencies
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
hsa-songbook/
├── .env                    # CONSOLIDATED: All environment variables (gitignored)
├── .env.sample             # NEW: Documented template with secure placeholders (committed)
├── .gitignore              # UPDATED: Ensure .env consolidation security  
├── src/
│   ├── app/main.tsx        # UNCHANGED: Continue using import.meta.env
│   └── vite-env.d.ts       # UNCHANGED: Vite environment types
├── server/
│   ├── shared/
│   │   └── config/env.ts   # UPDATED: Load from root .env instead of .env.server
│   └── scripts/
│       ├── seed-songs.ts   # UPDATED: Load from root .env instead of .env.server  
│       ├── reset-database.ts  # UPDATED: Load from root .env instead of .env.server
│       └── check-songs.ts  # UPDATED: Load from root .env instead of .env.server
├── scripts/
│   └── validate-env.js     # NEW: Validation script to check .env completeness
└── vite.config.ts          # UNCHANGED: Vite default env handling
```

### Known Gotchas of our codebase & Library Quirks

```javascript
// CRITICAL: Vite requires VITE_ prefix for client-side variables
// Variables without VITE_ prefix will be undefined in frontend code
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY // ✓ Works
const mongoUri = import.meta.env.MONGODB_URI // ✗ Undefined in frontend

// CRITICAL: Server scripts load environment independently  
// Each script calls dotenv.config() with custom path - must update all
dotenv.config({ path: path.join(__dirname, '../../..', '.env.server') }) // Current
dotenv.config({ path: path.join(__dirname, '../..', '.env') }) // New pattern

// GOTCHA: Environment validation is stricter in production
// Missing JWT_SECRET causes process.exit(1) in production only
if (config.nodeEnv === 'production' && !process.env.JWT_SECRET) {
  process.exit(1)
}

// GOTCHA: MongoDB URI has fallback pattern that must be preserved
// Code checks for both MONGODB_URI and MONGO_URI 
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || defaultLocal
```

## Implementation Blueprint

### Data models and structure

Environment variable structure and validation patterns:

```typescript
// Preserve existing Config interface from server/shared/config/env.ts
interface Config {
  port: number
  mongoUri: string  
  nodeEnv: string
  frontendUrl: string
  jwtSecret: string
  jwtExpiresIn: string
  rateLimitMax: number
  rateLimitWindowMs: number
  zstdCompressionLevel: number
}

// Environment variables to consolidate (from current analysis):
// Frontend (VITE_ prefixed):
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

// Backend:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://...
FRONTEND_URL=http://localhost:5173
JWT_SECRET=...
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
ZSTD_COMPRESSION_LEVEL=10
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE .env.sample
  - IMPLEMENT: Comprehensive template with all environment variables and documentation
  - FOLLOW pattern: Security best practices from research (no real secrets, clear placeholders)
  - NAMING: Use descriptive placeholder values like REPLACE_ME, YOUR_API_KEY_HERE
  - PLACEMENT: Root directory (will be committed to version control)
  - CONTENT: All variables from current .env, .env.local, .env.server with secure placeholders

Task 2: CREATE consolidated .env  
  - IMPLEMENT: Single .env file combining all variables from existing env files
  - FOLLOW pattern: Preserve all current working values from .env.server
  - NAMING: Standard .env filename at project root
  - PLACEMENT: Root directory (gitignored)
  - DEPENDENCIES: Values extracted from existing .env, .env.local, .env.server files

Task 3: UPDATE server/shared/config/env.ts
  - MODIFY: dotenv.config() path from '.env.server' to '.env' 
  - FOLLOW pattern: Preserve existing Config interface and validation logic
  - CHANGE: path.join(__dirname, '../../..', '.env.server') → path.join(__dirname, '../../..', '.env')
  - PRESERVE: All validation logic, fallback values, production checks
  - DEPENDENCIES: Task 2 (consolidated .env must exist)

Task 4: UPDATE server/scripts/seed-songs.ts
  - MODIFY: dotenv.config() path from '.env.server' to '.env'
  - FOLLOW pattern: Preserve existing MongoDB connection and logging
  - CHANGE: path.join(__dirname, '../..', '.env.server') → path.join(__dirname, '../..', '.env')
  - PRESERVE: MongoDB URI fallback pattern, error handling
  - DEPENDENCIES: Task 2 (consolidated .env must exist)

Task 5: UPDATE server/scripts/reset-database.ts  
  - MODIFY: dotenv.config() path from '.env.server' to '.env'
  - FOLLOW pattern: Same as seed-songs.ts
  - CHANGE: Update dotenv path configuration
  - PRESERVE: All database reset functionality
  - DEPENDENCIES: Task 2 (consolidated .env must exist)

Task 6: UPDATE server/scripts/check-songs.ts
  - MODIFY: dotenv.config() path from '.env.server' to '.env' 
  - FOLLOW pattern: Same as other scripts
  - CHANGE: Update dotenv path configuration  
  - PRESERVE: All song checking functionality
  - DEPENDENCIES: Task 2 (consolidated .env must exist)

Task 7: UPDATE .gitignore
  - VERIFY: .env is properly ignored and .env.sample will be committed
  - FOLLOW pattern: Existing .gitignore structure 
  - PRESERVE: All existing .env.* exclusions for safety
  - ADD: Ensure .env (without extension) is gitignored
  - DEPENDENCIES: Tasks 1-2 (both .env and .env.sample must exist)

Task 8: CREATE scripts/validate-env.js
  - IMPLEMENT: Validation script to check .env completeness against .env.sample
  - FOLLOW pattern: Simple Node.js script that can be run via npm script
  - FUNCTIONALITY: Compare variables in .env vs .env.sample, warn about missing values
  - PLACEMENT: scripts/ directory
  - DEPENDENCIES: Tasks 1-2 (.env and .env.sample must exist)

Task 9: REMOVE legacy environment files
  - DELETE: .env.local and .env.server (after confirming consolidated .env works)
  - VERIFY: All functionality works with consolidated .env before deletion
  - PRESERVE: .env file (keep consolidated version)
  - SAFETY: Only delete after full validation in Task 10
```

### Implementation Patterns & Key Details

```javascript
// .env.sample structure - secure placeholders with documentation
// Frontend Variables (VITE_ prefixed for client-side access)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_CLERK_PUBLISHABLE_KEY

// Server Configuration
NODE_ENV=development
PORT=5000

// Database Configuration  
# MongoDB connection string for your database
# Format: mongodb://username:password@host:port/database_name
# For local development: mongodb://localhost:27017/hsa_songbook_dev
MONGODB_URI=mongodb://localhost:27017/hsa_songbook_dev

// Updated dotenv loading pattern (preserve existing config structure)
// File: server/shared/config/env.ts
import dotenv from 'dotenv'
import path from 'path'

// CHANGE: Load from root .env instead of .env.server
dotenv.config({ path: path.join(__dirname, '../../..', '.env') })

const config: Config = {
  // PRESERVE: All existing configuration and validation logic
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hsa-songbook-dev',
  // ... rest of config unchanged
}

// Script pattern update (preserve all existing functionality)  
// File: server/scripts/seed-songs.ts
dotenv.config({ path: path.join(__dirname, '../..', '.env') }) // CHANGE: path only

// PRESERVE: All existing MongoDB connection logic
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hsa-songbook-dev'

// Frontend pattern (NO CHANGES REQUIRED)
// File: src/app/main.tsx - continues to work with consolidated .env
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
```

### Integration Points

```yaml
VITE:
  - loading: Automatic from .env files in project root
  - requirement: Variables must be prefixed with VITE_ for frontend access
  - pattern: import.meta.env.VITE_VARIABLE_NAME

NODE.JS:
  - loading: Explicit via dotenv.config() in configuration files
  - requirement: Update path from '.env.server' to '.env' in all loading locations
  - pattern: process.env.VARIABLE_NAME

SCRIPTS:
  - update locations: server/scripts/seed-songs.ts, reset-database.ts, check-songs.ts  
  - pattern: dotenv.config({ path: path.join(__dirname, '../..', '.env') })

GIT:
  - .env: Must remain gitignored for security
  - .env.sample: Must be committed for developer onboarding
  - verification: Ensure no sensitive data in committed files
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify .env file structure and syntax
grep -v '^#' .env | grep -v '^$' | wc -l  # Count non-empty, non-comment lines
echo "Variables in .env:"
grep -v '^#' .env | grep -v '^$' | cut -d= -f1 | sort

# Verify .env.sample structure  
echo "Variables in .env.sample:"
grep -v '^#' .env.sample | grep -v '^$' | cut -d= -f1 | sort

# Check for sensitive data in .env.sample (should find none)
grep -i -E "(password|secret|key|token)" .env.sample | grep -v "REPLACE_ME\|YOUR_.*_HERE\|PLACEHOLDER"

# Expected: .env.sample contains no real secrets, only documented placeholders
```

### Level 2: Unit Tests (Component Validation)

```bash
# Validate environment loading in server configuration
cd server
npm run type-check  # TypeScript validation for config changes

# Test server scripts can load environment
node -e "
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
console.log('Environment loaded:', !!process.env.MONGODB_URI);
console.log('Port configured:', process.env.PORT || '5000');
"

# Validate frontend can access VITE_ variables (after build)
npm run build
echo "Frontend build successful - Vite variables accessible"

# Expected: No TypeScript errors, environment variables load correctly
```

### Level 3: Integration Testing (System Validation)

```bash
# Start backend server and verify environment loading
cd server && npm run dev &
SERVER_PID=$!
sleep 5

# Verify server started with correct environment
curl -f http://localhost:5000/health || echo "Server health check failed"
echo "Server PID: $SERVER_PID - Environment loaded successfully"

# Start frontend and verify Vite environment loading  
npm run dev &
FRONTEND_PID=$!
sleep 5

# Verify frontend environment (check for Clerk initialization)
curl -f http://localhost:5173/ || echo "Frontend health check failed" 
echo "Frontend PID: $FRONTEND_PID - Vite variables loaded"

# Test database scripts with consolidated environment
cd server
npm run db:reset  # Should work with new .env path
npm run db:seed   # Should work with new .env path

# Cleanup
kill $SERVER_PID $FRONTEND_PID

# Expected: All services start successfully, database scripts work, no environment errors
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Environment Variable Completeness Validation
node scripts/validate-env.js  # Custom validation script from Task 8

# Security Validation - ensure no secrets in version control
git status --porcelain | grep -E "\.env$" && echo "ERROR: .env file staged for commit!" || echo "✓ .env properly ignored"
git add .env.sample && git status --porcelain | grep ".env.sample" && echo "✓ .env.sample staged for commit" || echo "ERROR: .env.sample not staged"

# Functional Testing - All existing features work
# Clerk Authentication (frontend)
echo "Testing Clerk integration with consolidated env..."
curl -s http://localhost:5173/ | grep -q "clerk" && echo "✓ Clerk integration loaded" || echo "⚠ Clerk integration check failed"

# MongoDB Connection (backend)
cd server && node -e "
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log('Testing MongoDB connection with URI pattern...');
console.log('URI format valid:', mongoUri && mongoUri.startsWith('mongodb'));
"

# Configuration Validation - ensure all services get expected values
echo "Validating consolidated configuration..."
cd server && node -e "
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const config = require('./shared/config/env.ts').default;
console.log('✓ Server config loaded');
console.log('Port:', config.port);
console.log('MongoDB URI configured:', !!config.mongoUri);  
console.log('JWT Secret configured:', !!config.jwtSecret);
"

# Expected: All validations pass, no security issues, all features functional
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Server starts without environment errors: `cd server && npm run dev`
- [ ] Frontend builds without environment errors: `npm run build`  
- [ ] Database scripts work: `cd server && npm run db:reset && npm run db:seed`
- [ ] No TypeScript errors: `cd server && npm run type-check`

### Feature Validation

- [ ] All success criteria from "What" section met
- [ ] Manual testing successful: Both frontend and backend load from single .env
- [ ] Authentication works: Clerk integration functions with VITE_CLERK_PUBLISHABLE_KEY
- [ ] Database connection works: MongoDB connects using MONGODB_URI from consolidated file
- [ ] All existing scripts work: seed-songs.ts, reset-database.ts, check-songs.ts

### Code Quality Validation

- [ ] Follows existing codebase patterns: dotenv loading, config structure preserved
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided: No secrets in .env.sample, proper gitignore configuration
- [ ] Dependencies properly managed: dotenv package used consistently
- [ ] Configuration changes properly integrated: All path updates completed

### Security & Documentation Validation

- [ ] .env file properly gitignored and contains all working values
- [ ] .env.sample committed with secure placeholders and comprehensive documentation
- [ ] No sensitive data in version control: git status confirms proper file handling
- [ ] Environment validation script works: scripts/validate-env.js functions correctly
- [ ] New developer onboarding: .env.sample → .env workflow functional

---

## Anti-Patterns to Avoid

- ❌ Don't commit any real secrets or sensitive data to .env.sample
- ❌ Don't remove existing environment files until confirming consolidated .env works
- ❌ Don't change the Config interface or validation logic unnecessarily
- ❌ Don't ignore the VITE_ prefix requirement for frontend variables
- ❌ Don't forget to update all script files that load environment independently
- ❌ Don't skip the security validation - ensure .env remains gitignored