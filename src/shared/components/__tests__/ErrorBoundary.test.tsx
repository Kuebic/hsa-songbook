import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary, FeatureErrorBoundary } from '../ErrorBoundary'

// Mock console.error to avoid noise in test output
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Component rendered successfully</div>
}

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
})

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReload.mockClear()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child component</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Child component')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })

  it('renders default error message when error has no message', () => {
    const ComponentThrowingErrorWithoutMessage = () => {
      throw new Error('')
    }
    
    render(
      <ErrorBoundary>
        <ComponentThrowingErrorWithoutMessage />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom error fallback')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const mockOnError = vi.fn()
    
    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(mockOnError).toHaveBeenCalledTimes(1)
    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('logs error to console when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('reloads page when reload button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const reloadButton = screen.getByText('Reload Page')
    await user.click(reloadButton)
    
    expect(mockReload).toHaveBeenCalledTimes(1)
  })

  it('applies correct error UI styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const errorContainer = screen.getByText('Something went wrong').parentElement
    expect(errorContainer).toHaveStyle({
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#fee2e2',
      borderRadius: '8px',
      margin: '2rem',
      border: '1px solid #fca5a5'
    })
  })

  it('does not render error UI when component recovers', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // ErrorBoundary state persists after error, so we need a new instance
    rerender(
      <ErrorBoundary key="new">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Component rendered successfully')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})

describe('FeatureErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <div>Feature component</div>
      </FeatureErrorBoundary>
    )
    
    expect(screen.getByText('Feature component')).toBeInTheDocument()
  })

  it('renders feature-specific error UI when child throws', () => {
    render(
      <FeatureErrorBoundary featureName="SongPlayer">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    )
    
    expect(screen.getByText('Error in SongPlayer')).toBeInTheDocument()
    expect(screen.getByText(/This feature encountered an error/)).toBeInTheDocument()
  })

  it('logs error with feature name', () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    )
    
    expect(console.error).toHaveBeenCalledWith(
      'Error in TestFeature:',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('applies correct feature error UI styling', () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    )
    
    const errorContainer = screen.getByText('Error in TestFeature').parentElement
    expect(errorContainer).toHaveStyle({
      padding: '1rem',
      backgroundColor: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: '4px',
      margin: '1rem 0'
    })
  })

  it('displays generic error message for feature errors', () => {
    render(
      <FeatureErrorBoundary featureName="SearchFeature">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    )
    
    const errorText = screen.getByText(/This feature encountered an error/)
    expect(errorText).toBeInTheDocument()
    expect(errorText).toHaveTextContent(
      'This feature encountered an error. Please try refreshing the page or contact support if the problem persists.'
    )
  })

  it('handles different feature names correctly', () => {
    const featureNames = ['Auth', 'SongList', 'Search', 'Player']
    
    featureNames.forEach((featureName, index) => {
      render(
        <FeatureErrorBoundary featureName={featureName} key={index}>
          <ThrowError shouldThrow={true} />
        </FeatureErrorBoundary>
      )
      
      expect(screen.getByText(`Error in ${featureName}`)).toBeInTheDocument()
    })
  })

  it('does not interfere with normal component rendering', () => {
    render(
      <FeatureErrorBoundary featureName="TestFeature">
        <div>Normal content</div>
        <div>More content</div>
      </FeatureErrorBoundary>
    )
    
    expect(screen.getByText('Normal content')).toBeInTheDocument()
    expect(screen.getByText('More content')).toBeInTheDocument()
  })
})