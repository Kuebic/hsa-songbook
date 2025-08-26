name: "Phase 1 - Supabase Local Foundation Setup"
description: |
  Establish core local Supabase development infrastructure with Docker, CLI, and environment configuration

---

## Goal

**Feature Goal**: Set up a fully functional local Supabase development environment that mirrors production capabilities

**Deliverable**: Working local Supabase stack with proper configuration, environment variables, and verification scripts

**Success Definition**: Developer can run `npm run dev` with local Supabase backend, access Studio dashboard, and all existing features work locally

## User Persona

**Target User**: HSA Songbook developers (new and existing)

**Use Case**: Local development and testing without cloud dependencies

**User Journey**: 
1. Install prerequisites (Docker)
2. Run setup script
3. Start local Supabase stack
4. Connect application to local instance
5. Begin development with hot reload

**Pain Points Addressed**:
- Dependency on cloud Supabase for development
- Risk of corrupting shared development data
- Network latency during development
- Inability to work offline

## Why

- **Cost Reduction**: Eliminate cloud resource usage during development
- **Faster Iteration**: No network latency, instant database operations
- **Safe Testing**: Isolated environment prevents production data corruption
- **Offline Development**: Work without internet connectivity
- **Consistent Environments**: Reproducible setup across all developers

## What

Local Docker-based Supabase stack with automated setup, including PostgreSQL, Auth, Storage, Realtime, and Studio dashboard, fully integrated with the existing React application.

### Success Criteria

- [ ] Docker and Supabase CLI installed and verified
- [ ] Local Supabase stack starts successfully
- [ ] Application connects to local database
- [ ] Studio dashboard accessible at http://localhost:54323
- [ ] All existing features work with local backend
- [ ] Environment switching works (.env.local vs .env)

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_ - YES

### Documentation & References

```yaml
- url: https://supabase.com/docs/guides/local-development/cli/getting-started
  why: Official CLI setup guide with platform-specific installation
  critical: Required for supabase init and start commands

- url: https://supabase.com/docs/guides/local-development#logging-in
  why: Explains linking local to cloud projects for migrations
  critical: Needed for supabase link command if syncing with cloud

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/lib/supabase.ts
  why: Current Supabase client configuration to update for local development
  pattern: Environment variable usage pattern for VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
  gotcha: Uses import.meta.env for Vite environment variables

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/.env.example
  why: Template for environment variables
  pattern: Shows structure of required environment variables
  gotcha: Must create .env.local, not modify .env directly

- docfile: PRPs/supabase-local-development-prd.md
  why: Comprehensive PRD with all implementation details
  section: Technical Architecture and Appendices
```

### Current Codebase tree

```bash
hsa-songbook/
├── src/
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client configuration
│   │   └── database.types.ts   # Generated TypeScript types
│   └── features/               # Feature modules using Supabase
├── supabase/                   # Existing but incomplete
│   ├── functions/              # Edge functions
│   └── migrations/             # Empty - needs population
├── .env.example                # Environment template
├── package.json                # Scripts and dependencies
└── vite.config.ts             # Vite configuration
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── supabase/
│   ├── config.toml            # NEW: Supabase local configuration
│   ├── .gitignore             # NEW: Ignore local-only files
│   └── migrations/            # Will be populated in Phase 2
├── scripts/
│   └── setup-local.sh         # NEW: Automated setup script
├── .env.local                 # NEW: Local environment variables
├── .env.staging               # NEW: Staging environment variables  
└── .env.production           # NEW: Production environment variables
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Vite uses import.meta.env, not process.env
// Example: import.meta.env.VITE_SUPABASE_URL

// CRITICAL: Environment variables must be prefixed with VITE_
// Example: VITE_SUPABASE_URL, not SUPABASE_URL

// CRITICAL: Docker must be running before supabase start
// Docker Desktop or compatible runtime required

// CRITICAL: Default ports must be available
// API: 54321, DB: 54322, Studio: 54323
```

## Implementation Blueprint

### Data models and structure

