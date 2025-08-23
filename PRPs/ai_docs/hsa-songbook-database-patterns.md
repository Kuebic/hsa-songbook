# HSA Songbook Database and Service Patterns Guide

This document outlines the established patterns in the HSA Songbook codebase that should be followed when implementing new features, particularly for RBAC implementation.

## 1. Database Migration Patterns

**Location**: `supabase/migrations/`

### Pattern Structure

```sql
-- Migration: [Feature Name]
-- Date: [YYYY-MM-DD]  
-- Description: [Detailed description of what this migration does]

-- Add new columns to existing tables
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name DATA_TYPE DEFAULT default_value,
ADD COLUMN IF NOT EXISTS another_column DATA_TYPE;

-- Create new tables
CREATE TABLE IF NOT EXISTS table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- other columns
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name USING btree (column_name);
CREATE INDEX IF NOT EXISTS idx_table_jsonb ON table_name USING GIN (jsonb_column);

-- Create PostgreSQL functions for business logic
CREATE OR REPLACE FUNCTION function_name(parameters)
RETURNS return_type AS $$
BEGIN
  -- Function logic
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add RLS policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Policy name" ON table_name
  FOR operation
  USING (condition);

-- Add helpful comments
COMMENT ON COLUMN table_name.column_name IS 'Description of column purpose';
COMMENT ON TABLE table_name IS 'Description of table purpose';
```

### Key Patterns to Follow
- Always use `IF NOT EXISTS` checks for safety
- Include descriptive headers with date and purpose
- Create appropriate indexes (GIN for JSONB, btree for regular columns)
- Add PostgreSQL functions for complex business logic
- Include detailed comments for documentation
- Enable RLS and create policies for security

## 2. Service Layer Patterns

**Location**: `src/features/*/services/`

### Service Structure Template

```typescript
import { supabase } from '../../../lib/supabase'
import type { EntityType, EntityFilter } from '../types/entity.types'
import type { Database } from '../../../lib/database.types'

// Custom error classes
export class APIError extends Error {
  statusCode?: number
  code?: string
  
  constructor(message: string, statusCode?: number, code?: string) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.code = code
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

// Cache implementation
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const requestCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds

function getCachedResult<T>(key: string): T | null {
  const cached = requestCache.get(key) as CacheEntry<T> | undefined
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  requestCache.delete(key)
  return null
}

function setCachedResult<T>(key: string, data: T): void {
  requestCache.set(key, { data, timestamp: Date.now() })
}

function clearCache(): void {
  requestCache.clear()
}

// Type mapping functions
function mapDatabaseToApp(dbEntity: Database['public']['Tables']['table_name']['Row']): EntityType {
  return {
    // Map database fields to application types
  }
}

// Service object
export const entityService = {
  async getAll(filter?: EntityFilter): Promise<EntityType[]> {
    try {
      // Check cache first
      const cacheKey = `getAll:${JSON.stringify(filter || {})}`
      const cachedResult = getCachedResult<EntityType[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      // Build query
      let query = supabase
        .from('table_name')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filter?.someField) {
        query = query.eq('some_field', filter.someField)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const result = (data || []).map(mapDatabaseToApp)
      setCachedResult(cacheKey, result)
      
      return result
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch data')
    }
  },

  async create(entityData: Partial<EntityType>): Promise<EntityType> {
    try {
      clearCache() // Clear cache after mutation

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
      }

      // Prepare insert data
      const insertData = {
        // Map application types to database types
        created_by: user.id,
      }

      const { data, error } = await supabase
        .from('table_name')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('Create error:', error)
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      return mapDatabaseToApp(data)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to create entity')
    }
  },

  async update(id: string, updates: Partial<EntityType>): Promise<EntityType> {
    try {
      clearCache()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
      }

      const { data, error } = await supabase
        .from('table_name')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      return mapDatabaseToApp(data)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to update entity')
    }
  },

  async delete(id: string): Promise<void> {
    try {
      clearCache()

      const { error } = await supabase
        .from('table_name')
        .delete()
        .eq('id', id)

      if (error) {
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to delete entity')
    }
  }
}
```

### Key Service Patterns
- Consistent error handling with custom error classes
- Caching layer for performance (30-second TTL)
- Authentication checks using `supabase.auth.getUser()`
- Type mapping between database and application types
- Clear cache after mutations
- Comprehensive error logging

