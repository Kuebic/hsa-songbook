# Supabase Local Development Environment - Product Requirements Document

## Executive Summary

This PRD outlines the implementation of a comprehensive local Supabase development environment for the HSA Songbook application, enabling developers to work offline, test database changes safely, and maintain consistency across development, staging, and production environments. The solution includes Docker-based local infrastructure, migration workflows, seed data management, and comprehensive documentation updates.

## Problem Statement

### Current Challenges
- **No local development environment**: Developers directly connect to cloud Supabase instance
- **Risk of data corruption**: Testing against production or shared development databases
- **Slow iteration cycles**: Network latency and cloud deployment times
- **Cost implications**: Cloud resource usage for development and testing
- **Limited offline capability**: Cannot develop without internet connection
- **Inconsistent environments**: No standardized local setup across team members

### Impact
- Increased development friction and slower feature delivery
- Higher risk of production data issues
- Increased cloud costs from development usage
- Limited ability to test database migrations safely
- Difficulty onboarding new developers

## Solution Overview

Implement a Docker-based local Supabase stack that mirrors production capabilities, with automated setup, migration management, and comprehensive documentation for seamless developer experience.

### Key Components
1. **Local Supabase Stack**: Full-featured local environment using Docker
2. **Migration System**: Version-controlled database schema changes
3. **Seed Data Management**: Reproducible test data for consistent testing
4. **Environment Configuration**: Seamless switching between local/staging/production
5. **Documentation Suite**: README, ONBOARDING, and QUICKSTART guides

## User Stories

### Epic: Local Development Environment Setup

#### Story 1: Initial Local Setup
**As a** new developer  
**I want** to quickly set up a local Supabase environment  
**So that** I can start developing immediately without cloud dependencies

**Acceptance Criteria:**
- [ ] Single command setup process
- [ ] Automatic Docker dependency verification
- [ ] Clear error messages if prerequisites missing
- [ ] Success confirmation with connection details
- [ ] Works on macOS, Linux, and Windows (WSL2)

**Technical Notes:**
- Use `supabase init` and `supabase start`
- Detect Docker installation and version
- Generate local credentials automatically

#### Story 2: Database Migration Development
**As a** developer  
**I want** to create and test database migrations locally  
**So that** I can safely verify schema changes before deployment

**Acceptance Criteria:**
- [ ] Create migrations from SQL files or auto-diff
- [ ] Test migrations with rollback capability
- [ ] Preview migration effects before applying
- [ ] Version control integration
- [ ] Conflict resolution guidance

**Technical Notes:**
- Store migrations in `supabase/migrations/`
- Use timestamp-based naming convention
- Support both up and down migrations

#### Story 3: Seed Data Management
**As a** developer  
**I want** consistent test data across environments  
**So that** I can reproduce bugs and test features reliably

**Acceptance Criteria:**
- [ ] Automatic seed data loading on reset
- [ ] Environment-specific seed files
- [ ] Support for relational data integrity
- [ ] Performance-optimized bulk inserts
- [ ] Exclude sensitive production data

**Technical Notes:**
- Use `supabase/seed.sql` for default data
- Support TypeScript seed scripts for complex scenarios
- Implement data generation helpers

#### Story 4: Environment Switching
**As a** developer  
**I want** to easily switch between local, staging, and production  
**So that** I can test across different environments efficiently

**Acceptance Criteria:**
- [ ] Environment variables for configuration
- [ ] Visual indicators of current environment
- [ ] Prevent accidental production operations
- [ ] Credential management security
- [ ] Quick environment status check

**Technical Notes:**
- Use `.env.local`, `.env.staging`, `.env.production`
- Implement environment detection in app
- Add safeguards for destructive operations

## Technical Architecture

### System Components Diagram
```mermaid
graph TB
    subgraph "Local Development Stack"
        DC[Docker Compose]
        DC --> PG[PostgreSQL 15]
        DC --> AUTH[GoTrue Auth]
        DC --> STORE[Storage API]
        DC --> REAL[Realtime]
        DC --> EDGE[Edge Functions]
        DC --> STUDIO[Studio Dashboard]
    end
    
    subgraph "Development Tools"
        CLI[Supabase CLI]
        CLI --> DC
        CLI --> MIG[Migration Engine]
        CLI --> SEED[Seed Manager]
        CLI --> TYPE[TypeScript Generator]
    end
    
    subgraph "Application Layer"
        APP[HSA Songbook App]
        APP --> ENV[Environment Config]
        ENV --> |Local| DC
        ENV --> |Staging| STAGE[Staging Supabase]
        ENV --> |Production| PROD[Production Supabase]
    end
    
    subgraph "Version Control"
        GIT[Git Repository]
        GIT --> MIGF[supabase/migrations/]
        GIT --> SEEDF[supabase/seed.sql]
        GIT --> CONF[supabase/config.toml]
    end
```

