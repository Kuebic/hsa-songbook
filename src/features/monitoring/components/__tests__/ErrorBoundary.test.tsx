import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import React from 'react';

// Mock the errorReportingService
vi.mock('../../services/errorReportingService', () => ({
  errorReportingService: {
    reportError: vi.fn()
  }
}));

import { errorReportingService } from '../../services/errorReportingService';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('resets error boundary when reset button is clicked', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;
    
    const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;
    
    const { rerender } = render(
      <ErrorBoundary resetOnPropsChange>
        <TestComponent />
      </ErrorBoundary>
    );

    // Verify error state
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    // Click reset button
    const resetButton = screen.getByText('Try Again');
    await user.click(resetButton);

    // Change the prop and rerender to trigger reset
    shouldThrow = false;
    rerender(
      <ErrorBoundary resetOnPropsChange>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Verify normal state restored
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('uses custom fallback component when provided', () => {
    const CustomFallback: React.ComponentType<{ error: Error; resetErrorBoundary: () => void; errorInfo?: React.ErrorInfo }> = ({ error }) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
  });

  it('isolates error when isolate prop is true', () => {
    render(
      <ErrorBoundary isolate>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const container = screen.getByRole('alert').parentElement;
    expect(container).toHaveStyle({ isolation: 'isolate' });
  });

  it('applies correct error level', () => {
    render(
      <ErrorBoundary level="app">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(errorReportingService.reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        level: 'app'
      })
    );
  });
});