import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/shared/test-utils/setup.ts',
    include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true
      }
    },
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      enabled: true, // Enable coverage by default
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'], // Add lcov for CI integration
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/shared/test-utils/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/*.types.ts',
        '**/index.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        'src/main.tsx', // Entry point
        'src/vite-env.d.ts'
      ],
      thresholds: { // Add coverage thresholds
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@assets': path.resolve(__dirname, './src/assets'),
      'virtual:pwa-register/react': path.resolve(__dirname, './src/shared/test-utils/__mocks__/virtual-pwa-register.ts')
    }
  }
})