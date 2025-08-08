import { useEffect, useState } from 'react';
import { performanceService } from '../services/performanceService';
import type { Metric } from 'web-vitals';

interface PerformanceMonitorProps {
  showInDevelopment?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceMonitor({ 
  showInDevelopment = true, 
  position = 'bottom-right' 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development if configured
    if (!showInDevelopment || import.meta.env.PROD) {
      return;
    }

    // Poll for metrics snapshot
    const interval = setInterval(() => {
      const snapshot = performanceService.getSnapshot();
      if (snapshot.length > 0) {
        setMetrics(snapshot);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showInDevelopment]);

  // Don't render in production unless explicitly configured
  if (import.meta.env.PROD && !showInDevelopment) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-right': { bottom: '1rem', right: '1rem' }
  };

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 9999,
          padding: '0.5rem',
          backgroundColor: '#1f2937',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          cursor: 'pointer'
        }}
      >
        {isVisible ? 'Hide' : 'Show'} Metrics
      </button>

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            ...positionStyles[position],
            marginTop: '2.5rem',
            zIndex: 9998,
            padding: '1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '200px',
            maxWidth: '300px'
          }}
        >
          <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Performance Metrics
          </h3>
          {metrics.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
              No metrics collected yet
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {metrics.map((metric, index) => (
                <li key={`${metric.name}-${index}`} style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  <strong>{metric.name}:</strong> {Math.round(metric.value)}ms
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}