name: "MongoDB & Mongoose Integration for HSA Songbook"
description: |
  Complete implementation of MongoDB backend with Mongoose schemas, Express API server, 
  Clerk authentication integration, and ZSTD compression for ChordPro data storage.

---

## Goal

**Feature Goal**: Implement a complete MongoDB backend with Express API server that integrates with the existing React/Vite frontend, providing persistent data storage for songs, arrangements, setlists, and user data.

**Deliverable**: 
- Express.js API server with TypeScript
- MongoDB database with Mongoose schemas
- Clerk webhook integration for user sync
- ZSTD compression for ChordPro chord data
- RESTful API endpoints for all CRUD operations
- Complete test suite for backend operations

**Success Definition**: Backend API server running on port 5000, successfully handling all frontend requests with proper authentication, data persistence, and compression achieving 60%+ storage savings.

## User Persona

**Target User**: Worship leaders and musicians

**Use Case**: Creating, organizing, and accessing worship song arrangements with personalized setlists

**User Journey**: 
1. User signs in via Clerk → synced to MongoDB users collection
2. Searches/browses songs → fetched from MongoDB with metadata
3. Views arrangement → decompressed ChordPro data delivered
4. Creates setlist → persisted with user association
5. Shares setlist → public URL with access control

**Pain Points Addressed**: 
- No persistent storage currently (using mock data)
- No user-specific data
- No real search functionality
- No arrangement compression

## Why

- Enable persistent data storage replacing current mock data
- Support multi-user functionality with Clerk authentication
- Reduce storage costs with 60-80% compression of chord data
- Enable full-text search across songs
- Support offline-capable progressive web app features

## What

### Backend Server Implementation
- Express.js server with TypeScript configuration
- MongoDB connection with retry logic and connection pooling
- Mongoose schemas matching DATABASE-SCHEMA.md specifications
- RESTful API endpoints for songs, arrangements, setlists, users
- Clerk webhook endpoints for user synchronization
- ZSTD compression service for ChordPro data

### Success Criteria

- [ ] Express server runs on port 5000 with health check endpoint
- [ ] MongoDB connection established with proper pooling
- [ ] All Mongoose schemas created with proper validation
- [ ] CRUD operations work for all collections
- [ ] Clerk users sync to MongoDB via webhooks
- [ ] ChordPro data compresses by 60%+ with ZSTD
- [ ] API endpoints return proper status codes and error messages
- [ ] Frontend successfully fetches data from API endpoints
- [ ] Tests pass with 80%+ coverage

## All Needed Context

### Context Completeness Check

_This PRP contains all MongoDB/Mongoose patterns, Clerk integration details, compression implementation, and existing codebase patterns needed for successful implementation._

### Documentation & References

```yaml
# MUST READ - Critical documentation
- url: https://mongoosejs.com/docs/typescript.html
  why: TypeScript integration patterns for Mongoose schemas
  critical: Proper typing for Document interfaces and schema methods

- url: https://clerk.com/docs/webhooks/sync-data
  why: Webhook implementation for user synchronization
  critical: Signature verification and event handling patterns

- url: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/network-compression/
  why: MongoDB compression configuration
  critical: Connection string parameters for compression

- url: https://github.com/mongodb-js/zstd
  why: Official MongoDB ZSTD package documentation
  critical: Async compression/decompression API

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/claude_md_files/DATABASE-SCHEMA.md
  why: Complete database schema specifications
  pattern: Schema structure, relationships, indexes
  gotcha: songIds array in Arrangements enables mashups

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/songs/types/song.types.ts
  why: Existing TypeScript interfaces to match
  pattern: Interface structure for frontend compatibility
  gotcha: Must maintain same property names for frontend

- docfile: PRPs/ai_docs/mongodb_express_integration.md
  why: Complete Express/MongoDB integration patterns
  section: All sections - comprehensive implementation guide

- docfile: PRPs/ai_docs/zstd_compression_guide.md
  why: ZSTD compression implementation for ChordPro
  section: Compression service and Arrangement model sections
```

### Current Codebase Structure

