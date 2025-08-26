import { useCallback, useEffect, useRef } from 'react';
import type { CustomMetric } from '../types/metrics';
import { performanceService } from '../services/performanceService';

interface PerformanceMarks {
  [key: string]: number;
}

export function usePerformanceMetrics() {
  const marks = useRef<PerformanceMarks>({});
  const observer = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // Set up PerformanceObserver for custom marks and measures
    try {
      observer.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            const metric: CustomMetric = {
              name: entry.name,
              value: entry.duration,
              unit: 'ms',
              timestamp: Date.now(),
              tags: {
                type: 'measure',
                startMark: (entry as PerformanceMeasure).detail?.startMark || '',
                endMark: (entry as PerformanceMeasure).detail?.endMark || ''
              }
            };
            performanceService.trackCustomMetric(metric);
          }
        }
      });

      observer.current.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.error('Failed to set up PerformanceObserver:', error);
    }

    return () => {
      observer.current?.disconnect();
    };
  }, []);

  /**
   * Track a custom metric with a value
   */
  const trackMetric = useCallback((
    name: string, 
    value: number, 
    unit: CustomMetric['unit'] = 'ms',
    tags?: Record<string, string>
  ) => {
    const metric: CustomMetric = {
      name,
      value,
      unit,
      tags,
      timestamp: Date.now()
    };
    
    performanceService.trackCustomMetric(metric);
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Custom Metric] ${name}: ${value}${unit}`, tags);
    }
  }, []);

  /**
   * Start timing for a specific operation
   */
  const startTiming = useCallback((markName: string) => {
    marks.current[markName] = performance.now();
    
    // Also create a performance mark
    try {
      performance.mark(markName);
    } catch (error) {
      console.error(`Failed to create mark ${markName}:`, error);
    }
  }, []);

  /**
   * End timing for a specific operation and track the duration
   */
  const endTiming = useCallback((markName: string, metricName?: string) => {
    const startTime = marks.current[markName];
    if (startTime === undefined) {
      console.warn(`No start mark found for ${markName}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Clean up the mark
    delete marks.current[markName];
    
    // Create performance measure
    const endMarkName = `${markName}-end`;
    try {
      performance.mark(endMarkName);
      performance.measure(
        metricName || markName,
        markName,
        endMarkName
      );
    } catch (error) {
      console.error(`Failed to create measure for ${markName}:`, error);
    }
    
    // Track the metric
    trackMetric(metricName || markName, duration, 'ms', {
      type: 'timing',
      markName
    });
    
    return duration;
  }, [trackMetric]);

  /**
   * Measure the duration of an async operation
   */
  const measureDuration = useCallback(async <T,>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      trackMetric(name, duration, 'ms', {
        type: 'async-operation',
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      trackMetric(name, duration, 'ms', {
        type: 'async-operation',
        status: 'error',
        error: (error as Error).message
      });
      
      throw error;
    }
  }, [trackMetric]);

  /**
   * Track API response time
   */
  const trackApiResponse = useCallback((
    endpoint: string,
    duration: number,
    status: number,
    method: string = 'GET'
  ) => {
    trackMetric('API Response', duration, 'ms', {
      endpoint,
      status: status.toString(),
      method,
      statusGroup: status < 300 ? 'success' : status < 400 ? 'redirect' : status < 500 ? 'client-error' : 'server-error'
    });
  }, [trackMetric]);

  /**
   * Track database query time
   */
  const trackDbQuery = useCallback((
    table: string,
    operation: string,
    duration: number,
    resultCount?: number
  ) => {
    trackMetric('DB Query', duration, 'ms', {
      table,
      operation,
      resultCount: resultCount?.toString() || 'unknown'
    });
  }, [trackMetric]);

  /**
   * Track render performance
   */
  const trackRenderTime = useCallback((
    componentName: string,
    duration: number
  ) => {
    trackMetric('Render Time', duration, 'ms', {
      component: componentName,
      frameRate: duration <= 16 ? 'smooth' : duration <= 33 ? 'acceptable' : 'janky'
    });
  }, [trackMetric]);

  /**
   * Track bundle load time
   */
  const trackBundleLoad = useCallback((
    bundleName: string,
    duration: number,
    size?: number
  ) => {
    trackMetric('Bundle Load', duration, 'ms', {
      bundle: bundleName,
      size: size ? `${(size / 1024).toFixed(2)}KB` : 'unknown'
    });
  }, [trackMetric]);

  /**
   * Track user interaction
   */
  const trackInteraction = useCallback((
    action: string,
    target: string,
    duration?: number
  ) => {
    trackMetric('User Interaction', duration || 0, 'ms', {
      action,
      target,
      timestamp: new Date().toISOString()
    });
  }, [trackMetric]);

  return {
    trackMetric,
    startTiming,
    endTiming,
    measureDuration,
    trackApiResponse,
    trackDbQuery,
    trackRenderTime,
    trackBundleLoad,
    trackInteraction
  };
}