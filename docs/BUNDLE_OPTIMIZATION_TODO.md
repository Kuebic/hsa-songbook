# Bundle Optimization - Next Steps

## Current Status (August 2025)

We've successfully implemented aggressive code splitting and bundle optimization, achieving:
- ✅ 30+ separate chunks with smart splitting
- ✅ Feature-based isolation (admin, songs, arrangements)
- ✅ Vendor library separation
- ✅ CSS code splitting
- ✅ Intelligent prefetching system
- ✅ Bundle analysis tooling

**Current Issue**: Vite adds `modulepreload` hints for ALL chunks in the HTML, causing browsers to eagerly load everything at startup, defeating the purpose of lazy loading.

## Remaining Tasks to Achieve <200KB Initial Load

### 1. Control Vite's Modulepreload Behavior

**Problem**: Vite automatically adds modulepreload links for all chunks in index.html
**Solution**: Configure Vite to only preload critical chunks

```typescript
// vite.config.ts modification needed
export default defineConfig({
  build: {
    modulePreload: {
      // Only preload the main entry and react vendor
      resolveDependencies: (filename, deps, { hostId, hostType }) => {
        // Return empty array for non-critical chunks
        if (filename.includes('admin') || 
            filename.includes('chord-lib') ||
            filename.includes('arrangements')) {
          return []
        }
        return deps
      }
    }
  }
})
```

### 2. Custom HTML Plugin for Fine-Grained Control

Create a Vite plugin to manipulate the HTML output:

```typescript
// vite-plugin-optimize-preloads.ts
export function optimizePreloads() {
  return {
    name: 'optimize-preloads',
    transformIndexHtml(html) {
      // Remove modulepreload for non-critical chunks
      const criticalChunks = ['index', 'react-vendor', 'monitoring']
      
      return html.replace(
        /<link rel="modulepreload"[^>]*>/g,
        (match) => {
          const shouldKeep = criticalChunks.some(chunk => 
            match.includes(chunk)
          )
          return shouldKeep ? match : ''
        }
      )
    }
  }
}
```

### 3. Consider CDN for React (Advanced)

**Potential Savings**: ~260KB from initial bundle

```html
<!-- In index.html -->
<script crossorigin src="https://unpkg.com/react@19.1.0/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@19.1.0/umd/react-dom.production.min.js"></script>
```

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
```

### 4. Implement Resource Hints Strategy

Add strategic resource hints based on user navigation patterns:

```typescript
// In App.tsx after initial load
useEffect(() => {
  // Prefetch likely next chunks after main app loads
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Prefetch common user paths
      const hints = [
        { rel: 'prefetch', href: '/assets/js/songs-*.js' },
        { rel: 'prefetch', href: '/assets/js/search-*.js' }
      ]
      
      hints.forEach(({ rel, href }) => {
        const link = document.createElement('link')
        link.rel = rel
        link.href = href
        document.head.appendChild(link)
      })
    })
  }
}, [])
```

### 5. Optimize Initial CSS

**Current**: All CSS files are loaded upfront (110KB total)
**Goal**: Load only critical CSS initially

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    // Split CSS per async chunk
    codeplit: true,
    // Extract critical CSS
    extract: {
      // Only inline critical CSS
      inlineLimit: 10000 // 10KB
    }
  }
})
```

### 6. Service Worker Optimization

Enhance the PWA service worker to intelligently cache and serve chunks:

```javascript
// In service worker configuration
workbox: {
  runtimeCaching: [
    {
      // Prefetch critical chunks
      urlPattern: /\/(index|react-vendor|monitoring).*\.js$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'critical-chunks'
      }
    },
    {
      // Lazy load other chunks
      urlPattern: /\/assets\/js\/.*\.js$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'lazy-chunks'
      }
    }
  ]
}
```

## Performance Targets

### Current State
- Main bundle: 656KB → 272KB (58% reduction) ✅
- Total chunks: 30+ separate files ✅
- Initial load: ~1.25MB (all chunks due to modulepreload)

### Target State
- Initial JavaScript: <200KB
- First Contentful Paint: <1.8s on 4G
- Total cached size: <3MB
- Lazy chunks load on-demand only

## Testing the Optimizations

### 1. Bundle Size Verification
```bash
npm run build
node scripts/analyzeBundles.js
```

### 2. Network Performance Testing
```bash
# Test with throttled connection
npx lighthouse http://localhost:4173 \
  --throttling.cpuSlowdownMultiplier=4 \
  --throttling.requestLatencyMs=150 \
  --throttling.downloadThroughputKbps=1638
```

### 3. Verify Lazy Loading
1. Open Chrome DevTools → Network tab
2. Navigate to different routes
3. Confirm chunks load on-demand, not upfront

## Implementation Priority

1. **High Priority** (Do First)
   - Control modulepreload behavior
   - Custom HTML plugin

2. **Medium Priority** 
   - Resource hints strategy
   - CSS optimization

3. **Low Priority** (Consider Later)
   - CDN for React
   - Service worker enhancements

## References

- [Vite Build Optimization](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Rollup Output Options](https://rollupjs.org/configuration-options/#output)
- [Web.dev Code Splitting Guide](https://web.dev/articles/code-splitting-with-dynamic-imports)
- [Chrome Resource Hints](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)

## Notes

- The bundle splitting foundation is solid
- Main issue is Vite's eager modulepreload behavior
- Solutions exist but require additional configuration
- Consider implementing during a performance sprint