```typescript
// Environment configuration types
interface EnvironmentConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
  VITE_TURNSTILE_SITE_KEY?: string;
  NODE_ENV: 'development' | 'staging' | 'production';
}

// Supabase status type for verification
interface SupabaseStatus {
  API: { running: boolean; port: number };
  Database: { running: boolean; port: number };
  Studio: { running: boolean; port: number };
  Storage: { running: boolean };
  Auth: { running: boolean };
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE scripts/setup-local.sh
  - IMPLEMENT: Automated setup script for prerequisites check and installation
  - INCLUDE: Docker verification, Supabase CLI installation, initial setup
  - FOLLOW pattern: Bash scripting best practices with error handling
  - NAMING: setup-local.sh (executable with chmod +x)
  - PLACEMENT: scripts/ directory at project root

Task 2: EXECUTE Supabase initialization
  - RUN: supabase init (creates supabase/config.toml)
  - CONFIGURE: Modify generated config.toml with project-specific settings
  - FOLLOW pattern: PRD Appendix C configuration examples
  - CRITICAL: Set auth.site_url to "http://localhost:5173"
  - PLACEMENT: supabase/config.toml

Task 3: CREATE environment configuration files
  - CREATE: .env.local with local Supabase credentials
  - CREATE: .env.staging with staging credentials
  - CREATE: .env.production with production credentials  
  - FOLLOW pattern: .env.example structure
  - CRITICAL: Never commit actual .env files to git
  - PLACEMENT: Project root

Task 4: UPDATE .gitignore
  - ADD: .env.local, .env.staging, .env.production
  - ADD: supabase/.temp, supabase/.branches
  - FOLLOW pattern: Existing .gitignore structure
  - CRITICAL: Prevent accidental credential commits
  - PLACEMENT: Project root .gitignore

Task 5: START local Supabase stack
  - RUN: supabase start (first run downloads Docker images)
  - CAPTURE: Local credentials from output
  - UPDATE: .env.local with captured credentials
  - VERIFY: All services running with supabase status
  - CRITICAL: Save credentials before they scroll off screen

Task 6: UPDATE package.json scripts
  - ADD: "supabase:start": "supabase start"
  - ADD: "supabase:stop": "supabase stop"
  - ADD: "supabase:status": "supabase status"
  - ADD: "supabase:reset": "supabase db reset"
  - ADD: "dev:local": "supabase start && npm run dev"
  - PLACEMENT: package.json scripts section

Task 7: CREATE verification script
  - CREATE: scripts/verify-local.sh
  - IMPLEMENT: Health checks for all services
  - INCLUDE: Port availability, Docker status, connection tests
  - FOLLOW pattern: Exit codes for CI/CD integration
  - PLACEMENT: scripts/ directory

Task 8: UPDATE application configuration
  - MODIFY: src/lib/supabase.ts if needed for environment detection
  - TEST: Application connects to local Supabase
  - VERIFY: No hardcoded production URLs
  - FOLLOW pattern: Existing environment variable usage
  - CRITICAL: Maintain backward compatibility
```

### Implementation Patterns & Key Details

```bash
#!/bin/bash
# scripts/setup-local.sh - Foundation setup script

set -e  # Exit on error

echo "🚀 Setting up HSA Songbook Local Development Environment"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop:"
    echo "   macOS/Windows: https://www.docker.com/products/docker-desktop"
    echo "   Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi

# Install Supabase CLI based on platform
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install supabase/tap/supabase || {
            echo "❌ Failed to install via Homebrew"
            echo "Manual install: https://supabase.com/docs/guides/cli"
            exit 1
        }
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo "Please install from: https://github.com/supabase/cli/releases"
            exit 1
        fi
    else
        # Windows (Git Bash/WSL)
        echo "Please install Supabase CLI:"
        echo "Scoop: scoop install supabase"
        echo "Or download from: https://github.com/supabase/cli/releases"
        exit 1
    fi
fi

# Initialize Supabase if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Initializing Supabase project..."
    supabase init
fi

# Create environment files from template
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local after setup completes"
fi

# Start local stack
echo "🐳 Starting Supabase Docker containers..."
echo "This may take several minutes on first run..."
supabase start

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with the credentials shown above"
echo "2. Run 'npm run dev' to start the application"
echo "3. Access Studio at http://localhost:54323"
```

```toml
# supabase/config.toml - Local configuration
# Generated by supabase init, customize as needed

project_id = "hsa-songbook-local"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[studio]
enabled = true
port = 54323
api_port = 54321

[auth]
enabled = true
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = false
enable_confirmations = false

[storage]
enabled = true
file_size_limit = "50MiB"

[edge_runtime]
enabled = true
policy = "oneshot"
inspector_port = 8083

[analytics]
enabled = false
```

### Integration Points

