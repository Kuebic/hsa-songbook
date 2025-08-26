/**
 * @file buildOptimization.ts
 * @description Centralized build optimization configuration for Vite
 * Implements aggressive code splitting strategy to reduce bundle size
 */

export interface ChunkStrategy {
  name: string
  test: (id: string) => boolean
  priority: number // Higher priority chunks evaluated first
  minSize: number // Minimum size for chunk creation
  maxSize: number // Maximum size before splitting
}

export interface PrefetchStrategy {
  route: string
  chunks: string[] // Chunk names to prefetch
  trigger: 'hover' | 'visible' | 'idle' | 'immediate'
  delay?: number // Delay in ms for idle prefetching
}

// Define chunk strategies with priority order
export const chunkStrategies: ChunkStrategy[] = [
  {
    name: 'react-vendor',
    test: (id) => id.includes('react') || id.includes('react-dom') || id.includes('react-router'),
    priority: 100,
    minSize: 50000,
    maxSize: 200000
  },
  {
    name: 'chord-lib',
    test: (id) => id.includes('chordsheetjs'),
    priority: 90,
    minSize: 100000,
    maxSize: 250000
  },
  {
    name: 'editor-vendor',
    test: (id) => id.includes('@codemirror') || id.includes('@uiw/react-codemirror'),
    priority: 80,
    minSize: 80000,
    maxSize: 200000
  },
  {
    name: 'supabase-vendor',
    test: (id) => id.includes('@supabase/supabase-js') || id.includes('@supabase/auth'),
    priority: 75,
    minSize: 30000,
    maxSize: 150000
  },
  {
    name: 'monitoring-vendor',
    test: (id) => id.includes('web-vitals') || id.includes('react-error-boundary'),
    priority: 70,
    minSize: 10000,
    maxSize: 50000
  },
  {
    name: 'ui-vendor',
    test: (id) => id.includes('@radix-ui') || id.includes('@headlessui') || id.includes('tailwind'),
    priority: 65,
    minSize: 20000,
    maxSize: 100000
  },
  {
    name: 'auth-vendor',
    test: (id) => id.includes('jwt-decode') || id.includes('@supabase/auth'),
    priority: 60,
    minSize: 30000,
    maxSize: 150000
  },
  {
    name: 'utils-vendor',
    test: (id) => id.includes('lodash') || id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance'),
    priority: 50,
    minSize: 10000,
    maxSize: 80000
  },
  {
    name: 'storage-vendor',
    test: (id) => id.includes('idb') || id.includes('lz-string'),
    priority: 45,
    minSize: 10000,
    maxSize: 50000
  },
  {
    name: 'validation-vendor',
    test: (id) => id.includes('zod') || id.includes('yup'),
    priority: 40,
    minSize: 10000,
    maxSize: 50000
  }
]

/**
 * Manual chunks configuration for Vite/Rollup
 * Determines which chunk a module should be placed in
 */
export function manualChunks(id: string): string | undefined {
  // Skip non-node_modules for feature-based chunking
  if (!id.includes('node_modules')) {
    // Feature-based chunking for app code
    if (id.includes('/features/arrangements/')) return 'arrangements'
    if (id.includes('/features/admin/')) return 'admin'
    if (id.includes('/features/auth/')) return 'auth'
    if (id.includes('/features/monitoring/')) return 'monitoring'
    if (id.includes('/features/multilingual/')) return 'multilingual'
    if (id.includes('/features/pwa/')) return 'pwa'
    if (id.includes('/features/responsive/')) return 'responsive'
    if (id.includes('/features/search/')) return 'search'
    if (id.includes('/features/setlists/')) return 'setlists'
    if (id.includes('/features/songs/')) return 'songs'
    
    // Shared components and utilities
    if (id.includes('/shared/components/')) return 'shared-ui'
    if (id.includes('/shared/')) return 'shared'
    
    return undefined // Let Rollup handle other app code
  }

  // Apply strategies in priority order for node_modules
  const sortedStrategies = [...chunkStrategies].sort((a, b) => b.priority - a.priority)
  
  for (const strategy of sortedStrategies) {
    if (strategy.test(id)) {
      return strategy.name
    }
  }

  // Default vendor chunk for remaining node_modules
  return 'vendor'
}

/**
 * Get optimized chunk file name based on content
 */
