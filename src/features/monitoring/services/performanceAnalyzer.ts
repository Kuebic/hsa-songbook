import type { PerformanceStats, PerformanceThreshold, PerformanceAlert, WebVitalMetric, CustomMetric } from '../types/metrics';
import type { UnknownObject } from '../../../shared/types/common';
import { getThreshold } from '../utils/thresholds';
import { errorReportingService } from './errorReportingService';

export class PerformanceAnalyzer {
  private metrics: Map<string, number[]> = new Map();
  private alertHistory: PerformanceAlert[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private readonly maxMetricsSize = 1000;
  private readonly alertCooldown = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Add a metric value for analysis
   */
  addMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep last N samples
    if (values.length > this.maxMetricsSize) {
      values.shift();
    }
    
    // Check for threshold violations
    this.checkThresholds(name, values);
  }

  /**
   * Add a web vital metric
   */
  addWebVital(metric: WebVitalMetric): void {
    this.addMetric(metric.name, metric.value);
  }

  /**
   * Add a custom metric
   */
  addCustomMetric(metric: CustomMetric): void {
    this.addMetric(metric.name, metric.value);
  }

  /**
   * Check if metric violates thresholds
   */
  private checkThresholds(metric: string, values: number[]): void {
    const threshold = getThreshold(metric);
    if (!threshold?.alerting.enabled) return;
    
    // Check cooldown
    const lastAlert = this.lastAlertTime.get(metric) || 0;
    if (Date.now() - lastAlert < this.alertCooldown) return;
    
    // Get recent samples within time window
    const recentValues = values.slice(-threshold.alerting.minSamples);
    
    if (recentValues.length < threshold.alerting.minSamples) return;
    
    // Calculate P75 of recent samples
    const p75 = this.percentile(recentValues, 75);
    
    if (p75 > threshold.alerting.threshold) {
      this.triggerAlert(metric, p75, threshold);
      this.lastAlertTime.set(metric, Date.now());
    }
  }

  /**
   * Trigger an alert for a metric
   */
  private triggerAlert(metric: string, value: number, threshold: PerformanceThreshold): void {
    const alert: PerformanceAlert = {
      metric,
      value,
      threshold: threshold.alerting.threshold,
      severity: value > threshold.poor ? 'critical' : 'warning',
      timestamp: Date.now(),
      message: `Performance degradation detected for ${metric}`
    };
    
    this.alertHistory.push(alert);
    
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }
    
    // Send to error reporting service
    errorReportingService.reportError(
      new Error(alert.message),
      {
        level: alert.severity === 'critical' ? 'error' : 'warning',
        timestamp: Date.now(),
        metric,
        value,
        threshold: threshold.alerting.threshold,
        p75: value,
        severity: alert.severity
      }
    );

    // Log to console in development
    if (import.meta.env.DEV) {
      const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
      console.warn(`${emoji} Performance Alert: ${metric} = ${Math.round(value)}ms (threshold: ${threshold.alerting.threshold}ms)`);
    }
  }

  /**
   * Get statistics for a metric
   */
  getStats(metric: string): PerformanceStats | null {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      mean: this.mean(values),
      median: this.percentile(sorted, 50),
      p75: this.percentile(sorted, 75),
      p90: this.percentile(sorted, 90),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * Get aggregated stats for all metrics
   */
  getAllStats(): Map<string, PerformanceStats> {
    const allStats = new Map<string, PerformanceStats>();
    
    Array.from(this.metrics.keys()).forEach(metric => {
      const stats = this.getStats(metric);
      if (stats) {
        allStats.set(metric, stats);
      }
    });
    
    return allStats;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10): PerformanceAlert[] {
    return this.alertHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get alerts within time range
   */
  getAlertsInRange(startTime: number, endTime: number): PerformanceAlert[] {
    return this.alertHistory.filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    );
  }

  /**
   * Detect anomalies using statistical methods
   */
  detectAnomalies(metric: string, sensitivity = 2): number[] {
    const values = this.metrics.get(metric);
    if (!values || values.length < 10) return [];
    
    const stats = this.getStats(metric);
    if (!stats) return [];
    
    // Use IQR method for outlier detection
    const q1 = this.percentile(values, 25);
    const q3 = this.percentile(values, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - sensitivity * iqr;
    const upperBound = q3 + sensitivity * iqr;
    
    const anomalies: number[] = [];
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        anomalies.push(index);
      }
    });
    
    return anomalies;
  }

  /**
   * Calculate trend for a metric
   */
  calculateTrend(metric: string, windowSize = 20): 'improving' | 'degrading' | 'stable' {
    const values = this.metrics.get(metric);
    if (!values || values.length < windowSize * 2) return 'stable';
    
    // Compare recent window to previous window
    const recent = values.slice(-windowSize);
    const previous = values.slice(-windowSize * 2, -windowSize);
    
    const recentAvg = this.mean(recent);
    const previousAvg = this.mean(previous);
    
    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    // Consider ±5% as stable
    if (Math.abs(changePercent) < 5) return 'stable';
    
    // Lower values are better for performance metrics
    return changePercent < 0 ? 'improving' : 'degrading';
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const webVitals = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
    let totalScore = 0;
    let count = 0;
    
    for (const vital of webVitals) {
      const stats = this.getStats(vital);
      if (!stats) continue;
      
      const threshold = getThreshold(vital);
      if (!threshold) continue;
      
      // Calculate score based on median value
      let score = 100;
      if (stats.median <= threshold.good) {
        score = 100;
      } else if (stats.median <= threshold.needsImprovement) {
        // Linear interpolation between good and needs improvement
        const ratio = (stats.median - threshold.good) / (threshold.needsImprovement - threshold.good);
        score = 100 - (ratio * 25); // 75-100 range
      } else {
        // Linear interpolation for poor performance
        const ratio = Math.min((stats.median - threshold.needsImprovement) / threshold.needsImprovement, 1);
        score = 75 - (ratio * 75); // 0-75 range
      }
      
      totalScore += score;
      count++;
    }
    
    return count > 0 ? Math.round(totalScore / count) : 0;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.alertHistory = [];
    this.lastAlertTime.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const data: UnknownObject = {
      timestamp: new Date().toISOString(),
      metrics: {},
      alerts: this.alertHistory,
      score: this.getPerformanceScore()
    };
    
    Array.from(this.metrics.entries()).forEach(([metric, values]) => {
      (data.metrics as Record<string, unknown>)[metric] = {
        values: values.slice(-100), // Last 100 values
        stats: this.getStats(metric),
        trend: this.calculateTrend(metric)
      };
    });
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// Create singleton instance
export const performanceAnalyzer = new PerformanceAnalyzer();