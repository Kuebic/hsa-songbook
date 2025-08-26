import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { performanceService } from '../services/performanceService';
import { getRating } from '../utils/thresholds';
import type { WebVitalMetric } from '../types/metrics';
import type { NetworkConnection } from '../../../shared/types/common';

export function useWebVitals(reporter?: (metric: Metric) => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only load in production or if explicitly enabled
    if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_MONITORING === 'true') {
      // Dynamic import for tree-shaking
      import('web-vitals/attribution').then(({
        onCLS,
        onINP,
        onLCP,
        onFCP,
        onTTFB
      }) => {
        const reportMetric = (metric: any) => {
          // Calculate rating based on thresholds
          const rating = getRating(metric.name, metric.value);
          
          // Check network conditions
          const connection = (navigator as any).connection as NetworkConnection | undefined;
          if (connection?.saveData) return; // Skip in data saver mode
          
          // Enrich metric with context
          const enrichedMetric: WebVitalMetric = {
            name: metric.name as WebVitalMetric['name'],
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            rating,
            delta: metric.delta,
            navigationType: metric.navigationType || 'navigate',
            attribution: metric.attribution
          };

          // Report to custom reporter if provided
          reporter?.(metric);
          
          // Always report to performance service
          performanceService.reportWebVital(enrichedMetric);
          
          // Log poor metrics in development
          if (import.meta.env.DEV && rating === 'poor') {
            console.warn(`⚠️ Poor ${metric.name} performance:`, {
              value: metric.value,
              rating,
              attribution: metric.attribution
            });
          }
        };

        // Track all Core Web Vitals
        onCLS(reportMetric);
        onINP(reportMetric); // Replaces FID in 2024
        onLCP(reportMetric);
        onFCP(reportMetric);
        onTTFB(reportMetric);
      }).catch(error => {
        console.error('Failed to load web-vitals:', error);
      });
    }
  }, [reporter]);
}