### Data Flow Diagram
```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CLI as Supabase CLI
    participant Docker as Docker Stack
    participant App as Application
    participant Git as Git Repository
    
    Dev->>CLI: supabase start
    CLI->>Docker: Start containers
    Docker-->>CLI: Return credentials
    CLI-->>Dev: Display connection info
    
    Dev->>App: npm run dev
    App->>Docker: Connect to local DB
    
    Dev->>CLI: supabase db diff
    CLI->>Docker: Compare schemas
    CLI-->>Dev: Generate migration
    
    Dev->>Git: Commit migration
    Git->>CI: Trigger pipeline
    CI->>Stage: Apply migrations
```

### Environment Configuration Flow
```mermaid
flowchart LR
    subgraph "Configuration Files"
        ENV[.env]
        ENVL[.env.local]
        ENVS[.env.staging]
        ENVP[.env.production]
    end
    
    subgraph "Environment Detection"
        DETECT{Detect Environment}
        DETECT -->|Local Dev| ENVL
        DETECT -->|Staging| ENVS
        DETECT -->|Production| ENVP
        DETECT -->|Default| ENV
    end
    
    subgraph "Application Runtime"
        CONFIG[Runtime Config]
        CLIENT[Supabase Client]
    end
    
    DETECT --> CONFIG
    CONFIG --> CLIENT
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Objective**: Establish core local development infrastructure

**Tasks**:
1. Install and configure Supabase CLI
2. Initialize Supabase project structure
3. Set up Docker environment
4. Configure environment variables
5. Create initial migration from existing schema
6. Verify local stack functionality

**Success Criteria**:
- Local Supabase accessible at http://localhost:54321
- Studio dashboard available at http://localhost:54323
- Application connects to local database
- All existing features work locally

### Phase 2: Migration System (Week 1-2)
**Objective**: Implement robust migration workflow

**Tasks**:
1. Extract current database schema
2. Create baseline migration
3. Set up migration testing process
4. Document migration best practices
5. Implement CI/CD migration pipeline
6. Add migration rollback procedures

**Success Criteria**:
- All schema in version control
- Migrations apply cleanly to fresh database
- CI/CD automatically applies migrations
- Rollback process documented and tested

### Phase 3: Seed Data & Testing (Week 2)
**Objective**: Create comprehensive test data system

**Tasks**:
1. Design seed data structure
2. Create base seed.sql file
3. Add song and arrangement samples
4. Implement user and permission seeds
5. Create data generation utilities
6. Add environment-specific seeds

**Success Criteria**:
- Consistent seed data across resets
- Realistic test scenarios covered
- Performance acceptable (<5s load time)
- No production data exposure

### Phase 4: Documentation & Onboarding (Week 2-3)
**Objective**: Complete documentation suite

**Tasks**:
1. Update README with local setup
2. Create QUICKSTART guide
3. Write comprehensive ONBOARDING doc
4. Add troubleshooting section
5. Document workflow examples
6. Create video walkthrough (optional)

**Success Criteria**:
- New developer setup <15 minutes
- All common issues documented
- Clear workflow guidelines
- Migration procedures documented

### Phase 5: Team Rollout (Week 3)
**Objective**: Deploy to development team

**Tasks**:
1. Team training session
2. Gather feedback and iterate
3. Address edge cases
4. Optimize performance
5. Finalize documentation
6. Establish support process

**Success Criteria**:
- All developers using local environment
- Feedback incorporated
- Support process established
- Performance benchmarks met

## API Specifications

### Environment Variables
```typescript
interface EnvironmentConfig {
  // Supabase Configuration
  VITE_SUPABASE_URL: string;           // Local: http://localhost:54321
  VITE_SUPABASE_PUBLISHABLE_KEY: string; // Local anon key
  
  // Optional Services
  VITE_TURNSTILE_SITE_KEY?: string;    // Captcha for auth
  
  // Environment Indicators
  NODE_ENV: 'development' | 'staging' | 'production';
  
