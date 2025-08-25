name: "PWA Re-enablement PRP - Foundation Phase 1"
description: |

---

## Goal

**Feature Goal**: Re-enable Progressive Web App functionality for offline capability and app-like experience

**Deliverable**: Fully functional PWA with offline support, install prompts, and update notifications

**Success Definition**: Users can install the app, access content offline, and receive update notifications

## User Persona

**Target User**: Musicians and worship leaders using mobile devices or unreliable internet

**Use Case**: Access song charts and setlists during performances without internet connection

**User Journey**: 
1. User visits the app on mobile browser
2. Install prompt appears after engagement
3. User installs app to home screen
4. App works offline with cached content
5. Update notifications appear when new version available
6. Background sync uploads changes when reconnected

**Pain Points Addressed**: 
- No offline capability currently
- No install prompts for app-like experience
- No update notifications for new versions
- Lost 40% of intended user experience
- Poor mobile UX without PWA features

## Why

- Enables offline access to critical performance content
- Provides native app-like experience without app store
- Improves performance with intelligent caching
- Enables background sync for seamless data updates
- Increases user engagement with install prompts

## What

Re-enable all PWA features by:
- Setting ENABLE_PWA flag to true in vite.config.ts
- Uncommenting PWA imports and components in App.tsx
- Restoring service worker registration
- Verifying offline fallback functionality
- Testing install and update flows

### Success Criteria

- [ ] Service worker registers successfully
- [ ] Offline indicator shows current connection status
- [ ] Update prompt appears when new version deployed
- [ ] Install prompt works on supported browsers
- [ ] Offline page loads when disconnected
- [ ] Cached content accessible offline
- [ ] Background sync works when reconnected
- [ ] Lighthouse PWA score > 90

## All Needed Context

### Context Completeness Check

_All PWA components are fully implemented and ready - only need to uncomment specific lines and flip configuration flag._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/app/App.tsx
  why: Contains commented PWA code that needs uncommenting
  pattern: Lines 5-6 (imports), 34-36 (setup), 194-196 (components)
  gotcha: Line 7 already imports LazyRouteWrapper - don't duplicate

- file: vite.config.ts
  why: PWA configuration with ENABLE_PWA flag
  pattern: Line 15 has ENABLE_PWA = false, needs to be true
  gotcha: Comprehensive config already in place (lines 22-91)

- file: src/features/pwa/components/UpdatePrompt.tsx
  why: Fully implemented update notification component
  pattern: Complete implementation ready to use
  gotcha: Uses registerSW from virtual:pwa-register

- file: src/features/pwa/components/InstallPrompt.tsx
  why: Handles app installation with platform detection
  pattern: Shows iOS Safari manual steps vs Chrome auto-install
  gotcha: Requires beforeinstallprompt event support

- file: src/features/pwa/components/OfflineIndicator.tsx
  why: Shows online/offline status with animations
  pattern: Uses useOnlineStatus hook for reactivity
  gotcha: CSS animations for smooth transitions

- file: src/features/pwa/hooks/useServiceWorker.ts
  why: Currently stubbed, needs real implementation uncommented
  pattern: Lines 11-19 stub, lines 21-72 real implementation
  gotcha: Must uncomment real implementation for SW to work

- file: src/features/pwa/utils/offline.ts
  why: Complete offline handling with sync queue
  pattern: Background sync, request queuing, retry logic
  gotcha: Requires service worker for full functionality

- file: public/offline.html
  why: Fallback page when offline
  pattern: Beautiful offline page with retry functionality
  gotcha: Referenced in vite.config.ts navigateFallback

- docfile: PRPs/pwa-reactivation-prd.md
  why: Comprehensive PWA implementation guide
  section: All sections contain valuable context

- docfile: claude_md_files/re-enabling-pwa.md
  why: Simple step-by-step re-enabling guide
  section: Complete guide
