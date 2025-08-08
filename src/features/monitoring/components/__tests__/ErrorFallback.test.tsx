import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorFallback } from '../ErrorFallback';

interface MockLocation {
  href: string;
}

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message');
  const mockResetErrorBoundary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    delete (window as unknown as { location: unknown }).location;
    (window as unknown as { location: MockLocation }).location = { href: '' };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders error message', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry for the inconvenience/)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    // Mock development environment
    vi.stubEnv('DEV', true);

    mockError.stack = 'Error stack trace';
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('hides error details in production mode', () => {
    // Mock production environment
    vi.stubEnv('DEV', false);

    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
  });

  it('calls resetErrorBoundary when Try Again is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    const tryAgainButton = screen.getByText('Try Again');
    await user.click(tryAgainButton);

    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('navigates to home when Go to Home is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    const goHomeButton = screen.getByText('Go to Home');
    await user.click(goHomeButton);

    expect(window.location.href).toBe('/');
  });

  it('renders with proper styling', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toHaveStyle({
      backgroundColor: 'rgb(59, 130, 246)',
      color: 'rgb(255, 255, 255)'
    });

    const goHomeButton = screen.getByText('Go to Home');
    expect(goHomeButton).toHaveStyle({
      backgroundColor: 'rgb(229, 231, 235)',
      color: 'rgb(55, 65, 81)'
    });
  });
});