/**
 * @file routePrefetch.ts
 * @description Intelligent route prefetching based on user behavior
 * Implements network-aware prefetching strategies
 */

import type { NetworkConnection } from '../../shared/types/common'

export interface RouteConfig {
  path: string
  chunkName: string
  prefetchOn?: 'hover' | 'focus' | 'visible'
  dependencies?: string[] // Other chunks this route needs
}

// Track loaded chunks globally
declare global {
  interface Window {
    __loadedChunks?: Set<string>
    __prefetchObserver?: IntersectionObserver
    __hoverTimers?: Map<string, NodeJS.Timeout>
  }
}

// Route configurations with prefetch strategies
const routeConfigs: RouteConfig[] = [
  { 
    path: '/search', 
    chunkName: 'SearchPage',
    prefetchOn: 'visible',
    dependencies: ['search', 'shared-ui'] 
  },
  { 
    path: '/songs', 
    chunkName: 'SongListPage',
    prefetchOn: 'visible',
    dependencies: ['songs', 'shared-ui'] 
  },
  { 
    path: '/songs/', // Match song detail pages
    chunkName: 'SongDetailPage',
    prefetchOn: 'visible',
    dependencies: ['songs', 'shared-ui'] 
  },
  { 
    path: '/arrangements/edit', 
    chunkName: 'ChordEditingPage',
    prefetchOn: 'hover',
    dependencies: ['arrangements', 'editor-vendor', 'chord-lib'] 
  },
  { 
    path: '/arrangements/new', 
    chunkName: 'ChordEditingPage',
    prefetchOn: 'hover',
    dependencies: ['arrangements', 'editor-vendor', 'chord-lib'] 
  },
  { 
    path: '/arrangements/', // Match arrangement viewer pages
    chunkName: 'ArrangementViewerPage',
    prefetchOn: 'visible',
    dependencies: ['arrangements', 'chord-lib', 'shared-ui'] 
  },
  { 
    path: '/setlists', 
    chunkName: 'SetlistsPage',
    prefetchOn: 'visible',
    dependencies: ['setlists', 'shared-ui'] 
  },
  { 
    path: '/admin', 
    chunkName: 'AdminDashboard',
    prefetchOn: 'hover', // Only prefetch on intentional hover
    dependencies: ['admin', 'auth'] 
  },
  { 
    path: '/moderation', 
    chunkName: 'ModerationDashboard',
    prefetchOn: 'hover',
    dependencies: ['admin', 'auth'] 
  },
  { 
    path: '/admin/permissions', 
    chunkName: 'PermissionManagement',
    prefetchOn: 'hover',
    dependencies: ['admin', 'auth'] 
  }
]

/**
 * Check network connection quality
 */
function getNetworkQuality(): 'fast' | 'medium' | 'slow' | 'offline' {
  if (!navigator.onLine) return 'offline'
  
  const connection = (navigator as unknown as { connection?: NetworkConnection }).connection || (navigator as unknown as { mozConnection?: NetworkConnection }).mozConnection || (navigator as unknown as { webkitConnection?: NetworkConnection }).webkitConnection
  
  if (!connection) return 'medium' // Default if API not available
  
  // Check save data mode
  if (connection.saveData) return 'slow'
  
  // Check effective connection type
  const effectiveType = connection.effectiveType
  if (effectiveType === '4g') return 'fast'
  if (effectiveType === '3g') return 'medium'
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow'
  
  // Check downlink speed
  const downlink = connection.downlink
  if (downlink && downlink > 5) return 'fast'
  if (downlink && downlink > 1) return 'medium'
  
  return 'slow'
}

/**
 * Prefetch a single chunk
 */