```

### Current PWA State

```yaml
Configuration:
  - vite.config.ts:15 - ENABLE_PWA = false (needs true)
  - PWA plugin config (lines 22-91) - fully configured
  - Workbox caching strategies - sophisticated setup
  - Service worker settings - ready to use

Commented Code in App.tsx:
  - Line 5: // import { UpdatePrompt, InstallPrompt, OfflineIndicator, LazyRouteWrapper } from '@features/pwa'
  - Line 6: // import { setupOfflineHandlers } from '@features/pwa/utils/offline'
  - Lines 34-36: // useEffect(() => { setupOfflineHandlers() }, [])
  - Lines 194-196: // <OfflineIndicator /> <UpdatePrompt /> <InstallPrompt />

PWA Components Status:
  - UpdatePrompt - ✅ Fully implemented
  - InstallPrompt - ✅ Fully implemented  
  - OfflineIndicator - ✅ Fully implemented
  - LazyRouteWrapper - ✅ Fully implemented
  - OfflineFallback - ✅ Fully implemented

PWA Hooks Status:
  - useServiceWorker - ⚠️ Stubbed (needs uncommenting)
  - useInstallPrompt - ✅ Fully functional
  - useOnlineStatus - ✅ Fully functional

Public Assets:
  - All PWA icons present (64x64, 192x192, 512x512, maskable)
  - offline.html - ✅ Complete with styling
  - manifest generated by Vite PWA plugin
```

### Workbox Caching Configuration

```yaml
Caching Strategies (from vite.config.ts):
  API Calls (/api/v1/):
    - Strategy: NetworkFirst
    - Cache: http-cache
    - Max age: 24 hours
    - Max entries: 100

  Songs & Arrangements:
    - Strategy: CacheFirst  
    - Cache: songs-cache
    - Max age: 30 days
    - Max entries: 500

  Setlists:
    - Strategy: StaleWhileRevalidate
    - Cache: setlists-cache
    - Max age: 7 days
    - Max entries: 50

  User Data:
    - Strategy: NetworkFirst
    - Cache: user-cache
    - Max age: 1 hour
    - Max entries: 10

  Images & Fonts:
    - Strategy: CacheFirst
    - Cache: assets-cache
    - Max age: 30 days
    - Max entries: 100
```

## Implementation Blueprint

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: ENABLE PWA in vite.config.ts
  - UPDATE: Line 15 from 'const ENABLE_PWA = false' to 'const ENABLE_PWA = true'
  - VERIFY: PWA plugin configuration loads (lines 22-91)
  - CHECK: No TypeScript errors in config
  - REASON: Activates entire PWA plugin system

Task 2: UNCOMMENT PWA imports in App.tsx
  - UNCOMMENT: Line 5 - PWA component imports
  - UNCOMMENT: Line 6 - setupOfflineHandlers import
  - VERIFY: Imports resolve correctly
  - NOTE: LazyRouteWrapper already imported on line 7

Task 3: UNCOMMENT offline handlers setup in App.tsx
  - UNCOMMENT: Lines 34-36 - useEffect with setupOfflineHandlers
  - VERIFY: No duplicate useEffect blocks
  - CHECK: setupOfflineHandlers initializes without errors

Task 4: UNCOMMENT PWA components in App.tsx JSX
  - UNCOMMENT: Line 194 - <OfflineIndicator />
  - UNCOMMENT: Line 195 - <UpdatePrompt />
  - UNCOMMENT: Line 196 - <InstallPrompt />
  - PLACEMENT: Inside BrowserRouter, outside Routes
  - VERIFY: Components render without errors

Task 5: FIX useServiceWorker hook implementation
  - FILE: src/features/pwa/hooks/useServiceWorker.ts
  - COMMENT: Lines 11-19 (stub implementation)
  - UNCOMMENT: Lines 21-72 (real implementation)
  - VERIFY: Service worker registration logic intact
  - CHECK: No TypeScript errors

Task 6: BUILD and verify PWA files generated
  - RUN: npm run build
  - VERIFY: dist/sw.js created
  - VERIFY: dist/manifest.webmanifest created
  - CHECK: Workbox files generated in dist/
  - CHECK: No build errors

Task 7: TEST service worker registration
  - RUN: npm run preview (production build)
  - OPEN: Chrome DevTools > Application > Service Workers
  - VERIFY: Service worker registered and active
  - CHECK: No console errors

Task 8: TEST offline functionality
  - LOAD: App in browser with preview server
  - NAVIGATE: To several pages to cache content
  - DISCONNECT: Network (DevTools > Network > Offline)
  - VERIFY: Offline indicator appears
  - VERIFY: Cached pages still accessible
  - VERIFY: offline.html loads for non-cached routes

Task 9: TEST install prompt
  - DESKTOP: Chrome/Edge should show install icon in address bar
  - MOBILE: Should show custom install prompt after engagement
  - iOS: Should show manual installation instructions
  - VERIFY: App installs successfully
  - CHECK: Installed app launches correctly

Task 10: TEST update flow
  - MAKE: Small change to any component
  - BUILD: npm run build
  - REFRESH: Browser with app
  - VERIFY: Update prompt appears
  - CLICK: Update button
  - VERIFY: Page reloads with new version
```

