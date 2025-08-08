import type { ErrorFallbackProps } from '../types/monitoring.types';

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div role="alert" style={styles.container}>
      <div style={styles.content}>
        <h2 style={styles.title}>Oops! Something went wrong</h2>
        <p style={styles.message}>
          We're sorry for the inconvenience. The application encountered an unexpected error.
        </p>
        
        {import.meta.env.DEV && (
          <details style={styles.details}>
            <summary style={styles.summary}>Error Details (Development Only)</summary>
            <pre style={styles.errorStack}>{error.message}</pre>
            <pre style={styles.errorStack}>{error.stack}</pre>
          </details>
        )}
        
        <div style={styles.actions}>
          <button onClick={resetErrorBoundary} style={styles.button}>
            Try Again
          </button>
          <button onClick={() => window.location.href = '/'} style={styles.buttonSecondary}>
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '2rem',
    backgroundColor: '#f9fafb'
  },
  content: {
    maxWidth: '600px',
    textAlign: 'center' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '1rem'
  },
  message: {
    color: '#6b7280',
    marginBottom: '1.5rem',
    lineHeight: 1.6
  },
  details: {
    marginTop: '1rem',
    marginBottom: '1rem',
    textAlign: 'left' as const,
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '4px',
    padding: '1rem'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 500,
    color: '#991b1b',
    marginBottom: '0.5rem'
  },
  errorStack: {
    fontSize: '0.875rem',
    overflow: 'auto',
    backgroundColor: '#fee2e2',
    padding: '0.5rem',
    borderRadius: '4px',
    marginTop: '0.5rem'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer'
  }
};