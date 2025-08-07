# PWA Manifest Configuration for Vite Projects - Comprehensive Guide

## Overview

This comprehensive guide covers Progressive Web App (PWA) manifest configuration specifically for Vite projects, including React applications. The Web App Manifest is a JSON file that defines how a PWA should behave when installed on a user's device.

## 1. Web App Manifest Specification

### Required Fields for PWA Installation

According to MDN and Chrome Developer documentation, these fields are essential for PWA installability:

1. **`name`** - Full application name used during installation
2. **`short_name`** - Shorter version used when space is limited
3. **`icons`** - Array of app icons in various sizes
4. **`start_url`** - Entry point when the app launches (required by spec)
5. **`display`** - How the app should be displayed

### Core Manifest Structure

```json
{
  "name": "HSA Songbook",
  "short_name": "Songbook",
  "description": "Digital songbook for HSA with chord charts and lyrics",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "scope": "/",
  "id": "/",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## 2. Vite PWA Plugin Configuration

### Installation

```bash
npm install -D vite-plugin-pwa workbox-window
```

### Basic Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'HSA Songbook',
        short_name: 'Songbook',
        description: 'Digital songbook for HSA with chord charts and lyrics',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
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
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3000000
      }
    })
  ]
})
```

### Development Configuration

For testing PWA features during development:

```typescript
VitePWA({
  devOptions: {
    enabled: true,
    type: 'module'
  },
  // ... other options
})
```

## 3. Icon Requirements and Best Practices

### Essential Icon Sizes

- **192x192px** - Minimum required size for Chrome/Chromium browsers
- **512x512px** - Minimum required size for Chrome/Chromium browsers
- **1024x1024px** - Recommended for high-density displays

### Maskable Icons

Maskable icons adapt to different platform shapes (circular, rounded square, squircle):

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Safe Zone Requirements

- Critical elements must be within 40% radius of center
- Outermost 10% may be cropped on some platforms
- Use opaque background for maskable icons

### Testing Tools

- [Maskable.app](https://maskable.app) - Test maskable icons
- Chrome DevTools Application panel - Verify manifest loading
- Lighthouse PWA audit - Check PWA requirements

## 4. Display Modes

### Available Display Modes

1. **`fullscreen`** - Uses entire display, hides all browser UI
2. **`standalone`** - Looks like native app, hides browser UI but keeps system UI
3. **`minimal-ui`** - Similar to standalone but retains minimal browser controls
4. **`browser`** - Regular browser tab

### Fallback Chain

The specification defines a fallback chain: `fullscreen` → `standalone` → `minimal-ui` → `browser`

### CSS Display Mode Detection

```css
/* Styles for standalone mode */
@media (display-mode: standalone) {
  .app {
    padding-top: env(safe-area-inset-top);
  }
}

/* Styles for fullscreen mode */
@media (display-mode: fullscreen) {
  .app {
    background: black;
  }
}
```

### JavaScript Display Mode Detection

```javascript
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running in standalone mode');
}
```

## 5. Theme Colors and Background Colors

### Theme Color

Sets the color of the browser toolbar and system UI:

```json
{
  "theme_color": "#1976d2"
}
```

Corresponding HTML meta tag:

```html
<meta name="theme-color" content="#1976d2">
```

### Background Color

Used for splash screen and initial app loading:

```json
{
  "background_color": "#ffffff"
}
```

## 6. Start URL and Scope Configuration

### Start URL

Defines where the app launches:

```json
{
  "start_url": "/?utm_source=pwa"
}
```

### Scope

Controls which URLs are considered part of the app:

```json
{
  "scope": "/"
}
```

## 7. App Shortcuts

Quick access to key app features:

```json
{
  "shortcuts": [
    {
      "name": "Search Songs",
      "short_name": "Search",
      "description": "Search for songs in the songbook",
      "url": "/search",
      "icons": [
        {
          "src": "/icons/search-icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "My Setlists",
      "short_name": "Setlists",
      "description": "View and manage your setlists",
      "url": "/setlists",
      "icons": [
        {
          "src": "/icons/setlist-icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ]
}
```

### Platform Limitations

- Chrome desktop/Edge: First 10 shortcuts
- Chrome Android: First 3 shortcuts
- Order by priority

## 8. Share Target API

Enable your PWA to receive shared content:

```json
{
  "share_target": {
    "action": "/share-song",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### For File Sharing (POST method)

```json
{
  "share_target": {
    "action": "/share-file",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "music_files",
          "accept": ["audio/*", ".pdf", ".txt"]
        }
      ]
    }
  }
}
```

## 9. Related Applications

Link to native app versions:

```json
{
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/store/apps/details?id=com.hsa.songbook",
      "id": "com.hsa.songbook"
    },
    {
      "platform": "itunes",
      "url": "https://apps.apple.com/app/hsa-songbook/id123456789"
    }
  ],
  "prefer_related_applications": false
}
```

## 10. HTML Integration

### Required Meta Tags

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- PWA Meta Tags -->
  <meta name="theme-color" content="#1976d2" />
  <meta name="description" content="Digital songbook for HSA with chord charts and lyrics" />
  
  <!-- Apple Touch Icon -->
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
  
  <!-- Mask Icon for Safari -->
  <link rel="mask-icon" href="/mask-icon.svg" color="#1976d2" />
  
  <!-- Manifest -->
  <link rel="manifest" href="/manifest.webmanifest" />
  
  <title>HSA Songbook</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/app/main.tsx"></script>
</body>
</html>
```