```bash
hsa-songbook/
├── src/                    # Frontend React application
│   ├── app/               # Main app setup
│   ├── features/          # Feature modules
│   │   ├── songs/        # Song components and types
│   │   ├── setlists/     # Setlist components
│   │   └── auth/         # Auth hooks using Clerk
│   └── shared/           # Shared utilities
├── package.json           # Frontend dependencies
├── vite.config.ts        # Vite configuration
└── .env.local            # Environment variables
```

### Desired Codebase Structure with Vertical Slice Architecture

```bash
hsa-songbook/
├── src/                    # Frontend (unchanged)
├── server/                 # NEW: Backend server (Vertical Slice Architecture)
│   ├── app.ts             # Express app setup
│   ├── server.ts          # Server entry point
│   ├── shared/            # Shared/cross-cutting concerns
│   │   ├── config/        # Configuration
│   │   │   ├── database.ts    # MongoDB connection
│   │   │   └── env.ts         # Environment config
│   │   ├── middleware/    # Global middleware
│   │   │   ├── auth.ts        # Clerk authentication
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts  # Zod validation
│   │   ├── services/      # Shared services
│   │   │   └── compressionService.ts  # ZSTD compression
│   │   └── utils/         # Shared utilities
│   │       ├── errors.ts      # Error classes
│   │       └── catchAsync.ts  # Async error wrapper
│   ├── features/          # Feature slices (vertical)
│   │   ├── songs/         # Songs feature slice
│   │   │   ├── song.model.ts         # Mongoose schema
│   │   │   ├── song.controller.ts    # Request handlers
│   │   │   ├── song.routes.ts        # Routes
│   │   │   ├── song.service.ts       # Business logic
│   │   │   ├── song.validation.ts    # Zod schemas
│   │   │   ├── song.types.ts         # TypeScript types
│   │   │   └── __tests__/
│   │   │       └── song.test.ts      # Feature tests
│   │   ├── arrangements/  # Arrangements feature slice
│   │   │   ├── arrangement.model.ts
│   │   │   ├── arrangement.controller.ts
│   │   │   ├── arrangement.routes.ts
│   │   │   ├── arrangement.service.ts
│   │   │   ├── arrangement.validation.ts
│   │   │   ├── arrangement.types.ts
│   │   │   └── __tests__/
│   │   │       └── arrangement.test.ts
│   │   ├── setlists/      # Setlists feature slice
│   │   │   ├── setlist.model.ts
│   │   │   ├── setlist.controller.ts
│   │   │   ├── setlist.routes.ts
│   │   │   ├── setlist.service.ts
│   │   │   ├── setlist.validation.ts
│   │   │   ├── setlist.types.ts
│   │   │   └── __tests__/
│   │   │       └── setlist.test.ts
│   │   ├── users/         # Users feature slice
│   │   │   ├── user.model.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.validation.ts
│   │   │   ├── user.types.ts
│   │   │   ├── webhook.controller.ts  # Clerk webhooks
│   │   │   └── __tests__/
│   │   │       ├── user.test.ts
│   │   │       └── webhook.test.ts
│   │   ├── reviews/       # Reviews feature slice
│   │   │   ├── review.model.ts
│   │   │   ├── review.controller.ts
│   │   │   ├── review.routes.ts
│   │   │   ├── review.service.ts
│   │   │   ├── review.validation.ts
│   │   │   ├── review.types.ts
│   │   │   └── __tests__/
│   │   │       └── review.test.ts
│   │   └── verses/        # Verses feature slice
│   │       ├── verse.model.ts
│   │       ├── verse.controller.ts
│   │       ├── verse.routes.ts
│   │       ├── verse.service.ts
│   │       ├── verse.validation.ts
│   │       ├── verse.types.ts
│   │       └── __tests__/
│   │           └── verse.test.ts
│   └── __tests__/         # Integration tests
│       └── setup.ts       # Test configuration
├── package-server.json     # NEW: Backend dependencies
├── tsconfig.server.json    # NEW: Backend TypeScript config
├── .env.server            # NEW: Backend environment variables
└── nodemon.json           # NEW: Development server config
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Clerk webhook signature verification requires raw body
// Must use express.raw() middleware for webhook endpoint
app.post('/api/webhooks/clerk', express.raw({type: 'application/json'}), webhookHandler)

// CRITICAL: ZSTD compression returns Buffer, not string
// Store as Buffer in MongoDB, convert for client response
chordData: Buffer // in schema
res.json({ chordData: decompressedString }) // in response

// CRITICAL: Mongoose with TypeScript requires explicit typing
// Use generics for model creation
const Song = model<ISong>('Song', songSchema)

// CRITICAL: Vite proxy only works in development
// Production needs proper CORS configuration
cors({ origin: process.env.FRONTEND_URL })

// CRITICAL: MongoDB free tier has 512MB limit
// Monitor documentSize field, use compression
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// server/types/models.ts - Core TypeScript interfaces
export interface ISong extends Document {
  title: string
  artist?: string
  slug: string // unique, indexed
  compositionYear?: number
  ccli?: string
  themes: string[]
  source?: string
  notes?: string
  defaultArrangementId?: Types.ObjectId
  metadata: {
    createdBy: Types.ObjectId
    lastModifiedBy?: Types.ObjectId
    isPublic: boolean
    ratings: { average: number; count: number }
    views: number
  }
  documentSize: number
}

export interface IArrangement extends Document {
  name: string
  songIds: Types.ObjectId[] // Array for mashups
  slug: string
  createdBy: Types.ObjectId
  chordData: Buffer // ZSTD compressed
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  metadata: {
    isMashup: boolean
    isPublic: boolean
    views: number
  }
  documentSize: number
}

export interface IUser extends Document {
  clerkId: string // Unique Clerk user ID
  email: string
  username: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  preferences: {
    defaultKey?: string
    fontSize: number
    theme: 'light' | 'dark' | 'stage'
  }
  stats: {
    songsCreated: number
    arrangementsCreated: number
    setlistsCreated: number
  }
  isActive: boolean
}

export interface ISetlist extends Document {
  name: string
  description?: string
  createdBy: Types.ObjectId
  songs: Array<{
    arrangementId?: Types.ObjectId
    transposeBy: number
    notes?: string
    order: number
  }>
  tags: string[]
  metadata: {
    date?: Date
    venue?: string
    isPublic: boolean
    shareToken?: string
    category?: 'worship' | 'practice' | 'event' | 'personal'
  }
}
```

