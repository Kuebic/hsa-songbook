import type { OfflineStatus, SyncQueueItem } from '../types/pwa.types'

// Check if currently online
export function isOnline(): boolean {
  return navigator.onLine
}

// Wait for connection to be restored
export function waitForConnection(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve()
    } else {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline)
        resolve()
      }
      window.addEventListener('online', handleOnline)
    }
  })
}

// Get offline status
export function getOfflineStatus(): OfflineStatus {
  const pendingRequests = getSyncQueue().length
  const lastOnlineStr = localStorage.getItem('last-online')
  const lastOnline = lastOnlineStr ? new Date(lastOnlineStr) : null

  return {
    isOnline: isOnline(),
    lastOnline,
    pendingRequests
  }
}

// Update last online timestamp
export function updateLastOnline(): void {
  if (isOnline()) {
    localStorage.setItem('last-online', new Date().toISOString())
  }
}

// Sync queue management for offline requests
const SYNC_QUEUE_KEY = 'pwa-sync-queue'

export function getSyncQueue(): SyncQueueItem[] {
  const queueStr = localStorage.getItem(SYNC_QUEUE_KEY)
  if (!queueStr) return []
  
  try {
    return JSON.parse(queueStr)
  } catch {
    return []
  }
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getSyncQueue()
  const newItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0
  }
  
  queue.push(newItem)
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

export function removeFromSyncQueue(id: string): void {
  const queue = getSyncQueue()
  const filtered = queue.filter(item => item.id !== id)
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered))
}

export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY)
}

// Process sync queue when back online
export async function processSyncQueue(): Promise<void> {
  if (!isOnline()) return

  const queue = getSyncQueue()
  if (queue.length === 0) return

  console.log(`Processing ${queue.length} queued requests...`)

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      })

      if (response.ok) {
        removeFromSyncQueue(item.id)
        console.log(`Successfully synced request ${item.id}`)
      } else {
        // Increment retry count
        const updatedQueue = getSyncQueue()
        const itemIndex = updatedQueue.findIndex(q => q.id === item.id)
        if (itemIndex !== -1) {
          updatedQueue[itemIndex].retries++
          // Remove if too many retries
          if (updatedQueue[itemIndex].retries > 3) {
            console.error(`Failed to sync request ${item.id} after 3 retries`)
            removeFromSyncQueue(item.id)
          } else {
            localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue))
          }
        }
      }
    } catch (error) {
      console.error(`Error syncing request ${item.id}:`, error)
    }
  }
}

// Offline-aware fetch wrapper
export async function offlineFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Try the request
  try {
    const response = await fetch(url, options)
    updateLastOnline()
    return response
  } catch (error) {
    // If offline and it's a mutation, queue it
    if (!isOnline() && options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      addToSyncQueue({
        url,
        method: options.method as 'POST' | 'PUT' | 'DELETE',
        body: options.body ? JSON.parse(options.body as string) : undefined,
      })
      
      // Return a fake success response
      return new Response(JSON.stringify({ 
        queued: true, 
        message: 'Request queued for sync when online' 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    throw error
  }
}

// Setup offline/online event listeners
export function setupOfflineHandlers(): void {
  // Update last online timestamp periodically when online
  setInterval(() => {
    if (isOnline()) {
      updateLastOnline()
    }
  }, 60000) // Every minute

  // Process sync queue when coming back online
  window.addEventListener('online', () => {
    console.log('Back online! Processing sync queue...')
    processSyncQueue()
  })

  // Log when going offline
  window.addEventListener('offline', () => {
    console.log('Going offline. Requests will be queued.')
  })

  // Process queue on page visibility change (tab becomes active)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isOnline()) {
      processSyncQueue()
    }
  })
}