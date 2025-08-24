# Song CRUD API Integration & Testing PRP

## Executive Summary
Ensure complete integration between the Song CRUD feature implementation and backend API endpoints with comprehensive test coverage. This PRP addresses gaps identified in the current implementation, strengthens API integration, and ensures all tests pass with proper structure following vertical slice architecture.

**Confidence Score: 9.5/10** - Very high confidence due to comprehensive research, existing infrastructure, and clear implementation path.

## Context and Research Findings

### Current State Analysis

#### ✅ **What's Working Well**
- **Backend API**: Complete CRUD endpoints with validation, auth, and error handling
- **Frontend Service**: Robust API integration with caching, retry logic, and deduplication
- **Form Implementation**: SongForm, SongFormModal with Zod validation already created
- **Test Infrastructure**: 357 test files with sophisticated patterns and utilities
- **Vertical Slice Architecture**: Clear separation within `/features/songs/`

#### ⚠️ **Identified Gaps**
1. **Missing UI Integration**: Delete and rating functionality not exposed in UI
2. **Test Coverage Gaps**: 
   - No controller endpoint tests
   - Missing authentication flow tests
   - No integration tests for form-to-API flow
3. **API Integration Issues**:
   - Delete method uses raw `fetch` instead of `fetchAPI` helper
   - Missing optimistic updates for better UX
   - No offline queue for PWA functionality
4. **Security Concerns**:
   - Backend auth middleware too permissive (accepts any header)
   - Missing rate limiting
   - Test user bypass could be exploited

### Vertical Slice Architecture Documentation

The songs feature follows a **complete vertical slice** pattern:

```
src/features/songs/               # Frontend Slice
├── components/                   # UI Layer
│   ├── SongCard.tsx             # Display component
│   ├── SongForm.tsx             # Form logic component  
│   ├── SongFormFields.tsx       # Field components
│   ├── SongFormModal.tsx        # Modal wrapper
│   ├── SongList.tsx             # List display
│   ├── SongViewer.tsx           # Detail viewer
│   └── __tests__/               # Component tests
├── hooks/                        # Business Logic Layer
│   ├── useSongs.ts              # Data fetching
│   ├── useSongMutations.ts      # CRUD operations
│   └── __tests__/               # Hook tests
├── services/                     # API Integration Layer
│   └── songService.ts           # API client
├── types/                        # Type Definitions
│   ├── song.types.ts            # Domain types
│   └── songForm.types.ts        # Form types
├── utils/                        # Utilities
│   └── songValidation.ts        # Validation schemas
├── pages/                        # Route Components
│   ├── SongListPage.tsx         # List route
│   └── SongDetailPage.tsx       # Detail route
└── index.ts                      # Public exports

server/features/songs/             # Backend Slice
├── song.controller.ts            # API endpoints
├── song.service.ts               # Business logic
├── song.model.ts                 # MongoDB schema
├── song.routes.ts                # Route definitions
├── song.validation.ts            # Request validation
├── song.types.ts                 # TypeScript types
└── __tests__/                    # Backend tests
    └── song.test.ts              # Service tests
```

### Key Research Findings

#### Authentication Flow
- Frontend uses Clerk's `getToken()` for JWT tokens
- Backend expects `Authorization: Bearer [token]` and `x-user-id` headers
- Development mode allows `test-user-id` and `test-token`
- Production mode needs proper JWT validation implementation

#### Error Handling Patterns
- **Frontend**: Custom error classes (APIError, NetworkError, NotFoundError)
- **Backend**: AppError hierarchy with specific HTTP status codes
- **Validation**: Zod schemas on both client and server
- **User Feedback**: Field-level error display with form-wide error states

#### Testing Patterns
- **Tiered Timeouts**: 2s unit, 5s service, 10s database, 15s integration
- **Custom Matchers**: MongoDB validation, compression testing
- **Factory Functions**: Test data generation utilities
- **Mock Strategy**: Clerk auth, service workers, browser APIs

## Implementation Blueprint

### Phase 1: Fix Critical Issues (Priority 1)

#### 1.1 Fix Delete Method in songService.ts
```typescript
// src/features/songs/services/songService.ts
async deleteSong(id: string, token?: string) {
  const options: RequestInit = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }
  
  // Use fetchAPI helper instead of raw fetch
  return this.fetchAPI(`${this.baseURL}/${id}`, options)
}
```