function prefetchChunk(chunkName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.__loadedChunks?.has(chunkName)) {
      resolve()
      return
    }
    
    // Create prefetch link
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'script'
    
    // Build chunk path (Vite will generate hashed filenames)
    // We'll use modulepreload for ES modules
    link.rel = 'modulepreload'
    
    // Try to find the actual chunk file
    // In production, we need to look for the actual hashed filename
    // This is a simplified version - in production you might need a manifest
    const basePath = import.meta.env.BASE_URL || '/'
    
    // For feature chunks
    if (chunkName.includes('Page')) {
      link.href = `${basePath}assets/js/pages/${chunkName}.js`
    } else if (chunkName.includes('vendor')) {
      link.href = `${basePath}assets/js/vendors/${chunkName}.js`
    } else if (chunkName.includes('features')) {
      link.href = `${basePath}assets/js/features/${chunkName}.js`
    } else {
      link.href = `${basePath}assets/js/${chunkName}.js`
    }
    
    link.onload = () => {
      // Track loaded chunks
      window.__loadedChunks = window.__loadedChunks || new Set()
      window.__loadedChunks.add(chunkName)
      resolve()
    }
    
    link.onerror = () => {
      console.warn(`Failed to prefetch chunk: ${chunkName}`)
      reject(new Error(`Failed to prefetch chunk: ${chunkName}`))
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Prefetch a route and its dependencies
 */
export async function prefetchRoute(config: RouteConfig): Promise<void> {
  // Check network quality
  const networkQuality = getNetworkQuality()
  
  // Skip prefetching on slow connections
  if (networkQuality === 'slow' || networkQuality === 'offline') {
    console.log(`Skipping prefetch for ${config.path} due to ${networkQuality} connection`)
    return
  }
  
  // For medium connections, only prefetch critical chunks
  if (networkQuality === 'medium' && config.prefetchOn === 'hover') {
    console.log(`Skipping hover prefetch for ${config.path} on medium connection`)
    return
  }
  
  try {
    // Prefetch dependencies first
    if (config.dependencies) {
      await Promise.all(
        config.dependencies.map(dep => prefetchChunk(dep).catch(() => {
          // Continue even if some dependencies fail
          console.warn(`Failed to prefetch dependency: ${dep}`)
        }))
      )
    }
    
    // Then prefetch the route chunk
    await prefetchChunk(config.chunkName)
    
    console.log(`Successfully prefetched route: ${config.path}`)
  } catch (error) {
    console.warn(`Failed to prefetch route ${config.path}:`, error)
  }
}

/**
 * Setup intersection observer for visible link prefetching
 */
export function setupPrefetchObserver(): void {
  // Clean up existing observer
  if (window.__prefetchObserver) {
    window.__prefetchObserver.disconnect()
  }
  
  // Create new observer
  window.__prefetchObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement
          const href = link.getAttribute('href')
          
          if (!href) return
          
          // Find matching route config
          const config = routeConfigs.find(r => {
            if (r.path.endsWith('/')) {
              // Match partial paths (e.g., /songs/ matches /songs/123)
              return href.startsWith(r.path)
            }
            return href === r.path || href.startsWith(r.path + '/')
          })
          
          if (config?.prefetchOn === 'visible') {
            // Use requestIdleCallback if available
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => {
                prefetchRoute(config).catch(console.warn)
              }, { timeout: 2000 })
            } else {
              setTimeout(() => {
                prefetchRoute(config).catch(console.warn)
              }, 100)
            }
            
            // Stop observing this link
            window.__prefetchObserver?.unobserve(link)
          }
        }
      })
    },
    { 
      rootMargin: '50px', // Start prefetching 50px before visible
      threshold: 0.01 
    }
  )
  
  // Observe all route links
  const links = document.querySelectorAll('a[href^="/"]')
  links.forEach(link => {
    window.__prefetchObserver?.observe(link)
  })
}

/**
 * Setup hover-based prefetching
 */
