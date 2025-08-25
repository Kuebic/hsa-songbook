# Foundation Phase 3A: Bundle Optimization & Code Splitting PRP

name: "Bundle Optimization & Code Splitting Implementation"
description: |
  Implement aggressive code splitting and bundle optimization to reduce main bundle size from 656KB to <500KB,
  achieving <3s initial load time on 4G networks while maintaining excellent developer experience.

---

## Goal

**Feature Goal**: Reduce main JavaScript bundle from 656KB to <500KB through strategic code splitting, lazy loading, and chunk optimization while maintaining application functionality and performance.

**Deliverable**: Optimized Vite configuration with advanced code splitting, lazy loaded routes and components, prefetching strategy, and bundle analysis reporting.

**Success Definition**: Main bundle <500KB, initial JS <200KB, FCP <1.8s on 4G, all routes lazy loaded except HomePage, bundle analysis integrated into CI.

## User Persona

**Target User**: Mobile users on slower networks (3G/4G) accessing the HSA Songbook

**Use Case**: Quick access to song lyrics and chord charts without waiting for large bundle downloads

**User Journey**: 
1. User opens app on mobile device with 4G connection
2. App loads critical UI immediately (<1s)
3. Core functionality available within 3s
4. Additional features load on-demand as user navigates

**Pain Points Addressed**: 
- 53% mobile abandonment rate for pages taking >3 seconds to load
- Unnecessary loading of admin/editor features for regular users
- Large initial bundle causing slow first paint

## Why

- **Performance Impact**: 24% bundle reduction directly improves mobile load times
- **User Retention**: Faster loads reduce bounce rate by 15-20%
- **Infrastructure Savings**: Reduced bandwidth costs from smaller bundles
- **SEO Benefits**: Better Core Web Vitals scores improve search rankings

## What

Implement multi-tier code splitting strategy with route-based, component-based, and library-based chunking. Optimize current lazy loading patterns and add intelligent prefetching for anticipated user navigation.

### Success Criteria

- [ ] Main bundle size reduced to <500KB (from 656KB)
- [ ] Initial JavaScript chunk <200KB
- [ ] FCP (First Contentful Paint) <1.8s on 4G
- [ ] All non-critical routes lazy loaded
- [ ] ChordSheetJS library loaded on-demand only
- [ ] Admin features isolated in separate chunks
- [ ] Bundle analysis automated in CI pipeline
- [ ] Zero regression in functionality

## All Needed Context

### Context Completeness Check

_This PRP contains all file paths, patterns, and implementation details needed for successful bundle optimization without prior knowledge of the codebase._

### Documentation & References

```yaml
- url: https://vitejs.dev/guide/build.html#chunking-strategy
  why: Official Vite documentation for rollup output configuration and manualChunks
  critical: Proper syntax for Rollup 4.x manual chunks configuration

- url: https://web.dev/articles/code-splitting-with-dynamic-imports-in-nextjs
  why: Best practices for dynamic imports and code splitting patterns
  critical: Avoid waterfall loading with proper prefetching strategies

- url: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload
  why: Resource hints for critical resource loading
  critical: Difference between preload, prefetch, and modulepreload

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/vite.config.ts
  why: Current build configuration with basic vendor chunking
  pattern: Existing manualChunks pattern for react-vendor, monitoring, supabase
  gotcha: Must maintain existing alias configuration and PWA plugin settings

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/app/App.tsx
  why: Current lazy loading implementation for routes
  pattern: lazy() with .then() pattern for named exports
  gotcha: HomePage is eagerly loaded by design, don't change this

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/pwa/components/LazyRouteWrapper.tsx
  why: Existing error boundary for chunk loading failures
  pattern: Handles "Loading chunk" errors with offline fallback
  gotcha: Must maintain chunk error recovery mechanism

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/features/arrangements/utils/chordSheetLazyLoader.ts
  why: Advanced lazy loading pattern for ChordSheetJS library
  pattern: Promise memoization and caching for library loading
  gotcha: Already implements prefetching with webpack magic comments

- docfile: PRPs/ai_docs/vite-code-splitting-guide.md
  why: Comprehensive guide for advanced Vite code splitting techniques
  section: Manual Chunks Configuration
```

### Current Codebase tree

