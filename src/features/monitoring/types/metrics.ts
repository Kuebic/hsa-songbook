export interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore'
  attribution?: Record<string, unknown> // Detailed attribution data
}

export interface CustomMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent'
  tags?: Record<string, string>
  timestamp: number
}

export interface PerformanceThreshold {
  metric: string
  good: number
  needsImprovement: number
  poor: number
  alerting: {
    enabled: boolean
    threshold: number
    window: number // Time window in minutes
    minSamples: number // Minimum samples before alerting
  }
}

export interface PerformanceBudget {
  metrics: {
    [key: string]: {
      budget: number
      unit: string
    }
  }
  resources: {
    javascript: number
    css: number
    images: number
    total: number
  }
}

export interface PerformanceStats {
  count: number
  mean: number
  median: number
  p75: number
  p90: number
  p95: number
  p99: number
  min: number
  max: number
}

export interface AggregatedMetrics {
  webVitals: Map<string, PerformanceStats>
  customMetrics: Map<string, PerformanceStats>
  timeRange: '1h' | '24h' | '7d' | '30d'
  timestamp: number
}

export interface PerformanceAlert {
  metric: string
  value: number
  threshold: number
  severity: 'warning' | 'critical'
  timestamp: number
  message: string
}

export interface NetworkInfo {
  type: '4g' | '3g' | '2g' | 'slow-2g' | 'offline' | 'unknown'
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
  downlink: number // Mbps
  rtt: number // Round trip time in ms
  saveData: boolean
}