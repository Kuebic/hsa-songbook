import type { Metric } from 'web-vitals';

class PerformanceService {
  private buffer: Metric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  reportMetric(metric: Metric) {
    // Add to buffer
    this.buffer.push(metric);
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
    }
    
    // Schedule flush
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    
    this.flushTimer = setTimeout(() => {
      this.flush();
      this.flushTimer = null;
    }, 5000); // Flush every 5 seconds
  }

  private flush() {
    if (this.buffer.length === 0) return;
    
    const metrics = [...this.buffer];
    this.buffer = [];
    
    // Send to analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as typeof window & { gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void }).gtag;
      if (gtag && typeof gtag === 'function') {
        metrics.forEach(metric => {
          gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_category: 'Web Vitals',
            event_label: metric.id,
            non_interaction: true
          });
        });
      }
    }
    
    // Send to custom endpoint
    if (import.meta.env.VITE_METRICS_ENDPOINT) {
      fetch(import.meta.env.VITE_METRICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, timestamp: Date.now() })
      }).catch(error => {
        console.error('Failed to send metrics:', error);
      });
    }
  }

  // Get current metrics snapshot
  getSnapshot() {
    return [...this.buffer];
  }
}

export const performanceService = new PerformanceService();