```bash
hsa-songbook/
├── vite.config.ts                # Basic vendor chunking, needs optimization
├── src/
│   ├── app/
│   │   ├── App.tsx              # Route lazy loading (except HomePage)
│   │   └── pages/
│   │       ├── HomePage.tsx     # Eagerly loaded (keep as-is)
│   │       ├── SearchPage.tsx   # Lazy loaded
│   │       └── AdminDashboard.tsx # Lazy loaded
│   ├── features/
│   │   ├── arrangements/
│   │   │   ├── utils/
│   │   │   │   └── chordSheetLazyLoader.ts # ChordSheetJS lazy loading
│   │   │   └── components/
│   │   │       └── ChordSheetLazyComponents.tsx # Component lazy loading
│   │   └── pwa/
│   │       └── components/
│   │           └── LazyRouteWrapper.tsx # Chunk error handling
│   └── lib/
│       └── supabase.ts          # Heavy library, needs isolation
├── dist/
│   ├── assets/                  # Current chunks output
│   └── stats.html               # Bundle analysis visualization
└── package.json                 # analyze scripts configured
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── vite.config.ts                # MODIFIED: Advanced chunking strategy
├── src/
│   ├── app/
│   │   ├── App.tsx              # MODIFIED: Enhanced lazy loading
│   │   └── utils/
│   │       └── routePrefetch.ts # NEW: Route prefetching utilities
│   ├── features/
│   │   ├── arrangements/
│   │   │   └── components/
│   │   │       └── LazyChordEditor.tsx # NEW: Lazy wrapper for editor
│   │   └── shared/
│   │       └── utils/
│   │           └── chunkPreloader.ts # NEW: Chunk preloading strategy
│   └── config/
│       └── buildOptimization.ts # NEW: Centralized build config
├── scripts/
│   └── analyzeBundles.js       # NEW: CI bundle analysis script
└── .github/
    └── workflows/
        └── bundle-size.yml      # NEW: Bundle size monitoring
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: ChordSheetJS is 180KB minified - must be isolated
// Example: Never import directly in main bundle
// import ChordSheetJS from 'chordsheetjs' // ❌ WRONG
// const ChordSheetJS = await import('chordsheetjs') // ✅ CORRECT

// CRITICAL: CodeMirror requires all language modules loaded together
// Split as single 'editor-vendor' chunk, not individual language chunks

// CRITICAL: React 19.1 requires react-dom in same chunk as react
// Must keep react and react-dom together in react-vendor chunk

// CRITICAL: Supabase client must initialize early for auth
// Keep in separate chunk but preload on app start

// CRITICAL: PWA service worker registration must happen synchronously
// Don't lazy load PWA initialization code
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/config/buildOptimization.ts
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

// src/app/utils/routePrefetch.ts
export interface RouteConfig {
  path: string
  chunkName: string
  prefetchOn?: 'hover' | 'focus' | 'visible'
  dependencies?: string[] // Other chunks this route needs
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE src/config/buildOptimization.ts
  - IMPLEMENT: Centralized chunk strategy configuration
  - FOLLOW pattern: Modular configuration with type safety
  - PRIORITY: Define chunk priorities and size limits
  - EXPORTS: getChunkName(), manualChunks configuration
  - PLACEMENT: New config directory for build settings

Task 2: UPDATE vite.config.ts
  - IMPLEMENT: Advanced manualChunks configuration with size limits
  - FOLLOW pattern: Existing basic vendor chunking
  - ADD: rollupOptions.output.manualChunks function
  - ADD: chunkSizeWarningLimit: 200 (200KB warning threshold)
  - ADD: build.cssCodeSplit: true for CSS splitting
  - CRITICAL: Maintain PWA plugin configuration

Task 3: CREATE src/app/utils/routePrefetch.ts
  - IMPLEMENT: Intelligent route prefetching based on user behavior
  - METHODS: prefetchRoute(), setupPrefetchObserver()
  - PATTERN: IntersectionObserver for visible links
  - INTEGRATE: With React Router Link components
  - PLACEMENT: App utilities directory

Task 4: UPDATE src/app/App.tsx
  - MODIFY: Add prefetch hints to route configurations
  - ADD: Magic comments for webpack chunk names
  - IMPLEMENT: Resource hints in document head
  - MAINTAIN: HomePage eager loading
  - ADD: Chunk preloading for critical paths

Task 5: CREATE src/features/arrangements/components/LazyChordEditor.tsx
  - IMPLEMENT: Lazy wrapper for ChordProEditor component
  - PATTERN: Dynamic import with loading state
  - ADD: Skeleton loader during chunk load
  - ERROR: Handle chunk loading failures
  - INTEGRATE: With existing LazyRouteWrapper

Task 6: CREATE src/features/shared/utils/chunkPreloader.ts
  - IMPLEMENT: Strategic chunk preloading utilities
  - METHODS: preloadChunk(), warmCache()
  - TIMING: RequestIdleCallback for non-critical preloads
  - PRIORITY: Network-aware preloading (no preload on slow connections)
  - CACHE: Track loaded chunks to prevent duplicates

Task 7: CREATE scripts/analyzeBundles.js
  - IMPLEMENT: Automated bundle size analysis for CI
  - PARSE: dist/stats.html output
  - CHECK: Bundle size thresholds
  - REPORT: Size changes vs baseline
  - EXIT: Non-zero on threshold violations

Task 8: CREATE .github/workflows/bundle-size.yml
  - IMPLEMENT: GitHub Action for bundle monitoring
  - TRIGGER: On pull requests
  - RUN: Build and analyze bundles
  - COMMENT: PR with size impact report
  - FAIL: If size increases >5% or exceeds limits
```