### Implementation Tasks (Vertical Slice Architecture)

```yaml
Task 1: CREATE server/package.json and TypeScript configuration
  - IMPLEMENT: Backend package.json with Express, MongoDB, Clerk dependencies
  - FOLLOW pattern: Standard Express/TypeScript setup
  - DEPENDENCIES: @mongodb-js/zstd, mongoose, express, @clerk/clerk-sdk-node, zod
  - PLACEMENT: Root level package-server.json
  - VALIDATE: npm install completes successfully

Task 2: CREATE server/shared/ infrastructure
  - IMPLEMENT: Shared config, middleware, services, utils
  - SUB-TASKS:
    - server/shared/config/database.ts - MongoDB connection with retry
    - server/shared/config/env.ts - Environment configuration
    - server/shared/middleware/auth.ts - Clerk JWT verification
    - server/shared/middleware/errorHandler.ts - Global error handling
    - server/shared/services/compressionService.ts - ZSTD compression
    - server/shared/utils/errors.ts - Error classes
  - FOLLOW pattern: PRPs/ai_docs/mongodb_express_integration.md
  - VALIDATE: Shared modules compile without errors

Task 3: CREATE server/features/songs/ vertical slice
  - IMPLEMENT: Complete songs feature with all layers
  - FILES:
    - song.types.ts - TypeScript interfaces
    - song.model.ts - Mongoose schema with indexes
    - song.validation.ts - Zod validation schemas
    - song.service.ts - Business logic layer
    - song.controller.ts - Request handlers
    - song.routes.ts - Express routes
    - __tests__/song.test.ts - Feature tests
  - FOLLOW pattern: Vertical slice - all related code together
  - CRITICAL: Text indexes for search, proper validation
  - VALIDATE: Songs CRUD operations work end-to-end

Task 4: CREATE server/features/arrangements/ vertical slice
  - IMPLEMENT: Arrangements with ZSTD compression
  - FILES:
    - arrangement.types.ts - TypeScript interfaces
    - arrangement.model.ts - Schema with Buffer for chordData
    - arrangement.validation.ts - Zod schemas
    - arrangement.service.ts - Compression/decompression logic
    - arrangement.controller.ts - Handle chord data
    - arrangement.routes.ts - Routes with auth
    - __tests__/arrangement.test.ts - Compression tests
  - CRITICAL: chordData stored as Buffer, compress on save
  - DEPENDENCIES: compressionService from Task 2
  - VALIDATE: 60%+ compression ratio achieved

Task 5: CREATE server/features/users/ vertical slice
  - IMPLEMENT: User management with Clerk sync
  - FILES:
    - user.types.ts - User interfaces
    - user.model.ts - User schema with clerkId
    - user.validation.ts - User validation
    - user.service.ts - User CRUD logic
    - user.controller.ts - User endpoints
    - webhook.controller.ts - Clerk webhook handler
    - user.routes.ts - User and webhook routes
    - __tests__/user.test.ts - User tests
    - __tests__/webhook.test.ts - Webhook tests
  - CRITICAL: Webhook needs express.raw() middleware
  - VALIDATE: Clerk users sync to MongoDB

Task 6: CREATE server/features/setlists/ vertical slice
  - IMPLEMENT: Setlist management
  - FILES:
    - setlist.types.ts - Setlist interfaces
    - setlist.model.ts - Setlist schema
    - setlist.validation.ts - Validation schemas
    - setlist.service.ts - Setlist logic
    - setlist.controller.ts - CRUD operations
    - setlist.routes.ts - Protected routes
    - __tests__/setlist.test.ts - Tests
  - CRITICAL: Embedded songs array for atomic updates
  - VALIDATE: Setlists save with user association

Task 7: CREATE server/features/reviews/ vertical slice
  - IMPLEMENT: Review system
  - FILES:
    - review.types.ts - Review interfaces
    - review.model.ts - Review schema
    - review.validation.ts - Validation
    - review.service.ts - Review logic
    - review.controller.ts - Review endpoints
    - review.routes.ts - Review routes
    - __tests__/review.test.ts - Tests
  - VALIDATE: Reviews linked to arrangements

Task 8: CREATE server/features/verses/ vertical slice
  - IMPLEMENT: Biblical verses feature
  - FILES:
    - verse.types.ts - Verse interfaces
    - verse.model.ts - Verse schema
    - verse.validation.ts - Validation
    - verse.service.ts - Verse logic
    - verse.controller.ts - Verse endpoints
    - verse.routes.ts - Verse routes
    - __tests__/verse.test.ts - Tests
  - VALIDATE: Verses linked to songs

Task 9: CREATE server/app.ts with feature registration
  - IMPLEMENT: Express app with vertical slice registration
  - PATTERN:
    ```typescript
    // Auto-register all feature routes
    import songRoutes from './features/songs/song.routes'
    import arrangementRoutes from './features/arrangements/arrangement.routes'
    // ... other features
    
    app.use('/api/v1/songs', songRoutes)
    app.use('/api/v1/arrangements', arrangementRoutes)
    ```
  - CRITICAL: CORS configuration, global error handler
  - VALIDATE: All feature routes accessible

Task 10: CREATE server/server.ts entry point
  - IMPLEMENT: Server startup with database connection
  - FOLLOW pattern: Connect DB, then start server
  - CRITICAL: Graceful shutdown handling
  - VALIDATE: Server starts on port 5000

Task 11: UPDATE vite.config.ts for API proxy
  - IMPLEMENT: Proxy configuration for /api routes
  - FOLLOW pattern: proxy: { '/api': { target: 'http://localhost:5000' }}
  - CRITICAL: changeOrigin: true for development
  - VALIDATE: Frontend can call /api endpoints

Task 12: UPDATE frontend services to use API
  - IMPLEMENT: Replace mock data with API calls
  - FILES:
    - src/features/songs/services/songService.ts
    - src/features/setlists/hooks/useSetlists.ts
  - FOLLOW pattern: fetch with error handling
  - VALIDATE: Frontend displays real data

Task 13: CREATE integration tests
  - IMPLEMENT: Cross-feature integration tests
  - FILES:
    - server/__tests__/setup.ts - Test configuration
    - server/__tests__/integration.test.ts - End-to-end tests
  - VALIDATE: 80%+ test coverage achieved
```