## 3. React Hook Patterns

**Location**: `src/features/*/hooks/`

### Hook Template with Optimistic Updates

```typescript
import { useState, useCallback, useOptimistic, useTransition } from 'react'
import { useAuth } from '@features/auth'
import { entityService } from '../services/entityService'
import type { EntityType, EntityFormData } from '../types/entity.types'

interface UseEntityMutationsProps {
  initialEntities?: EntityType[]
  onSuccess?: (entity: EntityType) => void
  onError?: (error: Error) => void
}

interface UseEntityMutationsReturn {
  createEntity: (data: EntityFormData) => Promise<EntityType>
  updateEntity: (id: string, data: Partial<EntityFormData>) => Promise<EntityType>
  deleteEntity: (id: string) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: Error | null
  clearError: () => void
  optimisticEntities: EntityType[]
  isAuthenticated: boolean
}

type OptimisticUpdatePayload = 
  | { type: 'create'; payload: EntityType }
  | { type: 'update'; payload: { id: string; data: Partial<EntityType> } }
  | { type: 'delete'; payload: string }
  | { type: 'replace'; payload: { tempId: string; realEntity: EntityType } }
  | { type: 'remove'; payload: string }

export function useEntityMutations(
  props: UseEntityMutationsProps = {}
): UseEntityMutationsReturn {
  const { initialEntities = [], onSuccess, onError } = props
  const { getToken, userId, isSignedIn, user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [_isPending, startTransition] = useTransition()

  // Optimistic updates
  const [optimisticEntities, addOptimisticUpdate] = useOptimistic(
    initialEntities,
    (state: EntityType[], update: OptimisticUpdatePayload) => {
      switch (update.type) {
        case 'create':
          return [...state, update.payload]
        case 'update':
          return state.map(entity =>
            entity.id === update.payload.id
              ? { ...entity, ...update.payload.data }
              : entity
          )
        case 'delete':
          return state.filter(entity => entity.id !== update.payload)
        case 'replace':
          return state.map(entity =>
            entity.id === update.payload.tempId
              ? update.payload.realEntity
              : entity
          )
        case 'remove':
          return state.filter(entity => entity.id !== update.payload)
        default:
          return state
      }
    }
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createEntity = useCallback(async (formData: EntityFormData): Promise<EntityType> => {
    if (!isSignedIn || !userId || !user) {
      throw new Error('Authentication required')
    }

    setIsCreating(true)
    setError(null)

    // Create optimistic entity
    const optimisticEntity: EntityType = {
      id: `temp-${Date.now()}`,
      ...formData,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    }

    // Add optimistic update immediately
    startTransition(() => {
      addOptimisticUpdate({ type: 'create', payload: optimisticEntity })
    })

    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Unable to get authentication token')
      }

      // Make API call
      const newEntity = await entityService.create(formData)

      // Replace optimistic entity with real one
      startTransition(() => {
        addOptimisticUpdate({
          type: 'replace',
          payload: { tempId: optimisticEntity.id, realEntity: newEntity }
        })
      })

      onSuccess?.(newEntity)
      return newEntity
    } catch (err) {
      // Remove optimistic entity on error
      startTransition(() => {
        addOptimisticUpdate({ type: 'remove', payload: optimisticEntity.id })
      })

      const error = err instanceof Error ? err : new Error('Failed to create')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [user, userId, isSignedIn, getToken, addOptimisticUpdate, onSuccess, onError])

  return {
    createEntity,
    updateEntity,
    deleteEntity,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    clearError,
    optimisticEntities,
    isAuthenticated: isSignedIn ?? false
  }
}
```

### Key Hook Patterns
- Use `useAuth()` for authentication state and token retrieval
- Implement optimistic updates with `useOptimistic`
- Use `useTransition` for non-blocking updates
- Comprehensive authentication checks before operations
- Error handling with rollback on failures
- Loading states for UI feedback
- Return clear interfaces with all necessary state

## 4. Component Permission Patterns

### Protected Route Pattern

```typescript
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { LoadingSpinner } from '@shared/components'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireModerator?: boolean
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireModerator = false 
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isLoaded, isSignedIn, isAdmin, isModerator } = useAuth()

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>This page requires administrator privileges.</p>
      </div>
    )
  }

  if (requireModerator && !isModerator && !isAdmin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>This page requires moderator privileges.</p>
      </div>
    )
  }

  return <>{children}</>
}
```