### Implementation Patterns & Key Details

```typescript
// vite.config.ts - Line 15
// Before:
const ENABLE_PWA = false

// After:
const ENABLE_PWA = true  // Re-enables entire PWA system

// src/app/App.tsx - Uncommented imports (lines 5-6)
import { UpdatePrompt, InstallPrompt, OfflineIndicator } from '@features/pwa'
import { setupOfflineHandlers } from '@features/pwa/utils/offline'

// src/app/App.tsx - Uncommented setup (lines 34-36)
useEffect(() => {
  setupOfflineHandlers()
}, [])

// src/app/App.tsx - Uncommented components (lines 194-196)
return (
  <ErrorBoundary level="app">
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <SongModalProvider>
            <BrowserRouter>
              <Layout>
                {/* Routes here */}
              </Layout>
              {/* PWA Components - outside routes but inside Router */}
              <OfflineIndicator />
              <UpdatePrompt />
              <InstallPrompt />
            </BrowserRouter>
          </SongModalProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
)

// src/features/pwa/hooks/useServiceWorker.ts
// Comment out stub (lines 11-19) and uncomment real implementation (lines 21-72)
export function useServiceWorker() {
  /* Comment this stub:
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: () => Promise.resolve(),
  }
  */
  
  // Uncomment real implementation:
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  
  const updateServiceWorker = useCallback(async () => {
    if (!registration) return
    
    try {
      await registration.update()
      const waiting = registration.waiting
      
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' })
        waiting.addEventListener('statechange', (e) => {
          const target = e.target as ServiceWorker
          if (target.state === 'activated') {
            window.location.reload()
          }
        })
      }
    } catch (error) {
      console.error('Failed to update service worker:', error)
    }
  }, [registration])
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js')
      
      wb.addEventListener('waiting', () => setNeedRefresh(true))
      wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          setNeedRefresh(true)
        } else {
          setOfflineReady(true)
        }
      })
      
      wb.register().then((r) => setRegistration(r))
    }
  }, [])
  
  return {
    needRefresh: [needRefresh, setNeedRefresh] as const,
    offlineReady: [offlineReady, setOfflineReady] as const,
    updateServiceWorker,
  }
}

// CRITICAL: Test offline with proper flow
// 1. Visit pages while online to populate cache
// 2. Go offline
// 3. Previously visited pages should work
// 4. New pages should show offline.html

// GOTCHA: iOS Safari requires manual installation
// The InstallPrompt component already handles this with instructions
```

### Integration Points

