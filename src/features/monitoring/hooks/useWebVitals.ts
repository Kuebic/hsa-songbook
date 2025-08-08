import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { performanceService } from '../services/performanceService';

export function useWebVitals(reporter?: (metric: Metric) => void) {
  useEffect(() => {
    // Only load in production
    if (import.meta.env.PROD) {
      // Lazy load web-vitals to avoid affecting initial bundle
      import('web-vitals/attribution').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
        const handleMetric = (metric: Metric) => {
          // Report to custom reporter if provided
          reporter?.(metric);
          
          // Always report to performance service
          performanceService.reportMetric(metric);
        };

        // Core Web Vitals
        onCLS(handleMetric); // Cumulative Layout Shift
        onINP(handleMetric); // Interaction to Next Paint (replaced FID)
        onLCP(handleMetric); // Largest Contentful Paint
        
        // Additional metrics
        onFCP(handleMetric); // First Contentful Paint
        onTTFB(handleMetric); // Time to First Byte
      });
    }
  }, [reporter]);
}