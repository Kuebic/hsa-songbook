name: "PWA Offline-Capable Implementation for HSA Songbook"
description: |
  Transform HSA Songbook into a true offline-capable Progressive Web App where the entire site can be navigated after one online session

---

## Goal

**Feature Goal**: Transform the HSA Songbook React app into a fully offline-capable Progressive Web Application with service worker caching, background sync, and installability

**Deliverable**: Complete PWA implementation with service worker, manifest, offline fallbacks, and update notifications

**Success Definition**: Users can install the app, browse all previously viewed content offline, and receive seamless updates when reconnected

## User Persona

**Target User**: Musicians and worship leaders who need reliable access to chord charts regardless of connectivity

**Use Case**: Accessing songbook during performances in venues with poor/no internet, mobile usage, quick reference during practice

**User Journey**: 
1. User visits site once online → Content cached automatically
2. Installs PWA to device home screen 
3. Opens app offline → All previously viewed songs available
4. Creates/edits setlists offline → Syncs when reconnected
5. Receives update notifications for new app versions

**Pain Points Addressed**: 
- No internet in performance venues
- Slow/unreliable mobile connections
- Need for instant access to chord charts
- Data usage concerns on mobile

## Why

- **Reliability**: Musicians need guaranteed access during performances
- **Performance**: Instant loading from cache improves user experience
- **Mobile-first**: Native app-like experience without app store distribution
- **Engagement**: Install prompts and push notifications increase retention
- **Offline-first**: Aligns with mobile usage patterns and unreliable connectivity

## What

Transform the existing React/Vite application into a PWA with:
- Complete offline functionality after first visit
- Background sync for offline data submission
- App installation with proper icons/splash screens  
- Update notifications with user control
- Optimized caching strategies per resource type

### Success Criteria

- [ ] PWA installable on all major browsers/platforms
- [ ] Lighthouse PWA audit score > 90
- [ ] All static assets cached and available offline
- [ ] API responses cached with smart invalidation
- [ ] Offline fallback pages for uncached routes
- [ ] Background sync for offline setlist changes
- [ ] Update prompts with skip/refresh options
- [ ] < 3s time-to-interactive on repeat visits

## All Needed Context

### Context Completeness Check

_This PRP contains everything needed for someone unfamiliar with PWAs or this codebase to implement a production-ready offline-capable Progressive Web App._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://vite-pwa-org.netlify.app/guide/
  why: Official Vite PWA plugin documentation with configuration examples
  critical: registerType options, workbox configuration, manifest generation

- url: https://developer.chrome.com/docs/workbox/
  why: Workbox documentation for caching strategies and modules
  critical: Runtime caching patterns, background sync, navigation preload

- url: https://web.dev/learn/pwa/
  why: Comprehensive PWA guide from Google
  critical: Service worker lifecycle, caching strategies, offline UX patterns

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/vite.config.ts
  why: Current Vite configuration to extend with PWA plugin
  pattern: Plugin integration, path aliases, proxy configuration
  gotcha: Preserve existing proxy settings for API calls

- file: /var/home/kenmen/code/src/github/Kuebic/hsa-songbook/src/app/App.tsx
  why: Main app component for PWA update prompt integration
  pattern: Component structure, routing setup, lazy loading
  gotcha: Maintain existing code splitting strategy

- docfile: PRPs/ai_docs/pwa_manifest_comprehensive_guide.md
  why: Detailed manifest configuration guide created during research
  section: Complete manifest specification and Vite integration

- url: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  why: MDN Service Worker API reference
  critical: Event types, cache API, fetch interception

- url: https://github.com/vite-pwa/vite-plugin-pwa
  why: Vite PWA plugin repository with examples
  critical: TypeScript configuration, development setup, common patterns