### Implementation Patterns & Key Details

```typescript
// src/config/buildOptimization.ts
export const chunkStrategies: ChunkStrategy[] = [
  {
    name: 'react-vendor',
    test: (id) => id.includes('react') || id.includes('react-dom'),
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
  // Feature-based chunks
  {
    name: 'admin',
    test: (id) => id.includes('/admin/') || id.includes('/moderation/'),
    priority: 70,
    minSize: 30000,
    maxSize: 150000
  }
]

export function manualChunks(id: string): string | undefined {
  // CRITICAL: Check module ID is from node_modules
  if (!id.includes('node_modules')) {
    // Feature-based chunking for app code
    if (id.includes('/features/arrangements/')) return 'arrangements'
    if (id.includes('/features/admin/')) return 'admin'
    if (id.includes('/features/setlists/')) return 'setlists'
    return undefined // Let Rollup handle other app code
  }

  // Apply strategies in priority order
  for (const strategy of chunkStrategies.sort((a, b) => b.priority - a.priority)) {
    if (strategy.test(id)) {
      return strategy.name
    }
  }

  // Default vendor chunk for remaining node_modules
  return 'vendor'
}

// vite.config.ts integration
import { manualChunks } from './src/config/buildOptimization'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks,
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop()?.split('.')[0] 
            : 'chunk'
          return `assets/js/${facadeModuleId}-[hash].js`
        },
        // Optimize entry file names
        entryFileNames: 'assets/js/[name]-[hash].js',
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop()
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (extType === 'css') {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      },
      // Tree-shake unused code
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    },
    // Set warning threshold
    chunkSizeWarningLimit: 200, // 200KB
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize deps
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      format: {
        comments: false
      }
    },
    // Source maps for production debugging
    sourcemap: true
  }
})

// src/app/utils/routePrefetch.ts
const routeConfigs: RouteConfig[] = [
  { 
    path: '/search', 
    chunkName: 'SearchPage',
    prefetchOn: 'visible',
    dependencies: [] 
  },
  { 
    path: '/arrangements/edit', 
    chunkName: 'ChordEditingPage',
    prefetchOn: 'hover',
    dependencies: ['editor-vendor', 'chord-lib'] 
  },
  { 
    path: '/admin', 
    chunkName: 'AdminDashboard',
    prefetchOn: 'hover', // Only prefetch on intentional hover
    dependencies: ['admin'] 
  }
]

export function setupPrefetchObserver() {
  // PATTERN: Use IntersectionObserver for visible link prefetching
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement
          const path = link.pathname
          const config = routeConfigs.find(r => path.startsWith(r.path))
          
          if (config?.prefetchOn === 'visible') {
            prefetchRoute(config)
            observer.unobserve(link)
          }
        }
      })
    },
    { rootMargin: '50px' } // Start prefetching 50px before visible
  )

  // Observe all route links
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    observer.observe(link)
  })
}

export async function prefetchRoute(config: RouteConfig) {
  // Check if already loaded
  if (window.__loadedChunks?.has(config.chunkName)) return

  // Network-aware prefetching
  const connection = (navigator as any).connection
  if (connection?.saveData || connection?.effectiveType === 'slow-2g') {
    return // Skip prefetch on slow connections
  }

  try {
    // Prefetch dependencies first
    await Promise.all(
      config.dependencies.map(dep => prefetchChunk(dep))
    )
    
    // Then prefetch the route chunk
    await prefetchChunk(config.chunkName)
    
    // Track loaded chunks
    window.__loadedChunks = window.__loadedChunks || new Set()
    window.__loadedChunks.add(config.chunkName)
  } catch (error) {
    console.warn(`Failed to prefetch route ${config.path}:`, error)
  }
}

function prefetchChunk(chunkName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'script'
    link.href = `/assets/js/${chunkName}-*.js` // Pattern matching
    link.onload = () => resolve()
    link.onerror = reject
    document.head.appendChild(link)
  })
}
```

### Integration Points

