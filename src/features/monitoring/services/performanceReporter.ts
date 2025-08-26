import type { WebVitalMetric, CustomMetric } from '../types/metrics';
import type { UnknownObject, UnknownFunction, ExtendedWindow, ExtendedPerformance } from '../../../shared/types/common';
import { performanceAnalyzer } from './performanceAnalyzer';

interface MetricBatch {
  webVitals: WebVitalMetric[];
  customMetrics: CustomMetric[];
  timestamp: number;
  sessionId: string;
  url: string;
  userAgent: string;
}

interface QueuedBatch extends MetricBatch {
  retryCount: number;
  id: string;
}

export class PerformanceReporter {
  private buffer: MetricBatch = this.createEmptyBatch();
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly flushInterval = 5000; // 5 seconds
  private readonly maxBatchSize = 50;
  private readonly maxRetries = 3;
  private sessionId: string;
  private offlineQueue: QueuedBatch[] = [];
  private isOnline = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupNetworkListener();
    this.setupBeforeUnloadHandler();
    this.loadOfflineQueue();
  }

  /**
   * Report a web vital metric
   */
  reportWebVital(metric: WebVitalMetric): void {
    this.buffer.webVitals.push(metric);
    performanceAnalyzer.addWebVital(metric);
    this.scheduleFlush();
  }

  /**
   * Report a custom metric
   */
  reportCustomMetric(metric: CustomMetric): void {
    this.buffer.customMetrics.push(metric);
    performanceAnalyzer.addCustomMetric(metric);
    this.scheduleFlush();
  }

  /**
   * Schedule a flush of the buffer
   */
  private scheduleFlush(): void {
    // Flush immediately if batch is full
    const totalMetrics = this.buffer.webVitals.length + this.buffer.customMetrics.length;
    if (totalMetrics >= this.maxBatchSize) {
      this.flush();
      return;
    }

    // Schedule delayed flush
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }
  }

  /**
   * Flush the current buffer
   */
  async flush(): Promise<void> {
    // Cancel any pending flush
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Skip if buffer is empty
    const totalMetrics = this.buffer.webVitals.length + this.buffer.customMetrics.length;
    if (totalMetrics === 0) return;

    // Create batch and reset buffer
    const batch = { ...this.buffer };
    this.buffer = this.createEmptyBatch();

    // Send to various destinations
    await Promise.allSettled([
      this.sendToAnalytics(batch),
      this.sendToCustomEndpoint(batch),
      this.sendToSentry(batch)
    ]);

    // Process offline queue if online
    if (this.isOnline && this.offlineQueue.length > 0) {
      await this.processOfflineQueue();
    }
  }

  /**
   * Send metrics to Google Analytics
   */
  private async sendToAnalytics(batch: MetricBatch): Promise<void> {
    if (typeof window === 'undefined' || !('gtag' in window)) return;

    const gtag = (window as unknown as ExtendedWindow).gtag as UnknownFunction;
    if (!gtag || typeof gtag !== 'function') return;

    // Send web vitals
    batch.webVitals.forEach(metric => {
      gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        metric_navigation_type: metric.navigationType,
        event_category: 'Web Vitals',
        event_label: this.sessionId,
        non_interaction: true
      });
    });

    // Send custom metrics
    batch.customMetrics.forEach(metric => {
      gtag('event', 'custom_metric', {
        metric_name: metric.name,
        value: Math.round(metric.value),
        metric_unit: metric.unit,
        event_category: 'Performance',
        event_label: metric.name,
        custom_map: metric.tags,
        non_interaction: true
      });
    });
  }

  /**
   * Send metrics to custom endpoint
   */
  private async sendToCustomEndpoint(batch: MetricBatch): Promise<void> {
    const endpoint = import.meta.env.VITE_METRICS_ENDPOINT;
    if (!endpoint) return;

    const payload = {
      ...batch,
      environment: import.meta.env.MODE,
      timestamp: Date.now(),
      performance: {
        memory: (performance as unknown as ExtendedPerformance).memory ? {
          usedJSHeapSize: (performance as unknown as ExtendedPerformance).memory!.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as unknown as ExtendedPerformance).memory!.totalJSHeapSize || 0,
          jsHeapSizeLimit: (performance as unknown as ExtendedPerformance).memory!.jsHeapSizeLimit || 0
        } : undefined
      }
    };

    try {
      // Use sendBeacon if available for reliability
      if (navigator.sendBeacon && JSON.stringify(payload).length < 64000) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = navigator.sendBeacon(endpoint, blob);
        if (!sent) throw new Error('sendBeacon failed');
      } else {
        // Fallback to fetch
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Failed to send metrics to endpoint:', error);
      
      // Queue for retry if offline
      if (!this.isOnline || (error as Error).message.includes('Failed to fetch')) {
        this.queueForOffline(batch);
      }
    }
  }

  /**
   * Send metrics to Sentry
   */
  private async sendToSentry(batch: MetricBatch): Promise<void> {
    // Check if Sentry is available
    if (typeof window === 'undefined' || !(window as unknown as ExtendedWindow).Sentry) return;

    const Sentry = (window as unknown as ExtendedWindow).Sentry as UnknownObject;

    // Send web vitals as measurements
    batch.webVitals.forEach(metric => {
      if (typeof Sentry.addBreadcrumb === 'function') {
        (Sentry.addBreadcrumb as UnknownFunction)({
          category: 'web-vital',
          message: `${metric.name}: ${metric.value}ms (${metric.rating})`,
          level: metric.rating === 'poor' ? 'warning' : 'info',
          data: {
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            navigationType: metric.navigationType,
            attribution: metric.attribution
          }
        });
      }
    });

    // Send custom metrics as breadcrumbs
    batch.customMetrics.forEach(metric => {
      if (typeof Sentry.addBreadcrumb === 'function') {
        (Sentry.addBreadcrumb as UnknownFunction)({
          category: 'custom-metric',
          message: `${metric.name}: ${metric.value}${metric.unit}`,
          level: 'info',
          data: {
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            tags: metric.tags
          }
        });
      }
    });
  }

  /**
   * Queue batch for offline processing
   */
  private queueForOffline(batch: MetricBatch): void {
    const queuedBatch: QueuedBatch = {
      ...batch,
      retryCount: 0,
      id: this.generateBatchId()
    };

    this.offlineQueue.push(queuedBatch);
    this.saveOfflineQueue();

    // Limit queue size
    if (this.offlineQueue.length > 100) {
      this.offlineQueue = this.offlineQueue.slice(-100);
      this.saveOfflineQueue();
    }
  }

  /**
   * Process offline queue
   */
  private async processOfflineQueue(): Promise<void> {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const batch of queue) {
      if (batch.retryCount >= this.maxRetries) {
        console.warn('Dropping batch after max retries:', batch.id);
        continue;
      }

      try {
        await this.sendToCustomEndpoint(batch);
      } catch (_error) {
        batch.retryCount++;
        this.offlineQueue.push(batch);
      }
    }

    this.saveOfflineQueue();
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('performance_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('performance_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Setup network status listener
   */
  private setupNetworkListener(): void {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Setup beforeunload handler to flush metrics
   */
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      // Synchronously flush any remaining metrics
      const totalMetrics = this.buffer.webVitals.length + this.buffer.customMetrics.length;
      if (totalMetrics > 0) {
        const endpoint = import.meta.env.VITE_METRICS_ENDPOINT;
        if (endpoint && navigator.sendBeacon) {
          const payload = JSON.stringify(this.buffer);
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(endpoint, blob);
        }
      }
    });
  }

  /**
   * Create an empty batch
   */
  private createEmptyBatch(): MetricBatch {
    return {
      webVitals: [],
      customMetrics: [],
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate a batch ID
   */
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Force flush all metrics
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

// Create singleton instance
export const performanceReporter = new PerformanceReporter();