```

### Current Codebase tree

```bash
hsa-songbook/
├── src/
│   ├── app/
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── pages/           # Page components
│   ├── features/
│   │   ├── songs/          # Song-related features
│   │   ├── setlists/       # Setlist management (uses localStorage)
│   │   └── auth/           # Clerk authentication
│   ├── shared/
│   │   └── components/     # Shared components
│   └── assets/             # Static assets (react.svg)
├── public/
│   └── vite.svg            # Public assets
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies
└── index.html              # HTML entry point
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── src/
│   ├── app/
│   │   ├── App.tsx          # [MODIFY] Add PWA update prompt
│   │   └── main.tsx         # [MODIFY] Register service worker
│   ├── features/
│   │   └── pwa/
│   │       ├── components/
│   │       │   ├── InstallPrompt.tsx    # [NEW] PWA install UI
│   │       │   └── UpdatePrompt.tsx     # [NEW] Update notification UI
│   │       ├── hooks/
│   │       │   ├── useServiceWorker.ts  # [NEW] SW registration hook
│   │       │   └── useInstallPrompt.ts  # [NEW] Install prompt hook
│   │       └── utils/
│   │           └── offline.ts           # [NEW] Offline detection utilities
│   └── sw.ts                # [NEW] Custom service worker (if using injectManifest)
├── public/
│   ├── manifest.json        # [NEW] Web app manifest (auto-generated)
│   ├── offline.html         # [NEW] Offline fallback page
│   ├── pwa-192x192.png     # [NEW] PWA icon
│   ├── pwa-512x512.png     # [NEW] PWA icon
│   ├── apple-touch-icon.png # [NEW] iOS icon
│   └── maskable-icon.png   # [NEW] Maskable icon for Android
├── vite.config.ts          # [MODIFY] Add PWA plugin configuration
├── package.json            # [MODIFY] Add vite-plugin-pwa dependency
└── index.html              # [MODIFY] Add meta tags and theme color
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Service workers only work over HTTPS (or localhost for development)
// CRITICAL: Vite dev server requires devOptions.enabled: true for PWA testing
// CRITICAL: Service worker scope limited by its location - place at root
// CRITICAL: skipWaiting can cause version mismatch issues - handle carefully
// CRITICAL: Cache names must be versioned for proper cleanup
// CRITICAL: API calls through Vite proxy need special handling in SW
// GOTCHA: localStorage (used by setlists) works offline but not in service workers
// GOTCHA: Clerk auth tokens need special caching strategy
// GOTCHA: React 19 hydration - ensure offline HTML matches online render
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/features/pwa/types/pwa.types.ts
export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null
  updateAvailable: boolean
  offlineReady: boolean
  error: Error | null
}

export interface InstallPromptState {
  prompt: BeforeInstallPromptEvent | null
  isInstallable: boolean
  isInstalled: boolean
  platform: 'ios' | 'android' | 'desktop' | null
}

export interface CacheStrategy {
  cacheName: string
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate'
  expiration?: {
    maxEntries: number
    maxAgeSeconds: number
  }
}

