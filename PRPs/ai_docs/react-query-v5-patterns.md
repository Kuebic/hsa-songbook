# React Query v5 Patterns for Setlist Implementation

## Critical Implementation Patterns

This document provides essential React Query v5 patterns specifically for the setlist feature implementation. Reference this when implementing query and mutation hooks.

---

## 1. Optimistic Updates Without Flicker

### Problem
Standard optimistic updates can cause UI flicker when the server response replaces the optimistic data.

### Solution Pattern
```typescript
export function useReorderWithoutFlicker(setlistId: string) {
  const queryClient = useQueryClient()
  const [localOrder, setLocalOrder] = useState<string[] | null>(null)
  
  const { data: serverData } = useQuery({
    queryKey: ['setlist', setlistId],
    queryFn: () => fetchSetlist(setlistId),
  })
  
  // Use local state during reordering, server data otherwise
  const displayOrder = localOrder ?? serverData?.arrangementOrder ?? []
  
  const reorderMutation = useMutation({
    mutationFn: (newOrder: string[]) => updateOrder(setlistId, newOrder),
    
    onMutate: async (newOrder) => {
      // Set local state immediately
      setLocalOrder(newOrder)
      
      // Cancel queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['setlist', setlistId] })
      
      // Return context for potential rollback
      return { previousOrder: serverData?.arrangementOrder }
    },
    
    onError: (err, newOrder, context) => {
      // Rollback local state on error
      setLocalOrder(null)
      
      // Optionally restore previous server data
      if (context?.previousOrder) {
        queryClient.setQueryData(['setlist', setlistId], (old: any) => ({
          ...old,
          arrangementOrder: context.previousOrder
        }))
      }
    },
    
    onSuccess: (data) => {
      // Clear local state to use fresh server data
      setLocalOrder(null)
      
      // Update cache with server response
      queryClient.setQueryData(['setlist', setlistId], data)
    },
    
    onSettled: () => {
      // Always clear local state and refetch
      setLocalOrder(null)
      queryClient.invalidateQueries({ queryKey: ['setlist', setlistId] })
    }
  })
  
  return {
    arrangementOrder: displayOrder,
    reorder: reorderMutation.mutate,
    isReordering: reorderMutation.isPending
  }
}
```

---

## 2. Dependent Queries with Population

### Problem
Need to fetch setlist, then fetch all arrangements referenced in the setlist.

### Solution Pattern
```typescript
export function useSetlistWithArrangements(setlistId: string) {
  // Primary query
  const setlistQuery = useQuery({
    queryKey: ['setlist', setlistId],
    queryFn: () => fetchSetlist(setlistId),
    staleTime: 5 * 60 * 1000,
  })
  
  // Extract arrangement IDs
  const arrangementIds = setlistQuery.data?.arrangements
    .map(a => a.arrangementId)
    .filter(Boolean) ?? []
  
  // Batch fetch arrangements
  const arrangementQueries = useQueries({
    queries: arrangementIds.map(id => ({
      queryKey: ['arrangement', id],
      queryFn: () => fetchArrangement(id),
      staleTime: 10 * 60 * 1000,
      enabled: !!setlistQuery.data, // Only fetch after setlist loads
    }))
  })
  
  // Combine data
  const populatedSetlist = useMemo(() => {
    if (!setlistQuery.data) return null
    
    return {
      ...setlistQuery.data,
      arrangements: setlistQuery.data.arrangements.map((item, index) => ({
        ...item,
        arrangement: arrangementQueries[index]?.data
      }))
    }
  }, [setlistQuery.data, arrangementQueries])
  
  return {
    setlist: populatedSetlist,
    isLoading: setlistQuery.isLoading || arrangementQueries.some(q => q.isLoading),
    error: setlistQuery.error || arrangementQueries.find(q => q.error)?.error
  }
}
```

---

## 3. Real-Time Cross-Tab Synchronization

### Problem
Multiple tabs should stay in sync when setlist data changes.

### Solution Pattern
```typescript
export function useRealtimeSync(queryKey: QueryKey) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Create broadcast channel for this query
    const channelName = `query-sync-${JSON.stringify(queryKey)}`
    const channel = new BroadcastChannel(channelName)
    
    // Listen for updates from other tabs
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'QUERY_UPDATED') {
        // Invalidate this query in current tab
        queryClient.invalidateQueries({ queryKey })
      }
    }
    
    channel.addEventListener('message', handleMessage)
    
    // Broadcast when this tab updates the query
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && 
          JSON.stringify(event.query.queryKey) === JSON.stringify(queryKey)) {
        channel.postMessage({ type: 'QUERY_UPDATED' })
      }
    })
    
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
      unsubscribe()
    }
  }, [queryKey, queryClient])
}

// Usage
function SetlistComponent({ setlistId }: { setlistId: string }) {
  useRealtimeSync(['setlist', setlistId])
  
  const { data } = useQuery({
    queryKey: ['setlist', setlistId],
    queryFn: () => fetchSetlist(setlistId)
  })
  
  // Component will refetch when other tabs make changes
}
```

