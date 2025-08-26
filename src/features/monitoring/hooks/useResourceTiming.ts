import { useEffect, useCallback } from 'react';
import type { CustomMetric } from '../types/metrics';
import { performanceService } from '../services/performanceService';

interface ResourceMetrics {
  name: string;
  type: string;
  size: number;
  duration: number;
  cached: boolean;
}

export function useResourceTiming() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // Set up PerformanceObserver for resource timing
    let observer: PerformanceObserver | null = null;
    
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            
            // Skip very small resources (likely tracking pixels)
            if (resource.transferSize < 100) continue;
            
            const metric: CustomMetric = {
              name: 'Resource Load',
              value: resource.duration,
              unit: 'ms',
              timestamp: Date.now(),
              tags: {
                url: resource.name,
                type: detectResourceType(resource.name),
                size: formatBytes(resource.transferSize),
                cached: resource.transferSize === 0 ? 'true' : 'false',
                protocol: resource.nextHopProtocol || 'unknown'
              }
            };
            
            performanceService.trackCustomMetric(metric);
            
            // Track slow resources
            if (resource.duration > 1000) {
              console.warn(`Slow resource load: ${resource.name} took ${Math.round(resource.duration)}ms`);
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.error('Failed to set up resource timing observer:', error);
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  /**
   * Get all resource timing entries
   */
  const getResourceTimings = useCallback((): ResourceMetrics[] => {
    if (typeof window === 'undefined' || !performance.getEntriesByType) {
      return [];
    }

    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return entries.map(entry => ({
      name: entry.name,
      type: detectResourceType(entry.name),
      size: entry.transferSize,
      duration: entry.duration,
      cached: entry.transferSize === 0
    }));
  }, []);

  /**
   * Get resource timing by type
   */
  const getResourcesByType = useCallback((type: 'script' | 'css' | 'image' | 'font' | 'fetch'): ResourceMetrics[] => {
    return getResourceTimings().filter(resource => resource.type === type);
  }, [getResourceTimings]);

  /**
   * Calculate total resource size
   */
  const getTotalResourceSize = useCallback((): number => {
    return getResourceTimings().reduce((total, resource) => total + resource.size, 0);
  }, [getResourceTimings]);

  /**
   * Get slowest resources
   */
  const getSlowestResources = useCallback((limit = 10): ResourceMetrics[] => {
    return getResourceTimings()
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }, [getResourceTimings]);

  /**
   * Get largest resources
   */
  const getLargestResources = useCallback((limit = 10): ResourceMetrics[] => {
    return getResourceTimings()
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }, [getResourceTimings]);

  /**
   * Clear resource timing buffer
   */
  const clearResourceTimings = useCallback(() => {
    if (typeof window !== 'undefined' && performance.clearResourceTimings) {
      performance.clearResourceTimings();
    }
  }, []);

  /**
   * Monitor specific resource patterns
   */
  const monitorResourcePattern = useCallback((pattern: RegExp, callback: (resource: ResourceMetrics) => void) => {
    const checkResources = () => {
      const resources = getResourceTimings();
      resources.forEach(resource => {
        if (pattern.test(resource.name)) {
          callback(resource);
        }
      });
    };

    // Check immediately and then periodically
    checkResources();
    const interval = setInterval(checkResources, 5000);

    return () => clearInterval(interval);
  }, [getResourceTimings]);

  return {
    getResourceTimings,
    getResourcesByType,
    getTotalResourceSize,
    getSlowestResources,
    getLargestResources,
    clearResourceTimings,
    monitorResourcePattern
  };
}

/**
 * Detect resource type from URL
 */
function detectResourceType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
  
  const typeMap: Record<string, string> = {
    // Scripts
    'js': 'script',
    'mjs': 'script',
    'jsx': 'script',
    'ts': 'script',
    'tsx': 'script',
    
    // Styles
    'css': 'css',
    'scss': 'css',
    'sass': 'css',
    'less': 'css',
    
    // Images
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'webp': 'image',
    'svg': 'image',
    'ico': 'image',
    'avif': 'image',
    
    // Fonts
    'woff': 'font',
    'woff2': 'font',
    'ttf': 'font',
    'otf': 'font',
    'eot': 'font',
    
    // Data
    'json': 'fetch',
    'xml': 'fetch',
    'html': 'document',
    'htm': 'document'
  };
  
  if (!extension) {
    // Check for API calls
    if (url.includes('/api/') || url.includes('/graphql')) {
      return 'fetch';
    }
    return 'other';
  }
  
  return typeMap[extension] || 'other';
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}