// Virtual module types from vite-plugin-pwa
declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void]
    offlineReady: [boolean, (value: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: INSTALL vite-plugin-pwa and configure TypeScript
  - RUN: npm install -D vite-plugin-pwa @types/node
  - MODIFY: tsconfig.json - Add "vite-plugin-pwa/client" to compilerOptions.types
  - MODIFY: vite-env.d.ts - Add /// <reference types="vite-plugin-pwa/client" />
  - FOLLOW: PRPs/ai_docs/pwa_manifest_comprehensive_guide.md for TypeScript setup
  - VALIDATE: npx tsc --noEmit should pass

Task 2: CREATE public/icons and offline assets
  - CREATE: public/pwa-192x192.png (192x192 app icon)
  - CREATE: public/pwa-512x512.png (512x512 app icon)  
  - CREATE: public/apple-touch-icon.png (180x180 iOS icon)
  - CREATE: public/maskable-icon-512x512.png (512x512 with safe zone)
  - CREATE: public/offline.html (static offline fallback page)
  - TOOLS: Use https://maskable.app/editor to create maskable icons
  - PATTERN: Icons should match existing brand/design
  - VALIDATE: All images load correctly in browser

Task 3: CONFIGURE vite.config.ts with PWA plugin
  - MODIFY: vite.config.ts - Import and configure VitePWA plugin
  - IMPLEMENT: Manifest configuration with app metadata
  - IMPLEMENT: Workbox configuration with caching strategies
  - IMPLEMENT: Runtime caching for API endpoints (/api/v1/*)
  - FOLLOW pattern: Complete configuration from research findings
  - VALIDATE: npm run build generates SW and manifest files

Task 4: CREATE src/features/pwa/hooks/useServiceWorker.ts
  - IMPLEMENT: Service worker registration hook using virtual:pwa-register/react
  - HANDLE: Registration, update detection, offline ready states
  - FOLLOW pattern: React 19 hooks with proper TypeScript typing
  - INCLUDE: Error handling and retry logic
  - VALIDATE: Hook properly typed with no TS errors

Task 5: CREATE src/features/pwa/components/UpdatePrompt.tsx
  - IMPLEMENT: Update notification UI component
  - USE: useServiceWorker hook from Task 4
  - STYLE: Match existing app design system
  - INCLUDE: Refresh and dismiss actions
  - VALIDATE: Component renders without hydration issues

Task 6: CREATE src/features/pwa/components/InstallPrompt.tsx
  - IMPLEMENT: PWA install prompt UI for all platforms
  - DETECT: Platform (iOS, Android, desktop) for specific instructions
  - HANDLE: beforeinstallprompt event and manual iOS instructions
  - STYLE: Non-intrusive banner matching app design
  - VALIDATE: Shows on supported browsers when not installed

Task 7: MODIFY src/app/App.tsx to integrate PWA components
  - IMPORT: UpdatePrompt and InstallPrompt components
  - ADD: Components to app layout (consider toast/banner positioning)
  - MAINTAIN: Existing routing and lazy loading
  - VALIDATE: No layout shifts or rendering issues

Task 8: MODIFY index.html with PWA meta tags
  - ADD: theme-color meta tag matching app theme
  - ADD: apple-mobile-web-app-capable meta tag
  - ADD: apple-mobile-web-app-status-bar-style
  - ADD: manifest link (auto-injected by plugin)
  - VALIDATE: Lighthouse PWA audit improvements

Task 9: IMPLEMENT offline detection and UI indicators
  - CREATE: src/features/pwa/utils/offline.ts with online/offline detection
  - CREATE: OfflineIndicator component for connection status
  - MODIFY: API service layer to handle offline gracefully
  - IMPLEMENT: Queue for offline actions (setlist changes)
  - VALIDATE: Proper offline behavior without errors

Task 10: OPTIMIZE caching strategies for specific features
  - CONFIGURE: Cache-first for songs/arrangements (static content)
  - CONFIGURE: Network-first for user data and auth
  - CONFIGURE: Stale-while-revalidate for setlists
  - IMPLEMENT: Background sync for offline setlist updates
  - VALIDATE: Each resource type cached appropriately

Task 11: CREATE comprehensive offline fallbacks
  - ENHANCE: offline.html with better UX and cached resources list
  - IMPLEMENT: Fallback responses for different resource types
  - ADD: Offline pages for each major route
  - VALIDATE: Graceful degradation when offline

Task 12: TEST and optimize PWA features
  - TEST: Installation on Chrome, Firefox, Safari, Edge
  - TEST: Offline functionality for all routes
  - TEST: Update flow with version changes
  - OPTIMIZE: Precache list size and strategies
  - VALIDATE: Lighthouse score > 90 for PWA
```

### Implementation Patterns & Key Details

```typescript
// vite.config.ts - Complete PWA configuration
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'fonts/**/*'],
      manifest: {
        name: 'HSA Songbook',
        short_name: 'Songbook',
        description: 'Offline-capable chord charts and setlists',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // API calls - network first with offline fallback
            urlPattern: /^\/api\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              backgroundSync: {
                name: 'api-sync',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          },
          {
            // Songs and arrangements - cache first (static content)
            urlPattern: /^\/api\/v1\/(songs|arrangements)\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'songs-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Images and assets
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true, // Enable in dev for testing
        type: 'module'
      }
    })
  ]
})

// src/features/pwa/hooks/useServiceWorker.ts
import { useRegisterSW } from 'virtual:pwa-register/react'

export function useServiceWorker() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      r && setInterval(() => r.update(), 60 * 60 * 1000)
    },
    onRegisterError(error) {
      console.error('SW registration failed:', error)
    }
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return {
    offlineReady,
    needRefresh,
    updateServiceWorker,
    close
  }
}

// src/features/pwa/components/UpdatePrompt.tsx
export function UpdatePrompt() {
  const { needRefresh, updateServiceWorker, close } = useServiceWorker()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm">
      <p className="mb-3">New version available!</p>
      <div className="flex gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Update
        </button>
        <button
          onClick={close}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Later
        </button>
      </div>
    </div>
  )
}

// Platform detection for install prompt
function getPlatform(): 'ios' | 'android' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios'
  if (/android/.test(userAgent)) return 'android'
  return 'desktop'
}
```

### Integration Points

```yaml
DATABASE:
  - No database changes required
  - localStorage continues to work offline for setlists
  - Consider IndexedDB for larger offline data in future

CONFIG:
  - add to: .env.local (if needed for PWA features)
  - PUBLIC_URL for manifest start_url if not root
  - API_URL for proper cache key generation

ROUTES:
  - All existing routes work offline after caching
  - Add /offline fallback route
  - Service worker intercepts all navigation