### Vertical Slice Architecture Example

```typescript
// server/features/songs/song.model.ts
import { Schema, model } from 'mongoose'
import { ISong } from './song.types'

const songSchema = new Schema<ISong>({
  title: { type: String, required: true },
  // ... schema definition
})

export const Song = model<ISong>('Song', songSchema)

// server/features/songs/song.service.ts
import { Song } from './song.model'
import { ISong, CreateSongDto } from './song.types'

export class SongService {
  async findAll(filter: any): Promise<ISong[]> {
    return Song.find(filter).lean()
  }
  
  async create(data: CreateSongDto): Promise<ISong> {
    return Song.create(data)
  }
  // ... other methods
}

// server/features/songs/song.controller.ts
import { Request, Response } from 'express'
import { SongService } from './song.service'

const songService = new SongService()

export const getSongs = async (req: Request, res: Response) => {
  const songs = await songService.findAll(req.query)
  res.json({ success: true, data: songs })
}

// server/features/songs/song.routes.ts
import { Router } from 'express'
import { requireAuth } from '../../shared/middleware/auth'
import { validate } from '../../shared/middleware/validation'
import { createSongSchema } from './song.validation'
import * as songController from './song.controller'

const router = Router()

router.get('/', songController.getSongs)
router.post('/', requireAuth, validate(createSongSchema), songController.createSong)

export default router

// server/app.ts - Feature registration
import songRoutes from './features/songs/song.routes'
import arrangementRoutes from './features/arrangements/arrangement.routes'

app.use('/api/v1/songs', songRoutes)
app.use('/api/v1/arrangements', arrangementRoutes)
```