```yaml
ENVIRONMENT:
  - file: ".env.local"
  - pattern: "VITE_SUPABASE_URL=http://localhost:54321"
  - pattern: "VITE_SUPABASE_PUBLISHABLE_KEY=<from-supabase-start-output>"

SCRIPTS:
  - update: "package.json"
  - add: '"supabase:start": "supabase start"'
  - add: '"supabase:stop": "supabase stop"'

DOCKER:
  - verify: "docker --version"
  - check: "docker info"
  - ports: "54321, 54322, 54323, 54324"

GITIGNORE:
  - add: ".env.local"
  - add: "supabase/.temp"
  - add: "supabase/.branches"
```

## Validation Loop

### Level 1: Prerequisites Check

```bash
# Verify Docker installation and running status
docker --version || echo "Docker not installed"
docker info > /dev/null 2>&1 || echo "Docker not running"

# Verify Supabase CLI installation
supabase --version || echo "Supabase CLI not installed"

# Check required ports are available
lsof -i :54321 > /dev/null 2>&1 && echo "Port 54321 in use" || echo "Port 54321 available"
lsof -i :54322 > /dev/null 2>&1 && echo "Port 54322 in use" || echo "Port 54322 available"
lsof -i :54323 > /dev/null 2>&1 && echo "Port 54323 in use" || echo "Port 54323 available"

# Expected: All tools installed, Docker running, ports available
```

### Level 2: Supabase Stack Validation

```bash
# Initialize and start Supabase
supabase init || echo "Already initialized"
supabase start

# Check service status
supabase status

# Verify all services running
supabase status | grep -E "RUNNING|running" | wc -l
# Expected: At least 5 services running

# Test database connection
supabase db query "SELECT 1" --local || echo "Database connection failed"

# Expected: All services running, database accessible
```

### Level 3: Application Integration

```bash
# Ensure environment file exists
test -f .env.local || cp .env.example .env.local

# Start development server with local backend
npm run dev &
DEV_PID=$!
sleep 5

# Test application health
curl -f http://localhost:5173 || echo "Application not responding"

# Test Supabase connection from app
curl -f http://localhost:54321/rest/v1/ || echo "Supabase API not responding"

# Access Studio dashboard
open http://localhost:54323 || xdg-open http://localhost:54323 || echo "Visit http://localhost:54323"

# Cleanup
kill $DEV_PID 2>/dev/null

# Expected: Application runs, connects to local Supabase, Studio accessible
```

### Level 4: Feature Verification

```bash
# Test specific features with local backend
# This will be feature-specific based on application

# Test authentication flow (if configured)
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' || echo "Auth not configured"

# Test storage (if configured)
curl http://localhost:54321/storage/v1/bucket || echo "Storage not configured"

# Test realtime (if configured)
curl http://localhost:54321/realtime/v1/websocket || echo "Realtime not configured"

# Verify TypeScript types can be generated
supabase gen types typescript --local > /tmp/test-types.ts && echo "Type generation working"

# Expected: Core features functional with local backend
```

## Final Validation Checklist

### Technical Validation

- [ ] Docker installed and running
- [ ] Supabase CLI installed and accessible
- [ ] All required ports available (54321, 54322, 54323)
- [ ] Supabase stack starts without errors
- [ ] All services show as running in `supabase status`

### Feature Validation

- [ ] Application connects to local Supabase
- [ ] Studio dashboard accessible at http://localhost:54323
- [ ] Database queries work through Studio
- [ ] Environment variables properly configured
- [ ] No hardcoded production URLs in codebase

### Code Quality Validation

- [ ] Setup script has proper error handling
- [ ] Environment files follow .env.example pattern
- [ ] Git ignores sensitive files (.env.local)
- [ ] Package.json scripts added for common operations
- [ ] Configuration files properly commented

### Documentation & Deployment

- [ ] Setup instructions clear and tested
- [ ] Common issues documented with solutions
- [ ] Scripts are executable (chmod +x)
- [ ] Verification script provides clear pass/fail status

---

## Anti-Patterns to Avoid

- ❌ Don't commit .env.local or any credentials
- ❌ Don't hardcode localhost URLs in application code
- ❌ Don't skip Docker verification before running supabase start
- ❌ Don't use production credentials in local environment
- ❌ Don't modify supabase/config.toml without understanding impacts
- ❌ Don't ignore port conflicts - resolve them properly
- ❌ Don't skip the verification steps
- ❌ Don't forget to save Supabase start output credentials

## Confidence Score: 9/10

High confidence due to comprehensive research, clear documentation references, and well-defined validation steps. The implementation is straightforward with proper error handling and verification at each step.