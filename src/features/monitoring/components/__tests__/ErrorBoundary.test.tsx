import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '../ErrorBoundary'
import { errorReportingService } from '../../services/errorReportingService'
import type { ErrorFallbackProps } from '../../types/monitoring.types'

// Mock the error reporting service
vi.mock('../../services/errorReportingService', () => ({
  errorReportingService: {
    reportError: vi.fn(),
  },
}))

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}


// Custom error fallback component
function CustomErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div>
      <h2>Custom Error</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Reset Custom</button>
    </div>
  )
}

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error
  
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    console.error = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  describe('Error catching and display', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should catch errors and display error fallback', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should use custom fallback component when provided', () => {
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom Error')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Reset Custom/i })).toBeInTheDocument()
    })

    it('should display error details in development mode', () => {
      const originalEnv = import.meta.env.DEV
      // Mocking env variable
      import.meta.env.DEV = true

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Use getAllByText since there might be multiple error displays
      const errorElements = screen.getAllByText(/Test error/i)
      expect(errorElements.length).toBeGreaterThan(0)

      // Restoring env variable
      import.meta.env.DEV = originalEnv
    })
  })

  describe('Error reporting', () => {
    it('should report errors to error reporting service', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(errorReportingService.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.objectContaining({
          level: 'page',
          timestamp: expect.any(Number),
        })
      )
    })

    it('should include component stack in error report', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(errorReportingService.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('should call custom onError handler', () => {
      const onError = vi.fn()
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })
  })

  describe('Error recovery', () => {
    it('should reset error boundary when reset button is clicked', async () => {
      const user = userEvent.setup()
      
      // Component that can toggle throwing
      let shouldThrow = true
      const ToggleError = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>No error</div>
      }
      
      render(
        <ErrorBoundary>
          <ToggleError />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

      // Set the component to not throw after reset
      shouldThrow = false
      
      // Click reset button
      await user.click(screen.getByRole('button', { name: /try again/i }))

      // After reset, the component should render normally
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should reset on prop changes when resetOnPropsChange is true', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

      rerender(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should reset when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
    })
  })

  describe('Error isolation', () => {
    it('should isolate errors when isolate prop is true', () => {
      const { container } = render(
        <ErrorBoundary isolate={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const isolatedDiv = container.querySelector('div[style*="isolation"]')
      expect(isolatedDiv).toBeInTheDocument()
      expect(isolatedDiv).toHaveStyle({ isolation: 'isolate' })
    })

    it('should not isolate errors when isolate prop is false', () => {
      const { container } = render(
        <ErrorBoundary isolate={false}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const isolatedDiv = container.querySelector('div[style*="isolation"]')
      expect(isolatedDiv).not.toBeInTheDocument()
    })
  })

  describe('Error levels', () => {
    const levels = ['app', 'page', 'section', 'component'] as const

    levels.forEach(level => {
      it(`should report error with level: ${level}`, () => {
        render(
          <ErrorBoundary level={level}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        )

        expect(errorReportingService.reportError).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            level,
          })
        )
      })
    })
  })

  describe('Multiple error boundaries', () => {
    it('should catch errors at different levels', () => {
      render(
        <ErrorBoundary level="app">
          <div>
            <ErrorBoundary level="section">
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
            <div>Other content</div>
          </div>
        </ErrorBoundary>
      )

      // Section error boundary should catch the error
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      // Other content should still render
      expect(screen.getByText('Other content')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle errors without error info', () => {
      const error = new Error('Test error')
      const result = ErrorBoundary.getDerivedStateFromError(error)

      expect(result).toEqual({
        hasError: true,
        error,
      })
    })

    it('should handle null children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      )

      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    })

    it('should handle undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      )

      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    })
  })
})