  // Docker Configuration (local only)
  DOCKER_SOCKET_LOCATION?: string;     // For rootless Docker
}
```

### CLI Commands
```bash
# Core Operations
supabase init          # Initialize project
supabase start         # Start local stack
supabase stop          # Stop local stack
supabase status        # Check service status

# Database Operations
supabase db reset      # Reset to clean state with seeds
supabase db diff       # Generate migration from changes
supabase db push       # Push migrations to remote
supabase migration new # Create new migration file

# Type Generation
supabase gen types typescript --local > src/lib/database.types.ts

# Seed Operations
supabase db seed       # Run seed files
supabase db dump       # Export current data
```

### Migration File Structure
```sql
-- Migration: YYYYMMDDHHMMSS_description.sql
-- Description: Clear description of changes
-- Author: Developer Name
-- Date: YYYY-MM-DD

-- Up Migration
BEGIN;

-- Schema changes here
CREATE TABLE IF NOT EXISTS example (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE example ENABLE ROW LEVEL SECURITY;

CREATE POLICY "example_select" ON example
    FOR SELECT TO authenticated
    USING (true);

COMMIT;

-- Down Migration (in separate file if needed)
-- DROP TABLE IF EXISTS example;
```

## Data Models

### Local Configuration Schema
```typescript
// supabase/config.toml structure
interface SupabaseConfig {
  project_id: string;
  
  [key: 'api']: {
    enabled: boolean;
    port: number;
    schemas: string[];
    extra_search_path: string[];
    max_rows: number;
  };
  
  [key: 'db']: {
    port: number;
    shadow_port: number;
    major_version: number;
  };
  
  [key: 'studio']: {
    enabled: boolean;
    port: number;
    api_url: string;
  };
  
  [key: 'auth']: {
    enabled: boolean;
    site_url: string;
    additional_redirect_urls: string[];
    jwt_expiry: number;
    enable_signup: boolean;
    email: {
      enable_signup: boolean;
      enable_confirmations: boolean;
    };
    external?: {
      [provider: string]: {
        enabled: boolean;
        client_id: string;
        secret: string;
      };
    };
  };
  
  [key: 'storage']: {
    enabled: boolean;
    file_size_limit: string;
  };
}
```

### Seed Data Structure
```typescript
// Types for seed data generation
interface SeedConfig {
  users: {
    count: number;
    roles: ('admin' | 'moderator' | 'user')[];
  };
  
  songs: {
    count: number;
    languages: string[];
    categories: string[];
  };
  
  arrangements: {
    perSong: number;
    keys: string[];
    difficulties: ('easy' | 'medium' | 'hard')[];
  };
  
  setlists: {
    count: number;
    songsPerSetlist: number;
  };
}
```

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Docker compatibility issues | High | Medium | Provide fallback cloud dev environment, test on all platforms |
| Migration conflicts | High | Medium | Implement conflict detection, provide resolution guide |
| Data consistency issues | High | Low | Add validation checks, automated testing |
| Performance degradation | Medium | Low | Monitor query performance, optimize indexes |
| Seed data corruption | Low | Low | Version control seeds, validation scripts |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Developer resistance | Medium | Low | Provide training, emphasize benefits |
| Onboarding complexity | Medium | Medium | Simplify setup, improve documentation |
| Environment confusion | High | Low | Clear visual indicators, safeguards |
| Secret exposure | High | Low | Git hooks, secret scanning, .env templates |

## Success Metrics

### Quantitative Metrics
- **Setup Time**: <15 minutes for new developer
- **Migration Success Rate**: >99% successful applications
- **Test Coverage**: >80% with local environment
- **Development Velocity**: 20% increase in feature delivery
- **Bug Detection**: 30% earlier in development cycle
- **Cloud Costs**: 40% reduction in development usage

### Qualitative Metrics
- **Developer Satisfaction**: Survey score >4.5/5
- **Onboarding Feedback**: Positive reviews from new hires
- **Documentation Quality**: <5 support questions per month
- **Workflow Efficiency**: Reduced context switching
- **Team Confidence**: Increased willingness to refactor

### Tracking Methods
- Setup time logs from new developers
- Migration pipeline success rates
- Monthly developer surveys
- Support ticket analysis
- Code velocity metrics
- Cloud usage reports

## Appendices

### A. Installation Scripts

```bash
#!/bin/bash
# install-local-supabase.sh

echo "🚀 Setting up HSA Songbook Local Development Environment"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop first."
    exit 1
fi

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    brew install supabase/tap/supabase || {
        echo "Install from: https://supabase.com/docs/guides/cli"
        exit 1
    }
fi

# Initialize Supabase
echo "🔧 Initializing Supabase project..."
supabase init

# Copy environment template
echo "📝 Setting up environment variables..."
cp .env.example .env.local

# Start local stack
echo "🐳 Starting Docker containers..."
supabase start

# Run migrations
echo "📊 Applying database migrations..."
supabase db reset

# Generate types
echo "🏷️ Generating TypeScript types..."
npm run types:generate

echo "✅ Setup complete! Access Studio at http://localhost:54323"
```

### B. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 54321 already in use | Stop other services or configure alternative ports |
| Docker daemon not running | Start Docker Desktop application |
| Migration checksum mismatch | Run `supabase db reset --force` |
| Type generation fails | Ensure database is running and schema is valid |
| Slow container startup | Allocate more resources to Docker |
| Permission denied errors | Check Docker socket permissions |

### C. Environment Configuration Examples

```env
# .env.local - Local Development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=development

# .env.staging - Staging Environment
VITE_SUPABASE_URL=https://staging-xyz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=staging

# .env.production - Production Environment
VITE_SUPABASE_URL=https://prod-abc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

### D. Migration Workflow Diagram

```mermaid
flowchart TD
    Start([Developer makes schema change])
    Start --> Local[Work in local environment]
    
    Local --> Studio{Using Studio?}
    Studio -->|Yes| StudioChange[Make changes in Studio UI]
    Studio -->|No| SQLChange[Write SQL migration]
    
    StudioChange --> Diff[Run: supabase db diff]
    SQLChange --> Create[Run: supabase migration new]
    
    Diff --> Review[Review generated migration]
    Create --> Review
    
    Review --> Test[Test migration locally]
    Test --> Reset[Run: supabase db reset]
    
    Reset --> Verify{Changes correct?}
    Verify -->|No| Fix[Fix migration]
    Fix --> Test
    
    Verify -->|Yes| Commit[Commit to Git]
    Commit --> PR[Open Pull Request]
    
    PR --> CI[CI runs migrations on preview branch]
    CI --> Approve{PR Approved?}
    
    Approve -->|No| FixPR[Address feedback]
    FixPR --> PR
    
    Approve -->|Yes| Merge[Merge to main]
    Merge --> Deploy[Auto-deploy to production]
    
    Deploy --> End([Schema updated in production])
```

### E. Quick Reference Card

```markdown
# HSA Songbook - Local Supabase Quick Reference

## Daily Commands
- Start: `supabase start`
- Stop: `supabase stop`
- Reset: `supabase db reset`
- Status: `supabase status`

## Development Workflow
1. Make changes locally
2. Test with: `npm run dev`
3. Generate migration: `supabase db diff`
4. Apply migration: `supabase db reset`
5. Commit changes: `git add . && git commit`

## URLs
- App: http://localhost:5173
- Database: postgresql://postgres:postgres@localhost:54322/postgres
- Studio: http://localhost:54323
- API: http://localhost:54321

## Troubleshooting
- Containers not starting: Check Docker
- Port conflicts: Change in config.toml
- Migration errors: Check SQL syntax
- Type errors: Regenerate with `npm run types:generate`
```

## Implementation Checklist

### Pre-Implementation
- [ ] Docker Desktop installed on all developer machines
- [ ] Supabase CLI installation documented
- [ ] Backup current production schema
- [ ] Team training scheduled

### Implementation
- [ ] Initialize Supabase project structure
- [ ] Create baseline migration from current schema
- [ ] Set up seed data file
- [ ] Configure environment variables
- [ ] Update application configuration
- [ ] Add npm scripts for common operations
- [ ] Create TypeScript type generation script

### Documentation
- [ ] Update README.md with local setup section
- [ ] Create QUICKSTART.md guide
- [ ] Write comprehensive ONBOARDING.md
- [ ] Add troubleshooting guide
- [ ] Document migration workflow
- [ ] Create architecture diagrams

### Testing
- [ ] Verify all features work locally
- [ ] Test migration application
- [ ] Validate seed data loading
- [ ] Check type generation
- [ ] Test environment switching
- [ ] Verify CI/CD pipeline

### Rollout
- [ ] Team demo session
- [ ] Collect initial feedback
- [ ] Address issues and concerns
- [ ] Monitor adoption metrics
- [ ] Iterate based on usage

---

*This PRD provides a comprehensive blueprint for implementing a local Supabase development environment. The phased approach ensures minimal disruption while maximizing developer productivity and code quality.*