import type { PerformanceThreshold } from '../types/metrics'

// Core Web Vitals thresholds based on web.dev/vitals
const WEB_VITALS_THRESHOLDS: Record<string, PerformanceThreshold> = {
  LCP: {
    metric: 'LCP',
    good: 2500,
    needsImprovement: 4000,
    poor: 4000,
    alerting: {
      enabled: true,
      threshold: 4000,
      window: 5,
      minSamples: 10
    }
  },
  INP: {
    metric: 'INP',
    good: 200,
    needsImprovement: 500,
    poor: 500,
    alerting: {
      enabled: true,
      threshold: 500,
      window: 5,
      minSamples: 5
    }
  },
  CLS: {
    metric: 'CLS',
    good: 0.1,
    needsImprovement: 0.25,
    poor: 0.25,
    alerting: {
      enabled: true,
      threshold: 0.25,
      window: 5,
      minSamples: 10
    }
  },
  FCP: {
    metric: 'FCP',
    good: 1800,
    needsImprovement: 3000,
    poor: 3000,
    alerting: {
      enabled: true,
      threshold: 3000,
      window: 5,
      minSamples: 10
    }
  },
  TTFB: {
    metric: 'TTFB',
    good: 800,
    needsImprovement: 1800,
    poor: 1800,
    alerting: {
      enabled: true,
      threshold: 1800,
      window: 5,
      minSamples: 10
    }
  },
  FID: {
    metric: 'FID',
    good: 100,
    needsImprovement: 300,
    poor: 300,
    alerting: {
      enabled: false, // FID is deprecated in favor of INP
      threshold: 300,
      window: 5,
      minSamples: 5
    }
  }
}

// Custom application metrics thresholds
const CUSTOM_METRICS_THRESHOLDS: Record<string, PerformanceThreshold> = {
  'API Response': {
    metric: 'API Response',
    good: 200,
    needsImprovement: 500,
    poor: 1000,
    alerting: {
      enabled: true,
      threshold: 1000,
      window: 5,
      minSamples: 20
    }
  },
  'DB Query': {
    metric: 'DB Query',
    good: 100,
    needsImprovement: 300,
    poor: 500,
    alerting: {
      enabled: true,
      threshold: 500,
      window: 5,
      minSamples: 20
    }
  },
  'Render Time': {
    metric: 'Render Time',
    good: 16,
    needsImprovement: 33,
    poor: 50,
    alerting: {
      enabled: true,
      threshold: 50,
      window: 5,
      minSamples: 50
    }
  },
  'Bundle Load': {
    metric: 'Bundle Load',
    good: 1000,
    needsImprovement: 2000,
    poor: 3000,
    alerting: {
      enabled: true,
      threshold: 3000,
      window: 5,
      minSamples: 10
    }
  }
}

/**
 * Get threshold configuration for a metric
 */
export function getThreshold(metric: string): PerformanceThreshold | undefined {
  return WEB_VITALS_THRESHOLDS[metric] || CUSTOM_METRICS_THRESHOLDS[metric]
}

/**
 * Get rating for a metric value
 */
export function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = getThreshold(metric)
  if (!threshold) return 'good' // Default to good if no threshold defined

  if (value <= threshold.good) {
    return 'good'
  } else if (value <= threshold.needsImprovement) {
    return 'needs-improvement'
  }
  return 'poor'
}

/**
 * Check if a metric value is good
 */
export function isGoodMetric(metric: string, value: number): boolean {
  return getRating(metric, value) === 'good'
}

/**
 * Check if a metric value needs improvement
 */
export function needsImprovement(metric: string, value: number): boolean {
  return getRating(metric, value) === 'needs-improvement'
}

/**
 * Check if a metric value is poor
 */
export function isPoorMetric(metric: string, value: number): boolean {
  return getRating(metric, value) === 'poor'
}

/**
 * Check if alerting should be triggered for a metric
 */
export function shouldAlert(metric: string, value: number): boolean {
  const threshold = getThreshold(metric)
  if (!threshold || !threshold.alerting.enabled) return false
  
  return value > threshold.alerting.threshold
}

/**
 * Get display color for metric rating
 */
export function getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return '#10b981' // green-500
    case 'needs-improvement':
      return '#f59e0b' // amber-500
    case 'poor':
      return '#ef4444' // red-500
    default:
      return '#6b7280' // gray-500
  }
}

/**
 * Get display emoji for metric rating
 */
export function getRatingEmoji(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return '✅'
    case 'needs-improvement':
      return '⚠️'
    case 'poor':
      return '❌'
    default:
      return '❓'
  }
}

/**
 * Format metric value for display
 */
export function formatMetricValue(metric: string, value: number): string {
  // CLS is a unitless score
  if (metric === 'CLS') {
    return value.toFixed(3)
  }
  
  // All other metrics are in milliseconds
  if (value < 1000) {
    return `${Math.round(value)}ms`
  } else {
    return `${(value / 1000).toFixed(2)}s`
  }
}

/**
 * Get all web vitals metrics
 */
export function getWebVitalsMetrics(): string[] {
  return Object.keys(WEB_VITALS_THRESHOLDS)
}

/**
 * Get all custom metrics
 */
export function getCustomMetrics(): string[] {
  return Object.keys(CUSTOM_METRICS_THRESHOLDS)
}

/**
 * Get all metrics with thresholds
 */
export function getAllMetrics(): string[] {
  return [...getWebVitalsMetrics(), ...getCustomMetrics()]
}

/**
 * Update threshold for a metric (runtime configuration)
 */
export function updateThreshold(metric: string, threshold: Partial<PerformanceThreshold>): void {
  const existing = getThreshold(metric)
  if (existing) {
    Object.assign(existing, threshold)
  }
}