## 11. Advanced Vite PWA Configuration

### Complete Configuration Example

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa'

const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  devOptions: {
    enabled: process.env.NODE_ENV === 'development'
  },
  includeAssets: [
    'favicon.ico',
    'apple-touch-icon.png',
    'mask-icon.svg'
  ],
  manifest: {
    name: 'HSA Songbook',
    short_name: 'Songbook',
    description: 'Digital songbook for HSA with chord charts and lyrics',
    theme_color: '#1976d2',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    scope: '/',
    id: '/',
    categories: ['music', 'education', 'productivity'],
    icons: [
      {
        src: 'pwa-64x64.png',
        sizes: '64x64',
        type: 'image/png'
      },
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
    ],
    shortcuts: [
      {
        name: 'Search Songs',
        short_name: 'Search',
        description: 'Search for songs in the songbook',
        url: '/search',
        icons: [
          {
            src: 'shortcuts/search-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      }
    ],
    share_target: {
      action: '/share',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url'
      }
    }
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
    maximumFileSizeToCacheInBytes: 3000000,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.example\.com\//,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 300 // 5 minutes
          }
        }
      }
    ]
  }
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA(pwaOptions)
  ]
})
```

## 12. Testing and Validation

### Validation Commands

```bash
# Build the application
npm run build

# Preview the built application
npm run preview

# Test PWA features in Chrome DevTools
# 1. Open Application tab
# 2. Check Manifest section
# 3. Run Lighthouse PWA audit
```

### Chrome DevTools Checklist

1. **Application > Manifest**: Verify all fields load correctly
2. **Application > Service Workers**: Confirm SW registration
3. **Lighthouse > Progressive Web App**: Run PWA audit
4. **Network > Offline**: Test offline functionality

## 13. Common Gotchas and Best Practices

### Gotchas

1. **Development Mode**: PWA features don't work by default in dev mode
2. **Icon Purpose**: Don't use `"any maskable"` - separate into `"any"` and `"maskable"`
3. **File Paths**: Icons paths are relative to the manifest file location
4. **HTTPS Requirement**: PWAs require HTTPS in production
5. **Scope Restrictions**: URLs outside scope won't have PWA behavior

### Best Practices

1. **Progressive Enhancement**: Ensure app works without PWA features
2. **Offline Strategy**: Cache critical resources for offline use
3. **Update Handling**: Implement proper service worker update flow
4. **Icon Testing**: Test icons on multiple platforms and shapes
5. **Performance**: Keep initial bundle size small for better install experience

## 14. Documentation URLs

### Official Documentation

- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/index.html)
- [web.dev PWA Manifest Guide](https://web.dev/learn/pwa/web-app-manifest)
- [Chrome Developers Manifest](https://developer.chrome.com/docs/lighthouse/pwa/maskable-icon-audit)
- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/guide/)
- [W3C Web App Manifest Specification](https://w3c.github.io/manifest/)

### Tools and Resources

- [Maskable.app](https://maskable.app) - Test maskable icons
- [PWA Builder](https://www.pwabuilder.com/) - Microsoft's PWA tools
- [Workbox](https://developers.google.com/web/tools/workbox) - Google's PWA toolkit
- [PWA Manifest Generator](https://app-manifest.firebaseapp.com/) - Generate manifest files

This comprehensive guide provides all the necessary information for implementing PWA manifest configuration in Vite projects, specifically tailored for React applications with TypeScript support.