### Integration Points

```yaml
DATABASE:
  - connection: "mongodb://localhost:27017/hsa-songbook-dev"
  - production: "mongodb+srv://[user]:[pass]@cluster.mongodb.net/hsa-songbook"
  - indexes: "Run createIndexes() on first startup"

ENVIRONMENT:
  - file: .env.server
  - vars:
    - MONGO_URI=mongodb://localhost:27017/hsa-songbook-dev
    - PORT=5000
    - CLERK_SECRET_KEY=sk_test_...
    - CLERK_WEBHOOK_SECRET=whsec_...
    - NODE_ENV=development

FRONTEND UPDATES:
  - services: "Update all service files to use fetch API"
  - proxy: "Configure Vite proxy for development"
  - env: "Add VITE_API_URL for production builds"

DEPLOYMENT:
  - scripts:
    - "dev:server": "nodemon server/server.ts"
    - "dev:full": "concurrently \"npm run dev\" \"npm run dev:server\""
    - "build:server": "tsc -p tsconfig.server.json"
```

## Validation Loop

### Level 1: Syntax & Type Checking

```bash
# Backend TypeScript compilation
cd server && npx tsc --noEmit
# Expected: No errors

# Backend linting
cd server && npm run lint
# Expected: No errors

# Frontend still works
npm run lint
npm run build
# Expected: Successful build
```

### Level 2: Unit & Integration Tests

```bash
# Run backend tests
cd server && npm test
# Expected: All tests pass

# Test compression service
cd server && npm test -- compression.test.ts
# Expected: 60%+ compression ratio

# Test API endpoints
cd server && npm test -- songs.test.ts
# Expected: CRUD operations work

# Frontend tests still pass
npm test
# Expected: All tests pass
```

### Level 3: Full Stack Integration

```bash
# Start MongoDB
mongod --dbpath ./data/db

# Start backend server
cd server && npm run dev
# Expected: "MongoDB Connected" and "Server running on port 5000"

# Test health endpoint
curl http://localhost:5000/health
# Expected: {"status":"OK","timestamp":"..."}

# Start frontend
npm run dev
# Expected: Vite dev server starts

# Test API proxy
curl http://localhost:5173/api/v1/songs
# Expected: JSON response with songs array

# Test Clerk webhook (with ngrok)
ngrok http 5000
# Configure webhook URL in Clerk dashboard
# Create new user in Clerk
# Expected: User appears in MongoDB users collection

# Test compression
curl -X POST http://localhost:5000/api/v1/arrangements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{"chordProText":"[G]Amazing [C]grace...","name":"Test"}'
# Expected: compressionMetrics shows 60%+ ratio
```

