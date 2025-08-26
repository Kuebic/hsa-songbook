import { useEffect, useState } from 'react';
import { performanceService } from '../services/performanceService';
import { performanceAnalyzer } from '../services/performanceAnalyzer';
import { getRating, getRatingEmoji, formatMetricValue } from '../utils/thresholds';
import { getNetworkInfo } from '../utils/networkDetection';
import type { Metric } from 'web-vitals';
import type { PerformanceStats } from '../types/metrics';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

export function PerformanceMonitor({ 
  showInProduction = false, 
  position = 'bottom-right',
  compact = false
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [stats, setStats] = useState<Map<string, PerformanceStats>>(new Map());
  const [isVisible, setIsVisible] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    // Show in development by default, in production only if explicitly configured
    const shouldShow = import.meta.env.DEV || (import.meta.env.PROD && showInProduction);
    if (!shouldShow) {
      return;
    }

    // Poll for metrics
    const loadMetrics = () => {
      const snapshot = performanceService.getSnapshot();
      if (snapshot.length > 0) {
        setMetrics(snapshot);
      }
      
      // Get aggregated stats
      const allStats = performanceAnalyzer.getAllStats();
      setStats(allStats);
      
      // Get performance score
      const score = performanceService.getPerformanceScore();
      setPerformanceScore(score);
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 2000);
    return () => clearInterval(interval);
  }, [showInProduction]);

  // Don't render if conditions aren't met
  const shouldRender = import.meta.env.DEV || (import.meta.env.PROD && showInProduction);
  if (!shouldRender) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-right': { bottom: '1rem', right: '1rem' }
  };

  const networkInfo = getNetworkInfo();
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 75) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 9999,
          padding: compact ? '0.25rem 0.5rem' : '0.5rem 0.75rem',
          backgroundColor: '#1f2937',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: compact ? '0.625rem' : '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {performanceScore > 0 && (
          <span style={{ 
            color: getScoreColor(performanceScore),
            fontWeight: 'bold' 
          }}>
            {performanceScore}
          </span>
        )}
        {isVisible ? 'Hide' : 'Show'} Metrics
      </button>

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            ...positionStyles[position],
            marginTop: position.startsWith('top') ? '2.5rem' : undefined,
            marginBottom: position.startsWith('bottom') ? '2.5rem' : undefined,
            zIndex: 9998,
            padding: compact ? '0.75rem' : '1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: compact ? '200px' : '280px',
            maxWidth: compact ? '250px' : '350px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.75rem',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '0.5rem'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: compact ? '0.75rem' : '0.875rem', 
              fontWeight: 600 
            }}>
              Performance Monitor
            </h3>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: getScoreColor(performanceScore)
            }}>
              {performanceScore}/100
            </div>
          </div>

          {/* Network Status */}
          <div style={{
            padding: '0.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.25rem',
            marginBottom: '0.75rem',
            fontSize: compact ? '0.625rem' : '0.7rem'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Network Status</div>
            <div style={{ color: '#6b7280' }}>
              Type: {networkInfo.effectiveType} | 
              RTT: {networkInfo.rtt}ms | 
              Speed: {networkInfo.downlink}Mbps
            </div>
          </div>

          {/* Web Vitals */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: compact ? '0.7rem' : '0.75rem', 
              fontWeight: 600,
              color: '#374151'
            }}>
              Core Web Vitals
            </h4>
            {stats.size === 0 ? (
              <p style={{ 
                margin: 0, 
                fontSize: compact ? '0.625rem' : '0.75rem', 
                color: '#6b7280' 
              }}>
                Collecting metrics...
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].map(metricName => {
                  const stat = stats.get(metricName);
                  if (!stat) return null;
                  
                  const rating = getRating(metricName, stat.median);
                  const emoji = getRatingEmoji(rating);
                  
                  return (
                    <div 
                      key={metricName}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.25rem',
                        fontSize: compact ? '0.625rem' : '0.75rem'
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>
                        {metricName} {emoji}
                      </span>
                      <span style={{ fontFamily: 'monospace' }}>
                        {formatMetricValue(metricName, stat.median)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Metrics (Legacy) */}
          {metrics.length > 0 && !compact && (
            <div style={{ 
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <h4 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                color: '#374151'
              }}>
                Recent Updates
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {metrics.slice(-3).map((metric, index) => (
                  <li 
                    key={`${metric.name}-${index}`} 
                    style={{ 
                      fontSize: '0.7rem', 
                      marginBottom: '0.25rem',
                      color: '#6b7280'
                    }}
                  >
                    {metric.name}: {Math.round(metric.value)}ms
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}