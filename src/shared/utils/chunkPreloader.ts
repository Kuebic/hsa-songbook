/**
 * @file chunkPreloader.ts
 * @description Strategic chunk preloading utilities for optimized loading
 * Implements network-aware and priority-based preloading
 */

import type { NetworkConnection } from '../types/common'

// Track preloaded chunks and their status
interface ChunkStatus {
  name: string
  loaded: boolean
  loading: boolean
  error?: Error
  timestamp?: number
  size?: number
}

// Global chunk registry
declare global {
  interface Window {
    __chunkRegistry?: Map<string, ChunkStatus>
    __preloadQueue?: Set<string>
    __preloadInProgress?: boolean
  }
}

// Initialize global registries
if (typeof window !== 'undefined') {
  window.__chunkRegistry = window.__chunkRegistry || new Map()
  window.__preloadQueue = window.__preloadQueue || new Set()
  window.__preloadInProgress = false
}

/**
 * Network quality detection
 */
function getConnectionQuality(): 'high' | 'medium' | 'low' | 'save-data' | 'offline' {
  if (!navigator.onLine) return 'offline'
  
  const connection = (navigator as unknown as { connection?: NetworkConnection }).connection || 
                    (navigator as unknown as { mozConnection?: NetworkConnection }).mozConnection || 
                    (navigator as unknown as { webkitConnection?: NetworkConnection }).webkitConnection
  
  if (!connection) return 'medium'
  
  // Check save data mode
  if (connection.saveData) return 'save-data'
  
  // Check RTT and downlink
  const rtt = connection.rtt
  const downlink = connection.downlink
  
  if (rtt && rtt < 100 && downlink && downlink > 5) return 'high'
  if (rtt && rtt < 300 && downlink && downlink > 1) return 'medium'
  
  // Check effective type
  const effectiveType = connection.effectiveType
  if (effectiveType === '4g') return 'high'
  if (effectiveType === '3g') return 'medium'
  
  return 'low'
}

/**
 * Check if preloading should be allowed based on conditions
 */
function shouldAllowPreload(priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): boolean {
  const quality = getConnectionQuality()
  
  // Never preload offline
  if (quality === 'offline') return false
  
  // Save data mode - only critical
  if (quality === 'save-data') return priority === 'critical'
  
  // Low connection - only critical and high
  if (quality === 'low') return priority === 'critical' || priority === 'high'
  
  // Medium connection - skip low priority
  if (quality === 'medium') return priority !== 'low'
  
  // High connection - preload everything
  return true
}

/**
 * Get memory usage (if available)
 */
function getMemoryPressure(): 'high' | 'medium' | 'low' | 'unknown' {
  const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
  
  if (!memory) return 'unknown'
  
  const used = memory.usedJSHeapSize
  const limit = memory.jsHeapSizeLimit
  
  const usage = used / limit
  
  if (usage > 0.9) return 'high'
  if (usage > 0.7) return 'medium'
  
  return 'low'
}

/**
 * Create a preload link element
 */
function createPreloadLink(href: string, as: 'script' | 'style' = 'script'): HTMLLinkElement {
  const link = document.createElement('link')
  
  // Use modulepreload for ES modules
  if (as === 'script' && href.endsWith('.js')) {
    link.rel = 'modulepreload'
  } else {
    link.rel = 'preload'
    link.as = as
  }
  
  link.href = href
  
  // Add crossorigin for scripts
  if (as === 'script') {
    link.crossOrigin = 'anonymous'
  }
  
  return link
}

/**
 * Preload a specific chunk
 */