---

## 4. Offline Queue with Retry

### Problem
Need to queue mutations when offline and process them when connection returns.

### Solution Pattern
```typescript
export function useOfflineQueue() {
  const queryClient = useQueryClient()
  const [queuedMutations, setQueuedMutations] = useState<QueuedMutation[]>([])
  
  // Monitor online status
  const isOnline = useOnlineStatus()
  
  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queuedMutations.length > 0) {
      processQueue()
    }
  }, [isOnline, queuedMutations])
  
  const processQueue = async () => {
    for (const mutation of queuedMutations) {
      try {
        await mutation.execute()
        
        // Remove from queue after success
        setQueuedMutations(prev => 
          prev.filter(m => m.id !== mutation.id)
        )
      } catch (error) {
        console.error('Failed to process queued mutation:', error)
        // Keep in queue for retry
      }
    }
  }
  
  const queueMutation = useCallback((mutation: QueuedMutation) => {
    if (!isOnline) {
      setQueuedMutations(prev => [...prev, mutation])
      
      // Store in localStorage for persistence
      localStorage.setItem(
        'offline-queue',
        JSON.stringify([...queuedMutations, mutation])
      )
      
      return Promise.resolve({ 
        status: 'queued',
        id: mutation.id 
      })
    }
    
    // Execute immediately if online
    return mutation.execute()
  }, [isOnline, queuedMutations])
  
  return {
    queueMutation,
    queuedCount: queuedMutations.length,
    isProcessing: false,
    clearQueue: () => setQueuedMutations([])
  }
}
```

---

## 5. Smart Cache Invalidation

### Problem
Need to invalidate related queries efficiently without over-fetching.

### Solution Pattern
```typescript
export function useSmartInvalidation() {
  const queryClient = useQueryClient()
  
  const invalidateSetlistRelated = useCallback((setlistId: string) => {
    // Invalidate with different strategies
    
    // 1. Exact match - immediate invalidation
    queryClient.invalidateQueries({ 
      queryKey: ['setlist', setlistId],
      exact: true 
    })
    
    // 2. Pattern match - invalidate lists containing this setlist
    queryClient.invalidateQueries({ 
      queryKey: ['setlists'],
      refetchType: 'active' // Only refetch if component is mounted
    })
    
    // 3. Conditional invalidation - only if data is stale
    queryClient.invalidateQueries({
      queryKey: ['user-setlists'],
      predicate: (query) => {
        const data = query.state.data as any
        return data?.some((s: any) => s.id === setlistId)
      }
    })
    
    // 4. Don't invalidate arrangements (they didn't change)
    // This prevents unnecessary refetches
    
  }, [queryClient])
  
  const invalidateArrangementRelated = useCallback((arrangementId: string) => {
    // Invalidate arrangement
    queryClient.invalidateQueries({ 
      queryKey: ['arrangement', arrangementId] 
    })
    
    // Invalidate setlists containing this arrangement
    queryClient.invalidateQueries({
      predicate: (query) => {
        if (!query.queryKey[0]?.toString().includes('setlist')) return false
        
        const data = query.state.data as any
        return data?.arrangements?.some(
          (a: any) => a.arrangementId === arrangementId
        )
      }
    })
  }, [queryClient])
  
  return {
    invalidateSetlistRelated,
    invalidateArrangementRelated
  }
}
```

---

## 6. Prefetching Strategy

### Problem
Need to prefetch data before user navigates to improve perceived performance.

### Solution Pattern
```typescript
export function usePrefetchStrategies() {
  const queryClient = useQueryClient()
  
  // Prefetch on hover
  const prefetchOnHover = useCallback((setlistId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['setlist', setlistId],
      queryFn: () => fetchSetlist(setlistId),
      staleTime: 10 * 60 * 1000,
    })
  }, [queryClient])
  
  // Prefetch next/previous in sequence
  const prefetchAdjacent = useCallback((
    currentId: string,
    allIds: string[]
  ) => {
    const currentIndex = allIds.indexOf(currentId)
    
    // Prefetch next
    if (currentIndex < allIds.length - 1) {
      const nextId = allIds[currentIndex + 1]
      queryClient.prefetchQuery({
        queryKey: ['setlist', nextId],
        queryFn: () => fetchSetlist(nextId),
      })
    }
    
    // Prefetch previous
    if (currentIndex > 0) {
      const prevId = allIds[currentIndex - 1]
      queryClient.prefetchQuery({
        queryKey: ['setlist', prevId],
        queryFn: () => fetchSetlist(prevId),
      })
    }
  }, [queryClient])
  
  // Prefetch based on user patterns
  const prefetchLikely = useCallback(() => {
    // Get recently viewed from localStorage
    const recentlyViewed = JSON.parse(
      localStorage.getItem('recently-viewed-setlists') || '[]'
    )
    
    // Prefetch top 3 most recent
    recentlyViewed.slice(0, 3).forEach((id: string) => {
      queryClient.prefetchQuery({
        queryKey: ['setlist', id],
        queryFn: () => fetchSetlist(id),
        staleTime: 30 * 60 * 1000, // Cache for 30 min
      })
    })
  }, [queryClient])
  
  return {
    prefetchOnHover,
    prefetchAdjacent,
    prefetchLikely
  }
}
```

