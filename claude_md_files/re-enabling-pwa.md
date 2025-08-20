  Re-enabling PWA

  To restore offline functionality in the future:
  1. Set ENABLE_PWA = true in vite.config.ts
  2. Uncomment PWA components in App.tsx
  3. Uncomment real implementation in useServiceWorker.ts
  4. Uncomment setupOfflineHandlers() call
