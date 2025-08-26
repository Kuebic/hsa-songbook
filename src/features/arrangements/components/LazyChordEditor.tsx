/**
 * @file LazyChordEditor.tsx
 * @description Lazy loading wrapper for ChordEditorWithPreview component
 * Implements code splitting for the heavy editor dependencies
 */

import React, { Component, lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { ExtendedWindow } from '../../../shared/types/common'

// Lazy load the chord editor with chunk name
const ChordEditorWithPreview = lazy(() => 
  import(/* webpackChunkName: "chord-editor" */ './ChordEditorWithPreview').then(module => ({ 
    default: module.ChordEditorWithPreview 
  }))
)

// Loading skeleton component
const EditorSkeleton = () => (
  <div className="flex flex-col h-full bg-white dark:bg-gray-900">
    {/* Toolbar skeleton */}
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
    
    {/* Editor area skeleton */}
    <div className="flex-1 flex">
      {/* Editor pane */}
      <div className="flex-1 p-4">
        <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
      </div>
      
      {/* Preview pane */}
      <div className="flex-1 p-4 border-l border-gray-200 dark:border-gray-700">
        <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="p-4 space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Error fallback component
const EditorErrorFallback = ({ error }: { error?: Error }) => (
  <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
    <div className="text-center p-8">
      <div className="mb-4">
        <svg 
          className="mx-auto h-12 w-12 text-red-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Failed to load editor
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {error?.message || 'The chord editor could not be loaded. Please try refreshing the page.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
)

// Type for the ChordEditorWithPreview props
type ChordEditorProps = ComponentProps<typeof ChordEditorWithPreview>

// Lazy wrapper component
interface LazyChordEditorProps extends ChordEditorProps {
  onError?: (error: Error) => void
}

export function LazyChordEditor({ onError, ...props }: LazyChordEditorProps) {
  return (
    <ErrorBoundary onError={onError}>
      <Suspense fallback={<EditorSkeleton />}>
        <ChordEditorWithPreview {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}

// Error boundary for handling chunk loading failures
class ErrorBoundary extends Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy chord editor loading failed:', error, errorInfo)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      return <EditorErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

// Preload function for manual preloading
// eslint-disable-next-line react-refresh/only-export-components
export function preloadChordEditor() {
  return import(/* webpackPreload: true */ './ChordEditorWithPreview')
}

// Check if editor is already loaded
// eslint-disable-next-line react-refresh/only-export-components
export function isChordEditorLoaded(): boolean {
  // Check if the module is already loaded (simplified check)
  // In Vite, we can't directly check module cache like in webpack
  if (typeof window !== 'undefined') {
    // Check if the component has been loaded by checking for its presence
    // This is a simplified approach for Vite
    return !!(window as unknown as ExtendedWindow).__chordEditorLoaded
  }
  return false
}