```yaml
BUILD:
  - config: "vite.config.ts"
  - command: "npm run build"
  - output: "dist/assets/js/*.js with optimized chunks"

ROUTING:
  - update: "src/app/App.tsx"
  - pattern: "const Page = lazy(() => import(/* webpackChunkName: 'page' */ './pages/Page'))"
  - prefetch: "setupPrefetchObserver() in useEffect"

MONITORING:
  - script: "scripts/analyzeBundles.js"
  - ci: ".github/workflows/bundle-size.yml"
  - command: "npm run analyze"

HTML:
  - index: "index.html"
  - add: "<link rel='modulepreload' href='/assets/js/react-vendor-*.js'>"
  - add: "<link rel='preload' as='style' href='/assets/css/index-*.css'>"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Verify TypeScript compilation
npm run build
# Expected: Build completes without errors

# Check bundle output structure
ls -la dist/assets/js/
# Expected: Multiple chunk files with descriptive names

# Verify no import errors
grep -r "import.*from.*chordsheetjs" src/ --include="*.tsx" --include="*.ts" | grep -v "await import"
# Expected: No direct imports of heavy libraries

# ESLint check
npm run lint
# Expected: No errors
```

### Level 2: Bundle Analysis (Size Validation)

```bash
# Generate bundle analysis
npm run build
npm run analyze

# Check main bundle size
du -h dist/assets/js/index-*.js
# Expected: < 200KB

# Check total initial JS
find dist/assets/js -name "*.js" -exec du -h {} \; | grep -E "(index|react-vendor)" | awk '{sum+=$1} END {print sum "KB"}'
# Expected: < 350KB combined

# Verify chunk sizes
node scripts/analyzeBundles.js
# Expected: All chunks within defined thresholds

# Check CSS splitting
ls -la dist/assets/css/
# Expected: Multiple CSS files, not single bundle
```

### Level 3: Performance Testing (Runtime Validation)

```bash
# Start production preview
npm run build && npm run preview &
PREVIEW_PID=$!
sleep 3

# Test with Lighthouse CI
npx lighthouse http://localhost:4173 \
  --only-categories=performance \
  --throttling.cpuSlowdownMultiplier=4 \
  --throttling.requestLatencyMs=150 \
  --throttling.downloadThroughputKbps=1638 \
  --output=json \
  --output-path=./lighthouse-report.json

# Check FCP metric
cat lighthouse-report.json | jq '.audits["first-contentful-paint"].numericValue'
# Expected: < 1800 (1.8s)

# Check bundle loading waterfall
cat lighthouse-report.json | jq '.audits["network-requests"].details.items[] | select(.resourceType == "Script") | {url: .url, duration: .endTime}'
# Expected: No blocking scripts, parallel chunk loading

# Clean up
kill $PREVIEW_PID
```

### Level 4: Feature-Specific Validation

```bash
# Test lazy loading behavior
npm run dev &
DEV_PID=$!
sleep 3

# Monitor network requests on navigation
# Open Chrome DevTools -> Network tab
# Navigate to /arrangements/edit
# Expected: editor-vendor and chord-lib chunks load on demand

# Test prefetching
# Hover over admin link
# Expected: admin chunk starts prefetching

# Test chunk error recovery
# Simulate network failure in DevTools
# Navigate to lazy route
# Expected: Error boundary shows with recovery option

# Test offline behavior
# Enable offline mode in DevTools
# Navigate app
# Expected: Cached routes work, new chunks show offline message

kill $DEV_PID

# CI validation
# Create test PR with bundle changes
# Expected: Bundle size comment added to PR
# Expected: Build fails if size exceeds limits
```

## Final Validation Checklist

### Technical Validation

- [ ] Build completes without errors: `npm run build`
- [ ] No TypeScript errors: `npm run build`
- [ ] ESLint passes: `npm run lint`
- [ ] All tests pass: `npm run test`

### Bundle Size Validation

- [ ] Main bundle < 500KB total
- [ ] Initial JS chunk < 200KB
- [ ] React vendor chunk < 150KB
- [ ] No single chunk > 250KB
- [ ] CSS properly split by route
- [ ] Bundle analysis shows expected chunk structure

### Performance Validation

- [ ] FCP < 1.8s on simulated 4G
- [ ] LCP < 2.5s on simulated 4G
- [ ] No render-blocking resources
- [ ] Lighthouse performance score > 90
- [ ] Prefetching works for visible links

### Feature Validation

- [ ] All routes load correctly
- [ ] Lazy routes load on demand only
- [ ] Admin features isolated from main bundle
- [ ] ChordSheetJS loads only when needed
- [ ] Chunk loading errors handled gracefully
- [ ] Offline fallbacks work correctly

### Code Quality Validation

- [ ] Follows existing lazy loading patterns
- [ ] Chunk configuration is maintainable
- [ ] No hardcoded chunk paths
- [ ] Prefetch strategy is network-aware
- [ ] Bundle monitoring integrated in CI

---

## Anti-Patterns to Avoid

- ❌ Don't split chunks too granularly (causes waterfall loading)
- ❌ Don't prefetch everything (wastes bandwidth)
- ❌ Don't ignore chunk loading errors
- ❌ Don't hardcode chunk URLs
- ❌ Don't lazy load critical path components
- ❌ Don't import heavy libraries directly
- ❌ Don't mix ES modules with CommonJS
- ❌ Don't skip bundle analysis in CI