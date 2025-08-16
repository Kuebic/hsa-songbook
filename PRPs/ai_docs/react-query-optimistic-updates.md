# React Query Optimistic Updates - Best Practices Guide

## Overview

This document outlines the best practices for optimistic updates in the HSA Songbook codebase, based on analysis of existing patterns and React Query v5 features. The codebase demonstrates several sophisticated approaches to optimistic updates, from simple mutations to complex offline queue systems.

## Key Patterns Found in the Codebase

### 1. Standard React Query Optimistic Updates (Setlists)

The setlist feature uses classic React Query optimistic update patterns with proper rollback handling:

**Pattern Location**: `/src/features/setlists/hooks/mutations/`

**Key Files**:
- `useAddToSetlist.ts` - Adds arrangements to setlists with optimistic updates
- `useUpdateSetlist.ts` - Updates setlist metadata optimistically  
- `useReorderArrangements.ts` - Reorders arrangements with immediate UI feedback
- `useCreateSetlist.ts` - Creates new setlists with temporary IDs

**Query Key Factory Pattern**:
```typescript
// From useSetlistsQuery.ts
export const setlistKeys = {
  all: ['setlists'] as const,
  lists: () => [...setlistKeys.all, 'list'] as const,
  list: (filters: string) => [...setlistKeys.lists(), { filters }] as const,
  details: () => [...setlistKeys.all, 'detail'] as const,
  detail: (id: string) => [...setlistKeys.details(), id] as const,
  public: (shareId: string) => [...setlistKeys.all, 'public', shareId] as const,
}
```

### 2. React 19 useOptimistic Hook Pattern (Songs)

The songs feature uses React 19's `useOptimistic` hook for more granular control:

**Pattern Location**: `/src/features/songs/hooks/mutations/useSongMutations.ts`

**Key Features**:
- Uses React 19's `useOptimistic` hook
- Integrates with offline queue system
- Provides granular optimistic actions (create, update, delete, rate)
- Supports complex rollback scenarios

```typescript
const [optimisticSongs, addOptimisticUpdate] = useOptimistic(
  initialSongs,
  (state: Song[], update: OptimisticUpdatePayload) => {
    switch (update.type) {
      case 'create':
        return [...state, update.payload]
      case 'update':
        return state.map(song =>
          song.id === update.payload.id
            ? updateOptimisticSong(song, update.payload.data)
            : song
        )
      // ... other cases
    }
  }
)
```

### 3. Offline Queue Integration

**Pattern Location**: `/src/features/songs/hooks/utils/offlineQueue.ts`

The codebase includes a sophisticated offline queue system that:
- Stores failed mutations in localStorage
- Automatically retries when connection returns
- Integrates with optimistic updates
- Provides retry logic with exponential backoff

## React Query Configuration

**Configuration Location**: `/src/app/main.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors except 408, 429
        const errorStatus = (error as { status?: number })?.status
        if (errorStatus && errorStatus >= 400 && errorStatus < 500 && errorStatus !== 408 && errorStatus !== 429) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        // Only retry on network errors or 5xx errors
        const errorStatus = (error as { status?: number })?.status
        if (errorStatus && errorStatus >= 400 && errorStatus < 500) {
          return false
        }
        return failureCount < 2
      },
    },
  },
})
```

## Best Practices from the Codebase

### 1. Mutation Lifecycle Pattern

All mutations in the codebase follow this consistent pattern:

```typescript
export function useMutation() {
  return useMutation({
    mutationFn: async (data) => {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      return service.method(data, token)
    },
    
    onMutate: async (data) => {
      // 1. Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: relevantKeys })
      
      // 2. Snapshot current state for rollback
      const previousData = queryClient.getQueryData(key)
      
      // 3. Apply optimistic update
      queryClient.setQueryData(key, optimisticData)
      
      // 4. Update related caches
      queryClient.setQueriesData({ queryKey: listKeys }, updateFunction)
      
      // 5. Return context for rollback
      return { previousData }
    },
    
    onError: (err, data, context) => {
      // 1. Rollback all optimistic updates
      if (context?.previousData) {
        queryClient.setQueryData(key, context.previousData)
        queryClient.setQueriesData({ queryKey: listKeys }, rollbackFunction)
      }
      
      // 2. Show user-friendly error notification
      addNotification({
        type: 'error',
        title: 'Action failed',
        message: err.message
      })
    },
    
    onSuccess: (data) => {
      // 1. Update cache with real server data
      queryClient.setQueryData(key, data)
      
      // 2. Update related caches
      queryClient.setQueriesData({ queryKey: listKeys }, updateFunction)
      
      // 3. Show success notification (optional)
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Action completed successfully'
      })
    }
  })
}
```

### 2. Cache Invalidation Strategy

The codebase uses smart invalidation patterns:

```typescript
// Exact invalidation for specific resources
queryClient.invalidateQueries({ 
  queryKey: setlistKeys.detail(setlistId),
  exact: true 
})

// Pattern-based invalidation for lists
queryClient.invalidateQueries({ 
  queryKey: setlistKeys.lists() 
})

// Conditional invalidation with predicates
queryClient.invalidateQueries({
  predicate: (query) => {
    const data = query.state.data as any
    return data?.some((item: any) => item.id === affectedId)
  }
})
```

### 3. Multi-Cache Updates

When updating a resource, the codebase consistently updates all related caches:

```typescript
// Update detail cache
queryClient.setQueryData(setlistKeys.detail(id), updatedData)

// Update list caches
queryClient.setQueriesData(
  { queryKey: setlistKeys.lists() },
  (old: Page<Setlist> | undefined) => {
    if (!old?.content) return old
    
    return {
      ...old,
      content: old.content.map((item: Setlist) =>
        item.id === id ? updatedData : item
      )
    }
  }
)
```