API:
  - Existing /api/v1/* endpoints cached per strategy
  - Background sync for failed POST/PUT requests
  - Clerk webhook endpoint excluded from caching
```

## Validation Loop

### Level 1: Syntax & Type Checking

```bash
# TypeScript validation
npx tsc --noEmit

# Linting
npm run lint

# Build validation (generates SW and manifest)
npm run build

# Check generated files
ls -la dist/sw.js dist/manifest.webmanifest

# Expected: Zero errors, SW and manifest files generated
```

### Level 2: PWA Feature Testing

```bash
# Start dev server with PWA enabled
npm run dev

# Check service worker registration
# Open Chrome DevTools > Application > Service Workers
# Expected: Service worker registered and active

# Check manifest
# DevTools > Application > Manifest
# Expected: Manifest loaded with all properties

# Test offline mode
# DevTools > Network > Offline checkbox
# Navigate site - should work offline

# Check caching
# DevTools > Application > Cache Storage
# Expected: Multiple caches with cached resources
```

### Level 3: Lighthouse PWA Audit

```bash
# Build and preview production
npm run build
npm run preview

# Run Lighthouse audit
# Chrome DevTools > Lighthouse > PWA category
# Expected: Score > 90

# Specific checks:
# - Installable
# - PWA optimized
# - Offline works
# - HTTPS (in production)
```

### Level 4: Cross-Platform Testing

```bash
# Desktop Chrome/Edge
# - Install prompt appears
# - App installs to desktop
# - Opens in standalone window

# Mobile Chrome (Android)
# - Add to Home Screen prompt
# - Splash screen on launch
# - Standalone display mode

# Safari (iOS)
# - Manual Add to Home Screen
# - apple-touch-icon displays
# - Status bar styling works

# Firefox
# - Basic PWA features work
# - Service worker functions

# Test update flow
# 1. Make code change
# 2. Build new version
# 3. Deploy/serve
# 4. Visit app - update prompt should appear
```

### Level 5: Performance & Offline Testing

```bash
# Network throttling test
# DevTools > Network > Slow 3G
# Expected: App loads from cache quickly

# Complete offline test
# 1. Visit all main pages online
# 2. Go offline
# 3. Close and reopen app
# 4. Navigate all pages
# Expected: All work offline

# Background sync test
# 1. Go offline
# 2. Make setlist changes
# 3. Go online
# Expected: Changes sync automatically

# Cache size validation
# DevTools > Application > Storage
# Expected: Reasonable cache size (<50MB)
```

## Final Validation Checklist

### Technical Validation

- [ ] TypeScript compilation successful
- [ ] No linting errors
- [ ] Production build completes
- [ ] Service worker generates and registers
- [ ] Manifest file valid and complete
- [ ] All icons present and correct sizes

### PWA Feature Validation

- [ ] App installable on Chrome/Edge
- [ ] Works offline after first visit
- [ ] Update prompts appear for new versions
- [ ] Background sync handles offline actions
- [ ] Push notifications ready (if implemented)
- [ ] Lighthouse PWA score > 90

### User Experience Validation

- [ ] Install prompt non-intrusive
- [ ] Update flow smooth with user control
- [ ] Offline indicator clear
- [ ] Performance improved (cached resources)
- [ ] No hydration mismatches
- [ ] Mobile experience native-like

### Cross-Platform Validation

- [ ] Chrome/Edge desktop: Full PWA features
- [ ] Chrome Android: Add to Home Screen works
- [ ] Safari iOS: Manual install works with icons
- [ ] Firefox: Service worker functions
- [ ] All platforms: Offline mode works

### Production Readiness

- [ ] HTTPS configured (required for SW)
- [ ] Cache strategies optimized
- [ ] Proper cache versioning
- [ ] Error handling comprehensive
- [ ] Monitoring/analytics preserved
- [ ] Update strategy documented

---

## Anti-Patterns to Avoid

- ❌ Don't cache everything blindly - be strategic
- ❌ Don't use skipWaiting without user consent
- ❌ Don't ignore cache size limits
- ❌ Don't cache sensitive/user-specific data incorrectly
- ❌ Don't forget offline fallbacks
- ❌ Don't break existing functionality
- ❌ Don't ignore iOS Safari limitations
- ❌ Don't cache API errors as valid responses

## Implementation Confidence Score

**Score: 9/10**

This PRP provides comprehensive context including:
- Complete research findings from service worker patterns
- Detailed Vite PWA plugin configuration
- Platform-specific considerations
- Existing codebase integration points
- Extensive validation procedures
- Common pitfalls and solutions

The implementation should succeed in a single pass with this level of detail and context.