export function preloadChunk(
  chunkName: string, 
  options: {
    priority?: 'critical' | 'high' | 'normal' | 'low'
    force?: boolean
    onLoad?: () => void
    onError?: (error: Error) => void
  } = {}
): Promise<void> {
  const { priority = 'normal', force = false, onLoad, onError } = options
  
  return new Promise((resolve, reject) => {
    // Check if already loaded or loading
    const registry = window.__chunkRegistry || new Map()
    const existing = registry.get(chunkName)
    
    if (existing) {
      if (existing.loaded) {
        onLoad?.()
        resolve()
        return
      }
      
      if (existing.loading) {
        // Wait for existing load
        const checkInterval = setInterval(() => {
          const status = registry.get(chunkName)
          if (status?.loaded) {
            clearInterval(checkInterval)
            onLoad?.()
            resolve()
          } else if (status?.error) {
            clearInterval(checkInterval)
            onError?.(status.error)
            reject(status.error)
          }
        }, 100)
        return
      }
    }
    
    // Check if preloading should be allowed
    if (!force && !shouldAllowPreload(priority)) {
      const error = new Error(`Preloading blocked for ${chunkName} due to network conditions`)
      onError?.(error)
      reject(error)
      return
    }
    
    // Check memory pressure
    const memoryPressure = getMemoryPressure()
    if (memoryPressure === 'high' && priority !== 'critical') {
      const error = new Error(`Preloading blocked for ${chunkName} due to memory pressure`)
      onError?.(error)
      reject(error)
      return
    }
    
    // Update registry
    registry.set(chunkName, {
      name: chunkName,
      loaded: false,
      loading: true,
      timestamp: Date.now()
    })
    
    // Construct chunk URL (simplified - in production use manifest)
    const basePath = import.meta.env.BASE_URL || '/'
    let chunkPath = `${basePath}assets/js/${chunkName}.js`
    
    // Adjust path based on chunk type
    if (chunkName.includes('vendor')) {
      chunkPath = `${basePath}assets/js/vendors/${chunkName}.js`
    } else if (chunkName.includes('Page')) {
      chunkPath = `${basePath}assets/js/pages/${chunkName}.js`
    } else if (chunkName.includes('features')) {
      chunkPath = `${basePath}assets/js/features/${chunkName}.js`
    }
    
    // Create and append preload link
    const link = createPreloadLink(chunkPath)
    
    link.onload = () => {
      registry.set(chunkName, {
        name: chunkName,
        loaded: true,
        loading: false,
        timestamp: Date.now()
      })
      
      onLoad?.()
      resolve()
    }
    
    link.onerror = () => {
      const error = new Error(`Failed to preload chunk: ${chunkName}`)
      
      registry.set(chunkName, {
        name: chunkName,
        loaded: false,
        loading: false,
        error,
        timestamp: Date.now()
      })
      
      onError?.(error)
      reject(error)
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Batch preload multiple chunks
 */
export async function preloadChunks(
  chunks: string[],
  options: {
    parallel?: boolean
    priority?: 'critical' | 'high' | 'normal' | 'low'
    onProgress?: (loaded: number, total: number) => void
  } = {}
): Promise<void> {
  const { parallel = true, priority = 'normal', onProgress } = options
  
  let loaded = 0
  const total = chunks.length
  
  const loadChunk = async (chunk: string) => {
    try {
      await preloadChunk(chunk, { priority })
      loaded++
      onProgress?.(loaded, total)
    } catch (error) {
      console.warn(`Failed to preload chunk ${chunk}:`, error)
      loaded++
      onProgress?.(loaded, total)
    }
  }
  
  if (parallel) {
    await Promise.all(chunks.map(loadChunk))
  } else {
    for (const chunk of chunks) {
      await loadChunk(chunk)
    }
  }
}

/**
 * Warm the cache with non-critical chunks
 */
export function warmCache(chunks: string[]): void {
  // Only warm cache on high-speed connections
  if (getConnectionQuality() !== 'high') {
    return
  }
  
  // Only warm cache when memory pressure is low
  if (getMemoryPressure() === 'high') {
    return
  }
  
  // Use requestIdleCallback for non-blocking preloading
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      chunks.forEach(chunk => {
        preloadChunk(chunk, { priority: 'low' }).catch(() => {
          // Silently ignore warm cache failures
        })
      })
    }, { timeout: 10000 })
  } else {
    // Fallback with setTimeout
    setTimeout(() => {
      chunks.forEach(chunk => {
        preloadChunk(chunk, { priority: 'low' }).catch(() => {
          // Silently ignore warm cache failures
        })
      })
    }, 5000)
  }
}

/**
 * Clear preloaded chunks from registry (for memory management)
 */
export function clearChunkCache(olderThan?: number): void {
  const registry = window.__chunkRegistry
  
  if (!registry) return
  
  const now = Date.now()
  const threshold = olderThan || (1000 * 60 * 30) // Default 30 minutes
  
  registry.forEach((status, name) => {
    if (status.timestamp && (now - status.timestamp) > threshold) {
      registry.delete(name)
    }
  })
}

/**
 * Get chunk loading status
 */
export function getChunkStatus(chunkName: string): ChunkStatus | undefined {
  return window.__chunkRegistry?.get(chunkName)
}

/**
 * Check if a chunk is loaded
 */
export function isChunkLoaded(chunkName: string): boolean {
  return window.__chunkRegistry?.get(chunkName)?.loaded || false
}

/**
 * Queue chunks for preloading when idle
 */
export function queuePreload(chunks: string[], priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): void {
  const queue = window.__preloadQueue || new Set()
  
  chunks.forEach(chunk => queue.add(chunk))
  
  // Process queue when idle
  if (!window.__preloadInProgress) {
    window.__preloadInProgress = true
    
    const processQueue = () => {
      if (queue.size === 0) {
        window.__preloadInProgress = false
        return
      }
      
      // Get next chunk
      const iterator = queue.values().next()
      if (iterator.done || !iterator.value) {
        window.__preloadInProgress = false
        return
      }
      
      const chunk = iterator.value
      queue.delete(chunk)
      
      // Preload it
      preloadChunk(chunk, { priority }).finally(() => {
        // Continue processing
        if ('requestIdleCallback' in window) {
          requestIdleCallback(processQueue, { timeout: 2000 })
        } else {
          setTimeout(processQueue, 100)
        }
      })
    }
    
    // Start processing
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processQueue, { timeout: 2000 })
    } else {
      setTimeout(processQueue, 100)
    }
  }
}