### 4. Temporary ID Strategy

For optimistic creates, the codebase uses sophisticated temporary ID generation:

```typescript
// From optimisticUpdates.ts
export function createOptimisticSong(formData: SongFormData, userId: string): Song {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const slug = `temp-${formData.title.toLowerCase().replace(/\s+/g, '-')}`
  
  return {
    id: tempId,
    // ... other properties
  }
}

export function isOptimisticSong(song: Song): boolean {
  return song.id.startsWith('temp-')
}
```

## Error Handling and Rollback Strategies

### 1. Context-Based Rollback

All mutations store previous state in context for proper rollback:

```typescript
onMutate: async (data) => {
  const previousSetlist = queryClient.getQueryData<Setlist>(key)
  // ... optimistic updates
  return { 
    previousSetlist,
    optimisticData,
    affectedKeys: [key1, key2]
  }
},

onError: (err, data, context) => {
  // Rollback all affected caches
  if (context?.previousSetlist) {
    queryClient.setQueryData(key, context.previousSetlist)
    // Rollback related caches too
  }
}
```

### 2. Network-Aware Error Handling

The songs feature includes offline detection:

```typescript
if (!navigator.onLine) {
  // Queue for offline processing
  offlineQueue.add({
    type: 'update',
    data: { id, formData: updates, token }
  })
  
  // Return optimistically updated data
  return optimisticData
}
```

### 3. User-Friendly Error Messages

All mutations integrate with the notification system:

```typescript
addNotification({
  type: 'error',
  title: 'Failed to update setlist',
  message: err.message
})
```

## Notification Integration

**Pattern Location**: `/src/shared/components/notifications/`

The codebase uses a centralized notification system that integrates seamlessly with mutations:

```typescript
const { addNotification } = useNotification()

// In mutation callbacks
onError: (err) => {
  addNotification({
    type: 'error',
    title: 'Action failed',
    message: err.message
  })
},

onSuccess: (data) => {
  addNotification({
    type: 'success',
    title: 'Success',
    message: 'Action completed successfully',
    duration: 2000 // Shorter for common actions
  })
}
```

## Testing Patterns

The codebase includes comprehensive testing for optimistic updates:

**Test Locations**:
- `/src/features/setlists/hooks/__tests__/useSetlists.test.ts`
- `/src/features/songs/hooks/__tests__/useSongMutations.test.ts`

## Performance Considerations

### 1. Selective Updates

The codebase avoids updating unnecessary caches:

```typescript
// Only update caches that actually contain the affected data
queryClient.setQueriesData(
  { queryKey: setlistKeys.lists() },
  (old: Page<Setlist> | undefined) => {
    if (!old?.content) return old // Don't update empty caches
    
    // Only update if the item exists in this cache
    const hasItem = old.content.some(item => item.id === targetId)
    if (!hasItem) return old
    
    return updateFunction(old)
  }
)
```

### 2. Stale Time Configuration

Different data types have appropriate stale times:

```typescript
// Quick-changing data
staleTime: 2 * 60 * 1000  // 2 minutes for setlists

// Stable data  
staleTime: 5 * 60 * 1000  // 5 minutes for individual setlist

// Public data (rarely changes)
staleTime: 10 * 60 * 1000 // 10 minutes for public setlists
```

## Common Pitfalls Avoided

1. **Race Conditions**: Always cancel queries before optimistic updates
2. **Memory Leaks**: Proper cleanup in error and success handlers
3. **Inconsistent State**: Update all related caches consistently
4. **Poor UX**: Always show loading states and error messages
5. **Lost Updates**: Offline queue prevents data loss

## Advanced Patterns

### 1. Optimistic Reordering

The `useReorderArrangements` hook demonstrates smooth drag-and-drop optimistic updates:

```typescript
onMutate: async ({ arrangements }) => {
  // Immediately apply new order
  const optimisticSetlist = {
    ...previousSetlist,
    arrangements: arrangements.map((arr, index) => ({
      ...arr,
      order: index
    })),
    updatedAt: new Date()
  }
  
  queryClient.setQueryData(key, optimisticSetlist)
}
```

### 2. Offline-First Architecture

The songs feature implements true offline-first patterns:

```typescript
// Always apply optimistic update
startTransition(() => {
  addOptimisticUpdate({ type: 'create', payload: optimisticSong })
})

// Queue for sync when online
if (!navigator.onLine) {
  offlineQueue.add({ type: 'create', data: { formData, token } })
  return optimisticSong
}
```

## Links to React Query v5 Documentation

- [Optimistic Updates](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates)
- [Mutations](https://tanstack.com/query/v5/docs/react/guides/mutations)
- [Query Invalidation](https://tanstack.com/query/v5/docs/react/guides/query-invalidation)
- [Query Keys](https://tanstack.com/query/v5/docs/react/guides/query-keys)
- [Parallel Queries](https://tanstack.com/query/v5/docs/react/guides/parallel-queries)
- [Dependent Queries](https://tanstack.com/query/v5/docs/react/guides/dependent-queries)

## Recommended Implementation Approach

1. **Start Simple**: Use basic React Query optimistic updates for straightforward cases
2. **Add Complexity Gradually**: Introduce offline support and complex rollback as needed
3. **Test Thoroughly**: Include tests for error scenarios and edge cases
4. **Monitor Performance**: Use React Query Devtools to optimize cache behavior
5. **User Experience First**: Always prioritize smooth UI over perfect data consistency

## Conclusion

The HSA Songbook codebase demonstrates excellent patterns for optimistic updates, from simple mutations to complex offline-first architectures. The key to success is consistent patterns, thorough error handling, and always prioritizing user experience while maintaining data integrity.