### Component-Level Permission Checks

```typescript
export function EntityCard({ entity }: { entity: EntityType }) {
  const { isSignedIn, isAdmin, isModerator, userId } = useAuth()
  
  // Determine if user can edit
  const canEdit = isSignedIn && (
    entity.createdBy === userId || 
    isAdmin || 
    (isModerator && entity.isPublic)
  )
  
  // Determine if user can delete
  const canDelete = isSignedIn && (
    entity.createdBy === userId || 
    isAdmin
  )

  return (
    <div className="entity-card">
      <h3>{entity.title}</h3>
      
      {/* Conditional rendering based on permissions */}
      {canEdit && (
        <button onClick={handleEdit}>
          Edit
        </button>
      )}
      
      {canDelete && (
        <button onClick={handleDelete}>
          Delete
        </button>
      )}
    </div>
  )
}
```

## 5. Testing Patterns

### Service Testing Template

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { entityService } from '../entityService'

// Mock Supabase client
const createMockQuery = () => {
  const mockQuery: Record<string, any> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis()
  }
  return mockQuery
}

const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn()
}

// Replace actual supabase import
vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase
}))

describe('entityService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn() // Suppress error logs during tests
    
    // Default auth mock
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAll', () => {
    it('should fetch all entities successfully', async () => {
      const mockData = [
        { id: '1', title: 'Entity 1' },
        { id: '2', title: 'Entity 2' }
      ]
      
      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({ data: mockData, error: null })
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await entityService.getAll()

      expect(mockSupabase.from).toHaveBeenCalledWith('table_name')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(result).toEqual(mockData)
    })

    it('should handle errors properly', async () => {
      const mockError = { message: 'Database error', code: 'DB001' }
      
      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({ data: null, error: mockError })
      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(entityService.getAll()).rejects.toThrow('Database error')
    })
  })

  describe('create', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(entityService.create({ title: 'New' }))
        .rejects.toThrow('Authentication required')
    })

    it('should create entity successfully', async () => {
      const newEntity = { title: 'New Entity' }
      const createdEntity = { id: '123', ...newEntity, created_by: 'user-123' }
      
      const mockQuery = createMockQuery()
      mockQuery.single.mockResolvedValue({ data: createdEntity, error: null })
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await entityService.create(newEntity)

      expect(mockQuery.insert).toHaveBeenCalled()
      expect(result).toEqual(createdEntity)
    })
  })
})
```

### Hook Testing Template

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEntityMutations } from '../useEntityMutations'

// Mock auth hook
vi.mock('@features/auth', () => ({
  useAuth: () => ({
    isSignedIn: true,
    userId: 'user-123',
    user: { id: 'user-123', email: 'test@example.com' },
    getToken: vi.fn().mockResolvedValue('mock-token')
  })
}))

// Mock service
vi.mock('../../services/entityService', () => ({
  entityService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

describe('useEntityMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle create with optimistic updates', async () => {
    const { entityService } = await import('../../services/entityService')
    const createdEntity = { id: 'real-123', title: 'Test' }
    entityService.create.mockResolvedValue(createdEntity)

    const { result } = renderHook(() => useEntityMutations())

    await act(async () => {
      await result.current.createEntity({ title: 'Test' })
    })

    await waitFor(() => {
      expect(result.current.optimisticEntities).toContainEqual(createdEntity)
    })
  })
})
```

### Key Testing Patterns
- Mock Supabase client with chainable methods
- Test authentication requirements
- Test both success and error scenarios
- Suppress console logs during tests
- Use proper async handling with waitFor
- Test optimistic updates in hooks
- Clear mocks between tests

## Summary

These patterns represent the established conventions in the HSA Songbook codebase. When implementing new features:

1. **Database**: Follow migration patterns with proper indexes, RLS policies, and documentation
2. **Services**: Implement error handling, caching, and authentication checks consistently
3. **Hooks**: Use optimistic updates and proper state management patterns
4. **Components**: Implement permission checks at the component level
5. **Testing**: Maintain comprehensive test coverage following established patterns

By following these patterns, new features will integrate seamlessly with the existing codebase while maintaining consistency and quality.