### Level 4: Performance & Advanced Validation

```bash
# MongoDB compression stats
mongosh --eval "db.arrangements.stats()"
# Expected: storageSize significantly less than dataSize

# Load test with autocannon
npx autocannon -c 10 -d 10 http://localhost:5000/api/v1/songs
# Expected: >100 requests/sec, <100ms latency

# Memory usage monitoring
node --inspect server/server.js
# Chrome DevTools → Memory profiler
# Expected: No memory leaks after 100 requests

# Bundle size check
cd server && npm run build
du -sh dist/
# Expected: <5MB for server bundle

# Database size monitoring
mongosh --eval "db.stats()"
# Expected: dataSize within MongoDB free tier limits

# Test data migration script
node server/scripts/migrateToCompression.js
# Expected: All arrangements compressed successfully

# Security audit
cd server && npm audit
# Expected: 0 vulnerabilities

# Test coverage
cd server && npm run test:coverage
# Expected: >80% coverage
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] Backend TypeScript compiles: `cd server && tsc --noEmit`
- [ ] Backend tests pass: `cd server && npm test`
- [ ] Frontend builds: `npm run build`
- [ ] API endpoints accessible from frontend
- [ ] MongoDB connection stable with retry logic
- [ ] ZSTD compression achieving 60%+ ratio

### Feature Validation

- [ ] Songs CRUD operations working
- [ ] Arrangements compress/decompress properly
- [ ] Setlists save with user association
- [ ] Clerk users sync to MongoDB
- [ ] Search functionality returns results
- [ ] Public/private filtering works
- [ ] Error messages are user-friendly

### Code Quality Validation

- [ ] TypeScript interfaces match between frontend/backend
- [ ] All schemas have proper validation
- [ ] Error handling covers edge cases
- [ ] No hardcoded values (all in env vars)
- [ ] Indexes created for query performance
- [ ] Connection pooling configured

### Security Validation

- [ ] Clerk tokens verified on protected routes
- [ ] MongoDB injection prevented (mongo-sanitize)
- [ ] CORS configured properly
- [ ] Rate limiting in place
- [ ] Sensitive data not logged
- [ ] Webhook signatures verified

### Documentation & Deployment

- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Migration scripts tested
- [ ] Deployment instructions clear
- [ ] Monitoring configured

---

## Anti-Patterns to Avoid

- ❌ Don't store uncompressed chord data - wastes 60-80% space
- ❌ Don't skip webhook signature verification - security risk
- ❌ Don't use synchronous compression - blocks event loop
- ❌ Don't forget indexes - queries will be slow
- ❌ Don't hardcode connection strings - use env vars
- ❌ Don't return Buffers to client - convert to strings
- ❌ Don't skip connection retry logic - MongoDB may be starting

## Risk Mitigation

- **If compression fails**: Store uncompressed with flag, log error
- **If MongoDB disconnects**: Retry logic with exponential backoff
- **If Clerk webhook fails**: Queue for retry, don't lose user data
- **If migration fails**: Rollback capability, backup first
- **If storage limit hit**: Monitor documentSize, alert at 80%

## Success Metrics

- Backend server stable for 24+ hours
- API response time <200ms for queries
- Compression ratio consistently >60%
- Zero data loss during user sync
- Frontend seamlessly uses real data
- Test coverage >80%
- No memory leaks detected

---

**Confidence Score: 9/10**

This PRP provides comprehensive context including:
- Complete schema definitions from DATABASE-SCHEMA.md
- Detailed Express/MongoDB patterns in ai_docs
- ZSTD compression implementation guide
- Clerk webhook integration patterns
- Existing codebase structure and types
- Step-by-step implementation tasks
- Multiple validation levels
- Error handling and edge cases

The implementation path is clear, patterns are well-documented, and validation gates ensure success.