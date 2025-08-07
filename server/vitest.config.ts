import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true } // Essential for MongoDB tests
    },
    setupFiles: ['./shared/test-utils/setup.ts'],
    // Optimized default timeouts - individual tests can override as needed
    testTimeout: 5000, // 5 seconds default (most tests should be much faster)
    hookTimeout: 25000, // 25 seconds for hooks (MongoDB Memory Server setup needs up to 20s)
    env: {
      // Force MongoDB Memory Server configuration to avoid Linux distro detection issues
      MONGOMS_DOWNLOAD_URL: 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-7.0.14.tgz',
      MONGOMS_DOWNLOAD_DIR: './mongodb-binaries',
      MONGOMS_VERSION: '7.0.14',
      MONGOMS_DISTRO: 'ubuntu-2204',
      MONGOMS_ARCH: 'x64',
      NODE_ENV: 'test'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'features/**/*.ts',
        'shared/services/*.ts',
        'shared/utils/*.ts',
        'shared/middleware/*.ts'
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/*.ts',
        '**/validation/*.ts',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**'
      ],
      thresholds: {
        global: {
          branches: 85, // Progressive improvement toward 90% target
          functions: 85, // Progressive improvement toward 90% target
          lines: 85,     // Progressive improvement toward 90% target  
          statements: 85 // Progressive improvement toward 90% target
        }
      }
    }
  }
})