#### 1.2 Strengthen Backend Authentication
```typescript
// server/shared/middleware/auth.ts
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const userId = req.headers['x-user-id'] as string
  
  if (!token || !userId) {
    throw new UnauthorizedError('Authentication required')
  }
  
  // In production, validate JWT token properly
  if (process.env.NODE_ENV === 'production') {
    try {
      // TODO: Implement proper JWT validation with Clerk SDK
      const decoded = await verifyClerkToken(token)
      if (decoded.sub !== userId) {
        throw new UnauthorizedError('Token user mismatch')
      }
    } catch (error) {
      throw new UnauthorizedError('Invalid token')
    }
  }
  
  req.user = { id: userId }
  next()
}
```

### Phase 2: Complete API Integration Tests

#### 2.1 Create Backend Controller Tests
```typescript
// server/features/songs/__tests__/song.controller.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../app'
import { connectDatabase, clearDatabase } from '../../../shared/test-utils/database-handler'

describe('Song API Endpoints', () => {
  beforeAll(async () => {
    await connectDatabase()
  })
  
  afterAll(async () => {
    await clearDatabase()
  })
  
  describe('POST /api/v1/songs', () => {
    it('creates song with valid data', async () => {
      const songData = {
        title: 'Amazing Grace',
        artist: 'John Newton',
        themes: ['grace', 'salvation']
      }
      
      const response = await request(app)
        .post('/api/v1/songs')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test-user-id')
        .send(songData)
      
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
        title: songData.title,
        artist: songData.artist,
        slug: 'amazing-grace'
      })
    })
    
    it('returns 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/songs')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test-user-id')
        .send({ title: '' }) // Invalid: empty title
      
      expect(response.status).toBe(400)
      expect(response.body.error.errors).toContain('Title is required')
    })
    
    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/songs')
        .send({ title: 'Test Song' })
      
      expect(response.status).toBe(401)
    })
  })
  
  describe('PATCH /api/v1/songs/:id', () => {
    it('updates existing song', async () => {
      // Create song first
      const createResponse = await request(app)
        .post('/api/v1/songs')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test-user-id')
        .send({ title: 'Original Title' })
      
      const songId = createResponse.body.data._id
      
      // Update song
      const updateResponse = await request(app)
        .patch(`/api/v1/songs/${songId}`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test-user-id')
        .send({ title: 'Updated Title' })
      
      expect(updateResponse.status).toBe(200)
      expect(updateResponse.body.data.title).toBe('Updated Title')
    })
  })
})
```

#### 2.2 Create Frontend Integration Tests
```typescript
// src/features/songs/components/__tests__/SongFormIntegration.test.tsx
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { SongFormModal } from '../SongFormModal'

const server = setupServer(
  http.post('/api/v1/songs', async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({
      success: true,
      data: {
        _id: 'test-id',
        ...data,
        slug: data.title.toLowerCase().replace(/\s+/g, '-')
      }
    })
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('Song Form API Integration', () => {
  it('successfully creates song via API', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = vi.fn()
    
    render(
      <SongFormModal 
        isOpen={true} 
        onClose={vi.fn()} 
        onSuccess={mockOnSuccess}
      />
    )
    
    // Fill form
    await user.type(screen.getByLabelText('Title *'), 'Test Song')
    await user.type(screen.getByLabelText('Artist'), 'Test Artist')
    
    // Submit
    await user.click(screen.getByRole('button', { name: /create song/i }))
    
    // Verify success
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })
  
  it('handles API validation errors', async () => {
    server.use(
      http.post('/api/v1/songs', () => {
        return HttpResponse.json({
          success: false,
          error: {
            status: 'fail',
            message: 'Validation failed',
            errors: ['Title already exists']
          }
        }, { status: 400 })
      })
    )
    
    const user = userEvent.setup()
    render(<SongFormModal isOpen={true} onClose={vi.fn()} />)
    
    await user.type(screen.getByLabelText('Title *'), 'Duplicate')
    await user.click(screen.getByRole('button', { name: /create song/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/Title already exists/)).toBeInTheDocument()
    })
  })
})
```

### Phase 3: Add Missing UI Features