export function setupHoverPrefetch(): void {
  // Initialize hover timers map
  window.__hoverTimers = window.__hoverTimers || new Map()
  
  // Add event listeners to all route links
  document.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement
    
    if (!link) return
    
    const href = link.getAttribute('href')
    if (!href) return
    
    // Find matching route config
    const config = routeConfigs.find(r => {
      if (r.path.endsWith('/')) {
        return href.startsWith(r.path)
      }
      return href === r.path || href.startsWith(r.path + '/')
    })
    
    if (config?.prefetchOn === 'hover') {
      // Clear any existing timer for this link
      const existingTimer = window.__hoverTimers?.get(href)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      
      // Start a new timer (delay to avoid prefetching on accidental hover)
      const timer = setTimeout(() => {
        prefetchRoute(config).catch(console.warn)
        window.__hoverTimers?.delete(href)
      }, 200) // 200ms delay
      
      window.__hoverTimers?.set(href, timer)
    }
  })
  
  // Clear timer on mouseout
  document.addEventListener('mouseout', (event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement
    
    if (!link) return
    
    const href = link.getAttribute('href')
    if (!href) return
    
    // Clear the hover timer
    const timer = window.__hoverTimers?.get(href)
    if (timer) {
      clearTimeout(timer)
      window.__hoverTimers?.delete(href)
    }
  })
}

/**
 * Setup focus-based prefetching (for keyboard navigation)
 */
export function setupFocusPrefetch(): void {
  document.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement
    
    if (!link) return
    
    const href = link.getAttribute('href')
    if (!href) return
    
    // Find matching route config
    const config = routeConfigs.find(r => {
      if (r.path.endsWith('/')) {
        return href.startsWith(r.path)
      }
      return href === r.path || href.startsWith(r.path + '/')
    })
    
    if (config && (config.prefetchOn === 'hover' || config.prefetchOn === 'focus')) {
      // Prefetch immediately on focus
      prefetchRoute(config).catch(console.warn)
    }
  })
}

/**
 * Initialize all prefetching strategies
 */
export function initializePrefetching(): void {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePrefetching)
    return
  }
  
  // Setup different prefetch strategies
  setupPrefetchObserver()
  setupHoverPrefetch()
  setupFocusPrefetch()
  
  // Re-initialize on route changes (for SPAs)
  // We'll use a MutationObserver to detect new links
  const observer = new MutationObserver(() => {
    // Debounce to avoid excessive re-initialization
    clearTimeout((window as unknown as { __reinitTimeout?: NodeJS.Timeout }).__reinitTimeout)
    ;(window as unknown as { __reinitTimeout?: NodeJS.Timeout }).__reinitTimeout = setTimeout(() => {
      setupPrefetchObserver()
    }, 500)
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  
  // Listen for network changes
  if ('connection' in navigator) {
    const connection = (navigator as unknown as { connection?: NetworkConnection }).connection
    if (connection?.addEventListener && typeof connection.addEventListener === 'function') {
      connection.addEventListener('change', () => {
        console.log('Network connection changed, adjusting prefetch strategy')
        // Re-evaluate prefetch strategy based on new connection
      })
    }
  }
}

/**
 * Manually trigger prefetch for a specific path
 */
export function manualPrefetch(path: string): Promise<void> {
  const config = routeConfigs.find(r => {
    if (r.path.endsWith('/')) {
      return path.startsWith(r.path)
    }
    return path === r.path || path.startsWith(r.path + '/')
  })
  
  if (!config) {
    return Promise.reject(new Error(`No prefetch config found for path: ${path}`))
  }
  
  return prefetchRoute(config)
}

/**
 * Prefetch critical routes on idle
 */
export function prefetchCriticalRoutes(): void {
  const criticalRoutes = routeConfigs.filter(r => 
    r.prefetchOn === 'visible' && 
    !r.path.includes('admin')
  )
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      criticalRoutes.forEach(config => {
        prefetchRoute(config).catch(console.warn)
      })
    }, { timeout: 5000 })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      criticalRoutes.forEach(config => {
        prefetchRoute(config).catch(console.warn)
      })
    }, 2000)
  }
}