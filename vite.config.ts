import { defineConfig, type PluginOption, type ViteDevServer } from 'vite'
import type { Connect } from 'vite'
import type * as http from 'node:http'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'HSA Songbook',
        short_name: 'Songbook',
        description: 'Offline-capable chord charts and setlists for worship',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-64x64.svg',
            sizes: '64x64',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        categories: ['music', 'productivity', 'utilities']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
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
                  maxRetentionTime: 24 * 60 // 24 hours
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
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Setlists - stale while revalidate
            urlPattern: /^\/api\/v1\/setlists\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'setlists-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // User data - network first
            urlPattern: /^\/api\/v1\/(users|auth)\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'user-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Images and media assets
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Fonts
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Google Fonts CSS
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true, // Enable in dev for testing
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: false // Show warnings to help debug issues
      },
      // Ensure source maps are generated in development
      buildBase: '/'
    }),
    // Bundle analysis plugin
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      title: 'HSA Songbook - Bundle Analysis'
    }) as PluginOption
  ],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    sourcemap: true, // Enable for accurate bundle analysis
    rollupOptions: {
      output: {
        manualChunks: {
          'clerk': ['@clerk/clerk-react'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'monitoring': ['web-vitals', 'react-error-boundary']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err)
          })
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url, '->', options.target + (req.url || ''))
          })
        }
      }
    },
    fs: {
      // Allow serving files from dev-dist directory for PWA in development
      allow: ['..']
    }
  },
  publicDir: 'public',
  // Custom middleware to serve PWA files in development
  configureServer(server: ViteDevServer) {
    return () => {
      server.middlewares.use((req: Connect.IncomingMessage, res: http.ServerResponse, next: Connect.NextFunction) => {
        // Serve PWA dev files from dev-dist directory
        if (req.url && (req.url.includes('workbox-') || req.url.endsWith('.js.map'))) {
          const filePath = path.join(__dirname, 'dev-dist', path.basename(req.url))
          
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath)
            const contentType = req.url.endsWith('.map') ? 'application/json' : 'application/javascript'
            res.setHeader('Content-Type', contentType)
            res.end(content)
            return
          }
        }
        next()
      })
    }
  }
}))