#### 3.1 Add Delete Button to SongCard
```typescript
// src/features/songs/components/SongCard.tsx
import { useState } from 'react'
import { useSongMutations } from '../hooks/useSongMutations'

export function SongCard({ song, onDelete }: SongCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { deleteSong } = useSongMutations()
  const { isSignedIn, userId } = useAuth()
  
  const canDelete = isSignedIn && (
    userId === song.metadata.createdBy || 
    userRole === 'ADMIN'
  )
  
  const handleDelete = async () => {
    try {
      await deleteSong(song._id)
      onDelete?.(song._id)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }
  
  return (
    <div className={styles.card}>
      {/* Existing card content */}
      
      {canDelete && (
        <>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={styles.deleteButton}
            aria-label="Delete song"
          >
            🗑️
          </button>
          
          {showDeleteConfirm && (
            <div className={styles.confirmDialog}>
              <p>Delete "{song.title}"?</p>
              <button onClick={handleDelete}>Yes</button>
              <button onClick={() => setShowDeleteConfirm(false)}>No</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

#### 3.2 Add Rating Component
```typescript
// src/features/songs/components/SongRating.tsx
import { useState } from 'react'
import { useSongMutations } from '../hooks/useSongMutations'

export function SongRating({ song }: { song: Song }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const { rateSong } = useSongMutations()
  const { isSignedIn } = useAuth()
  
  const handleRate = async (value: number) => {
    if (!isSignedIn) return
    
    try {
      await rateSong(song._id, value)
      setRating(value)
    } catch (error) {
      console.error('Rating failed:', error)
    }
  }
  
  return (
    <div className={styles.rating}>
      <span>Rate: </span>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          className={styles.star}
          disabled={!isSignedIn}
          aria-label={`Rate ${star} stars`}
        >
          {star <= (hoveredRating || rating || song.metadata.ratings?.average || 0) 
            ? '⭐' : '☆'}
        </button>
      ))}
      <span className={styles.average}>
        ({song.metadata.ratings?.average?.toFixed(1) || 'N/A'})
      </span>
    </div>
  )
}
```

### Phase 4: Performance & PWA Enhancements

#### 4.1 Add Optimistic Updates
```typescript
// src/features/songs/hooks/useSongMutations.ts
import { useOptimistic } from 'react'

export function useSongMutations() {
  const { songs, setSongs } = useSongs()
  const [optimisticSongs, addOptimisticSong] = useOptimistic(
    songs,
    (state, newSong) => [...state, newSong]
  )
  
  const createSong = async (data: SongFormData) => {
    const optimisticSong = {
      ...data,
      _id: `temp-${Date.now()}`,
      slug: data.title.toLowerCase().replace(/\s+/g, '-'),
      metadata: { isPublic: false, views: 0 }
    }
    
    addOptimisticSong(optimisticSong)
    
    try {
      const token = await getToken()
      const newSong = await songService.createSong(data, token)
      setSongs(prev => prev.map(s => 
        s._id === optimisticSong._id ? newSong : s
      ))
      return newSong
    } catch (error) {
      // Rollback optimistic update
      setSongs(prev => prev.filter(s => s._id !== optimisticSong._id))
      throw error
    }
  }
  
  return { createSong, updateSong, deleteSong, rateSong }
}
```

#### 4.2 Add Offline Queue for PWA
```typescript
// src/features/songs/utils/offlineQueue.ts
interface QueuedAction {
  id: string
  type: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

class OfflineQueue {
  private queue: QueuedAction[] = []
  
  constructor() {
    this.loadQueue()
    window.addEventListener('online', () => this.processQueue())
  }
  
  private loadQueue() {
    const saved = localStorage.getItem('songOfflineQueue')
    if (saved) {
      this.queue = JSON.parse(saved)
    }
  }
  
  private saveQueue() {
    localStorage.setItem('songOfflineQueue', JSON.stringify(this.queue))
  }
  
  add(action: QueuedAction) {
    this.queue.push(action)
    this.saveQueue()
    
    if (navigator.onLine) {
      this.processQueue()
    }
  }
  
