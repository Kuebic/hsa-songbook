# React 19 + Vite Production Build: Component Undefined Bug

## Problem Statement

When building a React 19 application with Vite for production, class components that extend `React.Component` throw the error:

```
Uncaught TypeError: can't access property "Component" of undefined
ErrorBoundary.tsx:29
```

This error:
- **ONLY occurs in production builds** (`npm run build` → `npm run preview`)
- **Does NOT occur in development** (`npm run dev`)
- **Persists even with cache clearing** and incognito mode
- **Affects all class components** that extend React.Component

## Root Cause Analysis

### The Core Issue

React 19 is distributed as CommonJS modules, while Vite expects ESM. The CommonJS-to-ESM interop fails in production builds, causing React to be undefined or improperly transformed when accessing `React.Component`.

### Why Development Works

In development mode, Vite uses esbuild for dependency pre-bundling which handles the CommonJS-to-ESM conversion differently than the production Rollup build.

### Why Production Fails

During production builds:
1. Rollup processes React differently than esbuild
2. The CommonJS plugin may not properly expose React exports
3. Tree-shaking and minification can remove "unused" exports
4. The module resolution differs between dev and prod

## Attempted Solutions (That Failed)

### 1. Default Import + Destructuring
```typescript
import React, { Component } from 'react';
export class ErrorBoundary extends Component<...> {
```
**Result**: TypeScript error - 'React' is declared but never used

### 2. Named Import Only
```typescript
import { Component } from 'react';
export class ErrorBoundary extends Component<...> {
```
**Result**: Component is undefined in production

### 3. Namespace Import
```typescript
import * as React from 'react';
export class ErrorBoundary extends React.Component<...> {
```
**Result**: Still fails in production (current state)

### 4. Multiple Import Strategies
```typescript
import React from 'react';
import * as ReactAll from 'react';
const ReactComponent = React.Component || ReactAll.Component;
```
**Result**: TypeScript doesn't allow dynamic base classes

### 5. CommonJS Options Workaround
```typescript
commonjsOptions: {
  include: [],  // Disable commonjs plugin v22
}
```
**Result**: Breaks other dependencies (TanStack Query)

### 6. OptimizeDeps Force
```typescript
optimizeDeps: {
  force: true,
  include: ['react', 'react-dom', 'react/jsx-runtime']
}
```
**Result**: No effect on production build

## Research Findings

### From GitHub Issues

1. **vitejs/vite#9703**: "Class extends value undefined is not a constructor or null"
   - Known issue with Vite 3+ and class components
   - Related to @rollup/plugin-commonjs v22

2. **vitejs/vite#4083**: "Undefined imports in production build with shared components"
   - Production builds can have undefined variables where dev works
   - Related to how Vite handles module transformations

3. **vitejs/vite#12188**: "Vite build is prepending undefined variables to some deps"
   - Vite can incorrectly transform dependencies in production

### From Stack Overflow

- Multiple reports of "Cannot read properties of undefined" in production only
- Usually related to incorrect CommonJS/ESM interop
- No definitive solution for React 19 specifically

### From React 19 Documentation

- React 19 still uses CommonJS for distribution
- No official guidance on Vite compatibility issues
- Error boundaries must still be class components

## Potential Solutions (Not Yet Tried)

### 1. Custom Rollup Plugin
Create a custom plugin to handle React imports:
```javascript
// vite.config.ts
const reactPlugin = () => ({
  name: 'react-interop',
  transform(code, id) {
    if (id.includes('node_modules/react')) {
      // Custom transformation
    }
  }
})
```

### 2. Alias React to UMD Build
```javascript
// vite.config.ts
resolve: {
  alias: {
    'react': 'react/umd/react.production.min.js',
    'react-dom': 'react-dom/umd/react-dom.production.min.js'
  }
}
```

### 3. Use External React
Load React from CDN instead of bundling:
```javascript
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
```

### 4. Downgrade to React 18
React 18 has better ESM support and fewer Vite issues.

### 5. Switch to Alternative Error Boundary
Use `react-error-boundary` package which uses hooks internally:
```typescript
import { ErrorBoundary } from 'react-error-boundary';
```

### 6. Manual Module Transformation
Pre-transform React to ESM before building:
```bash
# Use a tool like @rollup/plugin-commonjs separately
# Transform React modules to ESM
# Then build with transformed modules
```

### 7. Different Build Tool
Consider alternatives:
- **Webpack**: More mature CommonJS handling
- **Parcel**: Zero-config with better CommonJS support
- **Turbopack**: Next.js's new bundler
- **Rspack**: Rust-based webpack alternative

## The Nuclear Option: Rewrite Without Classes

Convert ErrorBoundary to use react-error-boundary hooks:
```typescript
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

export const ErrorBoundary = ({ children, ...props }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={errorReportingService.reportError}
      {...props}
    >
      {children}
    </ReactErrorBoundary>
  );
};
```

## Environment Details

- **React**: 19.1.1
- **Vite**: 7.0.6
- **TypeScript**: 5.8.3
- **Node**: (version not specified)
- **Build Mode**: production/staging
- **Module System**: ESM with CommonJS dependencies

## Current Status

The issue persists despite multiple attempted fixes. The error occurs at the exact moment the class tries to extend `React.Component`, suggesting React is either:
1. Not fully loaded when the class is defined
2. Improperly transformed during build
3. Tree-shaken incorrectly

## Next Steps to Debug

1. **Inspect the actual bundle**:
   ```bash
   # Look at how React is actually imported in the bundle
   grep -A 10 -B 10 "from.*react-vendor" dist/assets/js/monitoring-*.js
   ```

2. **Check module format**:
   ```bash
   # See what format React is actually in
   head -100 node_modules/react/index.js
   ```

3. **Try build without minification**:
   ```javascript
   build: {
     minify: false,
     sourcemap: true
   }
   ```

4. **Add debug logging**:
   ```typescript
   console.log('React:', React);
   console.log('React.Component:', React?.Component);
   export class ErrorBoundary extends React.Component {
   ```

5. **Check if it's a timing issue**:
   ```typescript
   // Defer class definition
   let ErrorBoundaryClass;
   setTimeout(() => {
     ErrorBoundaryClass = class extends React.Component {
       // ...
     };
   }, 0);
   ```

## Related Issues

- https://github.com/vitejs/vite/issues/9703
- https://github.com/vitejs/vite/issues/4083
- https://github.com/vitejs/vite/issues/12188
- https://github.com/facebook/react/issues (search for Vite + React 19)

## Conclusion

This appears to be a fundamental incompatibility between React 19's CommonJS distribution and Vite's ESM-first approach in production builds. The most reliable solution may be to:

1. Use a different bundler for production
2. Use react-error-boundary instead of class components
3. Wait for React 19 ESM distribution
4. Downgrade to React 18

The fact that this fails even with namespace imports (`import * as React`) suggests the issue is deeper than just import syntax - it's about how the module is transformed and loaded at runtime.