/**
 * Preload chunks based on route pattern
 */
export function preloadForRoute(routePath: string): Promise<void> {
  const routeChunks: Record<string, string[]> = {
    '/songs': ['songs', 'shared-ui'],
    '/search': ['search', 'shared-ui'],
    '/setlists': ['setlists', 'shared-ui'],
    '/arrangements/edit': ['arrangements', 'editor-vendor', 'chord-lib'],
    '/arrangements/new': ['arrangements', 'editor-vendor', 'chord-lib'],
    '/arrangements': ['arrangements', 'chord-lib'],
    '/admin': ['admin', 'auth'],
    '/moderation': ['admin', 'auth']
  }
  
  // Find matching route pattern
  const chunks = Object.entries(routeChunks).find(([pattern]) => 
    routePath.startsWith(pattern)
  )?.[1]
  
  if (!chunks) {
    return Promise.resolve()
  }
  
  // Determine priority based on route
  const priority = routePath.includes('admin') ? 'low' : 'normal'
  
  return preloadChunks(chunks, { priority })
}

/**
 * Initialize chunk preloading system
 */
export function initializeChunkPreloader(): void {
  // Clear old cache entries periodically
  setInterval(() => {
    clearChunkCache()
  }, 1000 * 60 * 10) // Every 10 minutes
  
  // Listen for memory pressure warnings (if available)
  if ('memory' in performance) {
    setInterval(() => {
      const pressure = getMemoryPressure()
      if (pressure === 'high') {
        console.warn('High memory pressure detected, clearing chunk cache')
        clearChunkCache(1000 * 60 * 5) // Clear chunks older than 5 minutes
      }
    }, 1000 * 30) // Check every 30 seconds
  }
  
  // Warm cache with common chunks on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      warmCache(['shared-ui', 'songs', 'search'])
    }, { timeout: 30000 })
  }
}