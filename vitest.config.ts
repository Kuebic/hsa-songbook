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
    include: ['**/__tests__/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
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
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/shared/test-utils/',
        '*.config.ts',
        '**/*.d.ts',
        '**/*.types.ts',
        '**/index.ts',
        '**/__tests__/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  }
})