```yaml
SERVICE_WORKER:
  - Registration: Automatic via Vite PWA plugin
  - Location: /sw.js (generated at build time)
  - Workbox: Version 7.3.0 included
  
MANIFEST:
  - Generation: Automatic via Vite PWA plugin
  - Location: /manifest.webmanifest
  - Icons: All sizes provided in public/
  
CACHING:
  - Strategies: Defined in vite.config.ts
  - Storage: Browser Cache API
  - Quota: Target < 50MB
  
BROWSER_APIS:
  - beforeinstallprompt: Chrome/Edge only
  - navigator.onLine: All browsers
  - Service Worker: All modern browsers
  - Background Sync: Chrome/Edge only
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After enabling PWA flag
npm run lint
npm run build

# Expected: Zero errors, successful build
```

### Level 2: Build Validation

```bash
# Build production bundle
npm run build

# Verify PWA files generated
ls -la dist/sw.js
ls -la dist/workbox-*.js
ls -la dist/manifest.webmanifest

# Expected: All PWA files present
```

### Level 3: Integration Testing (System Validation)

```bash
# Start preview server (production build)
npm run preview

# Open Chrome DevTools > Application tab

# Service Worker validation
# 1. Check Service Workers section
# 2. Verify sw.js is registered and active
# 3. No errors in console

# Manifest validation
# 1. Check Manifest section
# 2. Verify all properties loaded
# 3. Icons display correctly

# Cache Storage validation
# 1. Check Cache Storage section
# 2. Verify caches created (http-cache, songs-cache, etc.)
# 3. Check cached resources

# Expected: All PWA systems operational
```

### Level 4: Functional Testing

```bash
# Test Offline Mode
# 1. Load app and navigate to several pages
# 2. DevTools > Network > Offline checkbox
# 3. Verify offline indicator appears
# 4. Navigate to cached pages - should work
# 5. Navigate to new page - should show offline.html
# 6. Go back online - verify reconnection

# Test Install Flow (Desktop Chrome/Edge)
# 1. Look for install icon in address bar
# 2. Click install
# 3. Verify app installs
# 4. Launch installed app
# 5. Verify standalone window

# Test Install Flow (Mobile)
# 1. Open in Chrome Android
# 2. Wait for install prompt (or menu > Add to Home Screen)
# 3. Install app
# 4. Launch from home screen
# 5. Verify full-screen experience

# Test Update Flow
# 1. Make a change to any component
# 2. npm run build
# 3. npm run preview
# 4. Refresh app in browser
# 5. Verify update prompt appears
# 6. Click update
# 7. Verify new version loads

# Lighthouse Audit
# 1. Open Chrome DevTools > Lighthouse
# 2. Run PWA audit
# 3. Target score: > 90

# Expected: All PWA features functional
```

## Final Validation Checklist

### Technical Validation

- [ ] ENABLE_PWA = true in vite.config.ts
- [ ] All PWA imports uncommented in App.tsx
- [ ] Service worker registers successfully
- [ ] No console errors
- [ ] Build completes without errors

### Feature Validation

- [ ] Offline indicator shows connection status
- [ ] Update prompts appear for new versions
- [ ] Install prompt works on Chrome/Edge
- [ ] iOS shows manual install instructions
- [ ] Offline page loads when disconnected
- [ ] Cached content accessible offline
- [ ] Background sync queues requests

### PWA Metrics

- [ ] Lighthouse PWA score > 90
- [ ] Service worker active
- [ ] Manifest valid
- [ ] HTTPS enabled (required for PWA)
- [ ] Responsive design works
- [ ] All icons load correctly

### Cross-Platform Testing

- [ ] Desktop Chrome - install works
- [ ] Desktop Edge - install works
- [ ] Mobile Chrome - install works
- [ ] iOS Safari - manual install instructions shown
- [ ] Offline mode works on all platforms

---

## Anti-Patterns to Avoid

- ❌ Don't forget to build before testing PWA features
- ❌ Don't test PWA features with dev server (use preview)
- ❌ Don't skip offline testing with actual network disconnection
- ❌ Don't ignore iOS Safari's limitations (no auto-install)
- ❌ Don't cache sensitive user data
- ❌ Don't exceed reasonable cache quotas (target < 50MB)
- ❌ Don't forget to test update flow
- ❌ Don't leave stub implementation in useServiceWorker