---

## 7. Mutation with Rollback

### Problem
Need to handle complex rollback scenarios when mutations fail.

### Solution Pattern
```typescript
export function useComplexMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (variables: MutationVariables) => {
      // Perform the mutation
      return await performMutation(variables)
    },
    
    onMutate: async (variables) => {
      // Cancel queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['setlist'] })
      
      // Snapshot ALL affected queries
      const snapshots = {
        setlist: queryClient.getQueryData(['setlist', variables.setlistId]),
        setlists: queryClient.getQueryData(['setlists']),
        userSetlists: queryClient.getQueryData(['user-setlists']),
      }
      
      // Optimistically update ALL affected caches
      queryClient.setQueryData(
        ['setlist', variables.setlistId],
        (old: any) => ({ ...old, ...variables.updates })
      )
      
      queryClient.setQueryData(
        ['setlists'],
        (old: any) => {
          // Update the item in the list
          return {
            ...old,
            content: old.content.map((item: any) =>
              item.id === variables.setlistId
                ? { ...item, ...variables.updates }
                : item
            )
          }
        }
      )
      
      // Return context with all snapshots
      return { snapshots }
    },
    
    onError: (err, variables, context) => {
      // Rollback ALL caches using snapshots
      if (context?.snapshots) {
        Object.entries(context.snapshots).forEach(([key, data]) => {
          if (key === 'setlist') {
            queryClient.setQueryData(
              ['setlist', variables.setlistId],
              data
            )
          } else {
            queryClient.setQueryData([key], data)
          }
        })
      }
    },
    
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['setlist'] })
      queryClient.invalidateQueries({ queryKey: ['setlists'] })
    }
  })
}
```

---

## 8. Infinite Query with Optimistic Updates

### Problem
Need to add items optimistically to an infinite query result.

### Solution Pattern
```typescript
export function useInfiniteWithOptimistic() {
  const queryClient = useQueryClient()
  
  const infiniteQuery = useInfiniteQuery({
    queryKey: ['setlists', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchSetlists({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  })
  
  const addOptimistic = useCallback((newItem: Setlist) => {
    queryClient.setQueryData(
      ['setlists', 'infinite'],
      (old: any) => {
        if (!old) return old
        
        // Add to first page
        const newPages = [...old.pages]
        newPages[0] = {
          ...newPages[0],
          items: [newItem, ...newPages[0].items]
        }
        
        return {
          ...old,
          pages: newPages
        }
      }
    )
  }, [queryClient])
  
  const removeOptimistic = useCallback((itemId: string) => {
    queryClient.setQueryData(
      ['setlists', 'infinite'],
      (old: any) => {
        if (!old) return old
        
        // Remove from all pages
        const newPages = old.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((item: any) => item.id !== itemId)
        }))
        
        return {
          ...old,
          pages: newPages
        }
      }
    )
  }, [queryClient])
  
  return {
    ...infiniteQuery,
    addOptimistic,
    removeOptimistic
  }
}
```

---

## Common Pitfalls to Avoid

1. **Don't mutate cache data directly** - Always return new objects
2. **Cancel queries before optimistic updates** - Prevents race conditions
3. **Use `exact: true` for specific invalidations** - Prevents over-fetching
4. **Store rollback context in `onMutate`** - Enables proper error recovery
5. **Clear local state in `onSettled`** - Ensures clean state after mutations
6. **Use `enabled` for dependent queries** - Prevents unnecessary requests
7. **Set appropriate `staleTime`** - Reduces unnecessary refetches
8. **Use `select` to transform data** - Prevents unnecessary re-renders

---

## Testing Patterns

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

// Create test query client with instant retries disabled
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Test optimistic updates
test('optimistically updates setlist order', async () => {
  const { result } = renderHook(
    () => useReorderWithoutFlicker('setlist-1'),
    { wrapper: createWrapper() }
  )
  
  // Trigger reorder
  act(() => {
    result.current.reorder(['item-2', 'item-1', 'item-3'])
  })
  
  // Check immediate update (optimistic)
  expect(result.current.arrangementOrder).toEqual(['item-2', 'item-1', 'item-3'])
  
  // Wait for server response
  await waitFor(() => {
    expect(result.current.isReordering).toBe(false)
  })
})
```

---

This document provides battle-tested patterns for React Query v5 implementation. Use these patterns to ensure robust, performant, and user-friendly setlist management.