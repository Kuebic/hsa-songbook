import type { Metric } from 'web-vitals';
import type { WebVitalMetric, CustomMetric, PerformanceStats } from '../types/metrics';
import { performanceReporter } from './performanceReporter';
import { performanceAnalyzer } from './performanceAnalyzer';

class PerformanceService {
  private buffer: Metric[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  /**
   * Report a raw web vitals metric (legacy support)
   */
  reportMetric(metric: Metric) {
    // Add to buffer for backward compatibility
    this.buffer.push(metric);
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
    }
    
    // Schedule flush
    this.scheduleFlush();
  }

  /**
   * Report an enriched web vital metric
   */
  reportWebVital(metric: WebVitalMetric) {
    performanceReporter.reportWebVital(metric);
  }

  /**
   * Track a custom metric
   */
  trackCustomMetric(metric: CustomMetric) {
    performanceReporter.reportCustomMetric(metric);
  }

  /**
   * Track a web vital (enhanced version)
   */
  trackWebVital(metric: WebVitalMetric) {
    performanceReporter.reportWebVital(metric);
  }

  /**
   * Get aggregated statistics for a time range
   */
  async getAggregatedStats(_timeRange: '1h' | '24h' | '7d' | '30d'): Promise<Map<string, PerformanceStats>> {
    // TODO: Implement time range filtering
    return performanceAnalyzer.getAllStats();
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    return performanceAnalyzer.getPerformanceScore();
  }

  /**
   * Get recent performance alerts
   */
  getRecentAlerts(limit = 10) {
    return performanceAnalyzer.getRecentAlerts(limit);
  }

  /**
   * Get metric trend
   */
  getMetricTrend(metric: string) {
    return performanceAnalyzer.calculateTrend(metric);
  }

  /**
   * Force flush all pending metrics
   */
  async forceFlush() {
    await performanceReporter.forceFlush();
    this.flush();
  }

  /**
   * Legacy flush method for backward compatibility
   */
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
    
    // Send to analytics service (legacy support)
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
    
    // Send to custom endpoint (legacy support)
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

  /**
   * Get current metrics snapshot (legacy support)
   */
  getSnapshot() {
    return [...this.buffer];
  }

  /**
   * Export all metrics data
   */
  exportMetrics(): string {
    return performanceAnalyzer.exportMetrics();
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.buffer = [];
    performanceAnalyzer.clearMetrics();
  }
}

export const performanceService = new PerformanceService();