  async processQueue() {
    while (this.queue.length > 0) {
      const action = this.queue[0]
      
      try {
        switch (action.type) {
          case 'create':
            await songService.createSong(action.data)
            break
          case 'update':
            await songService.updateSong(action.id, action.data)
            break
          case 'delete':
            await songService.deleteSong(action.id)
            break
        }
        
        this.queue.shift()
        this.saveQueue()
      } catch (error) {
        console.error('Failed to process queued action:', error)
        break // Stop processing on error
      }
    }
  }
}

export const offlineQueue = new OfflineQueue()
```

## Validation Gates

### Level 1: TypeScript & Linting
```bash
# Frontend
npm run lint
npm run type-check

# Backend
cd server && npm run lint && npm run type-check
```

### Level 2: Unit Tests
```bash
# Frontend component tests
npm run test -- src/features/songs/components/__tests__/

# Frontend hook tests  
npm run test -- src/features/songs/hooks/__tests__/

# Backend service tests
cd server && npm run test -- features/songs/__tests__/
```

### Level 3: Integration Tests
```bash
# Full API integration tests
npm run test -- --run

# Backend integration tests
cd server && npm run test -- __tests__/integration/
```

### Level 4: Build Verification
```bash
# Frontend build
npm run build

# Backend build
cd server && npm run build

# Preview production build
npm run preview
```

### Level 5: E2E Testing (Manual)
- [ ] Create new song via plus button
- [ ] Edit existing song
- [ ] Delete song with confirmation
- [ ] Rate song (1-5 stars)
- [ ] Search and filter songs
- [ ] Verify offline functionality
- [ ] Check mobile responsiveness
- [ ] Test authentication flows
- [ ] Verify error handling

### Level 6: Performance Validation
```bash
# Check bundle size
npm run build -- --report

# Run performance tests
npm run test -- --run performance

# Check test coverage
npm run test:coverage
```

## File Modification Order

1. **Fix Critical Issues**
   - `src/features/songs/services/songService.ts` - Fix delete method
   - `server/shared/middleware/auth.ts` - Strengthen authentication

2. **Add Tests**
   - `server/features/songs/__tests__/song.controller.test.ts` - Controller tests
   - `src/features/songs/components/__tests__/SongFormIntegration.test.tsx` - Integration tests

3. **Add UI Features**
   - `src/features/songs/components/SongCard.tsx` - Add delete button
   - `src/features/songs/components/SongRating.tsx` - Create rating component
   - `src/features/songs/hooks/useSongMutations.ts` - Update delete/rate methods

4. **Performance Enhancements**
   - `src/features/songs/utils/offlineQueue.ts` - Create offline queue
   - Update `useSongMutations.ts` - Add optimistic updates

5. **Update Exports**
   - `src/features/songs/index.ts` - Export new components

## Success Metrics

- ✅ Zero TypeScript errors in both frontend and backend
- ✅ All existing tests pass
- ✅ New integration tests pass (>20 new tests)
- ✅ 90%+ code coverage for songs feature
- ✅ Successful production build
- ✅ Delete and rating features functional
- ✅ Offline queue working for PWA
- ✅ API response time <200ms
- ✅ No console errors or warnings

## Common Pitfalls to Avoid

1. **Don't forget to update exports** in index.ts files
2. **Test auth headers** in all API calls
3. **Handle network failures** gracefully
4. **Validate user permissions** before showing UI elements
5. **Clear cache** after mutations
6. **Test offline scenarios** thoroughly
7. **Prevent duplicate API calls** during form submission
8. **Add proper ARIA labels** for accessibility

## External Resources

### Documentation
- [React 19 Forms](https://react.dev/reference/react-dom/components/form)
- [Vitest Testing](https://vitest.dev/guide/)
- [MSW API Mocking](https://mswjs.io/docs/)
- [MongoDB Testing](https://github.com/nodkz/mongodb-memory-server)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Related PRPs
- `/PRPs/completed/song-crud-feature.md` - Original feature implementation
- `/PRPs/completed/mongodb-mongoose-extensive-testing.md` - Testing patterns
- `/PRPs/completed/pwa-offline-capable.md` - PWA implementation

## Implementation Time Estimate

- **Phase 1 (Critical Fixes)**: 2 hours
- **Phase 2 (Tests)**: 3 hours  
- **Phase 3 (UI Features)**: 2 hours
- **Phase 4 (Performance)**: 2 hours
- **Total**: 9 hours

## Risk Assessment

- **Low Risk**: Using established patterns and existing infrastructure
- **Medium Risk**: Authentication changes could affect other features
- **Mitigation**: Comprehensive testing at each phase

## Conclusion

This PRP provides a complete roadmap for ensuring the Song CRUD API integration works flawlessly with comprehensive test coverage. By following the vertical slice architecture and leveraging the existing sophisticated testing infrastructure, we can deliver a robust, well-tested feature that handles all edge cases including offline functionality, authentication, and error scenarios.

**Confidence Score: 9.5/10** - The extensive research, clear implementation path, and comprehensive validation gates ensure high probability of one-pass implementation success.