export function getChunkFileName(chunkInfo: { facadeModuleId?: string | null; name?: string }): string {
  const facadeModuleId = chunkInfo.facadeModuleId 
    ? chunkInfo.facadeModuleId.split('/').pop()?.split('.')[0] 
    : chunkInfo.name || 'chunk'
  
  // Use descriptive names for feature chunks
  if (facadeModuleId?.includes('Page')) {
    return `assets/js/pages/${facadeModuleId}-[hash].js`
  }
  
  if (facadeModuleId?.includes('vendor')) {
    return `assets/js/vendors/${facadeModuleId}-[hash].js`
  }
  
  if (facadeModuleId?.includes('features')) {
    return `assets/js/features/${facadeModuleId}-[hash].js`
  }
  
  return `assets/js/${facadeModuleId}-[hash].js`
}

/**
 * Asset file name configuration based on type
 */
export function getAssetFileName(assetInfo: { name?: string }): string {
  const extType = assetInfo.name?.split('.').pop()
  
  // Images
  if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(extType || '')) {
    return `assets/images/[name]-[hash][extname]`
  }
  
  // Fonts
  if (/woff2?|ttf|otf|eot/i.test(extType || '')) {
    return `assets/fonts/[name]-[hash][extname]`
  }
  
  // CSS
  if (extType === 'css') {
    return `assets/css/[name]-[hash][extname]`
  }
  
  // Other assets
  return `assets/[name]-[hash][extname]`
}

/**
 * Prefetch strategies for routes
 */
export const prefetchStrategies: PrefetchStrategy[] = [
  {
    route: '/search',
    chunks: ['search', 'shared-ui'],
    trigger: 'visible'
  },
  {
    route: '/songs',
    chunks: ['songs', 'shared-ui'],
    trigger: 'visible'
  },
  {
    route: '/arrangements/edit',
    chunks: ['arrangements', 'editor-vendor', 'chord-lib'],
    trigger: 'hover'
  },
  {
    route: '/setlists',
    chunks: ['setlists', 'shared-ui'],
    trigger: 'visible'
  },
  {
    route: '/admin',
    chunks: ['admin', 'auth'],
    trigger: 'hover' // Only prefetch on intentional hover
  },
  {
    route: '/moderation',
    chunks: ['admin', 'auth'],
    trigger: 'hover'
  }
]

/**
 * Terser options for production build
 */
export const terserOptions = {
  compress: {
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.debug'],
    passes: 2,
    ecma: 2020 as const,
    module: true,
    toplevel: true,
    unsafe_arrows: true
  },
  mangle: {
    safari10: true,
    properties: {
      regex: /^_/
    }
  },
  format: {
    comments: false,
    ecma: 2020 as const
  }
}

/**
 * Tree-shaking configuration
 */
export const treeshakeOptions = {
  moduleSideEffects: false,
  propertyReadSideEffects: false,
  tryCatchDeoptimization: false
}

/**
 * Common JS optimization options
 */
export const commonjsOptions = {
  transformMixedEsModules: true,
  defaultIsModuleExports: true,
  strictRequires: true,
  // Ensure React is properly transformed
  esmExternals: true
}

/**
 * Check if a module should be excluded from optimization
 */
export function shouldExcludeFromOptimization(id: string): boolean {
  // Don't optimize PWA service worker files
  if (id.includes('workbox') || id.includes('sw.js')) {
    return true
  }
  
  // Don't optimize certain critical runtime modules
  if (id.includes('regenerator-runtime') || id.includes('core-js')) {
    return true
  }
  
  return false
}

/**
 * Get chunk size warning limit based on chunk name
 */
export function getChunkSizeLimit(chunkName: string): number {
  // Critical vendor chunks can be slightly larger
  if (chunkName === 'react-vendor') return 200
  if (chunkName === 'chord-lib') return 250
  if (chunkName === 'editor-vendor') return 200
  
  // Feature chunks should be smaller
  if (chunkName.includes('admin')) return 100
  if (chunkName.includes('auth')) return 100
  
  // Default warning at 150KB
  return 150
}

/**
 * Rollup external configuration for CDN libraries (if needed)
 */
export const externalLibraries: string[] = [
  // Currently not using CDN for any libraries
  // Add libraries here if you want to load them from CDN
]

/**
 * Vite optimize deps configuration
 * Ensure React is properly bundled to avoid Component undefined errors
 */
export const optimizeDeps = {
  include: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-router-dom',
    '@supabase/supabase-js'
  ],
  exclude: [
    '@vite-pwa/assets-generator'
  ],
  esbuildOptions: {
    target: 'es2020'
  }
}