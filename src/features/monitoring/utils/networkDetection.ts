import type { NetworkInfo } from '../types/metrics';
import type { NetworkConnection } from '../../../shared/types/common';

/**
 * Get current network information
 */
export function getNetworkInfo(): NetworkInfo {
  const connection = (navigator as any).connection as NetworkConnection || 
                     (navigator as any).mozConnection as NetworkConnection || 
                     (navigator as any).webkitConnection as NetworkConnection;

  if (!connection) {
    return {
      type: 'unknown',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    };
  }

  return {
    type: detectNetworkType(connection),
    effectiveType: (connection.effectiveType as '4g' | '3g' | '2g' | 'slow-2g') || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
    saveData: connection.saveData || false
  };
}

/**
 * Detect network type from connection object
 */
function detectNetworkType(connection: NetworkConnection): NetworkInfo['type'] {
  // Check if offline
  if (!navigator.onLine) {
    return 'offline';
  }

  // Use effectiveType if available
  if (connection.effectiveType) {
    switch (connection.effectiveType) {
      case 'slow-2g':
        return 'slow-2g';
      case '2g':
        return '2g';
      case '3g':
        return '3g';
      case '4g':
        return '4g';
      default:
        return 'unknown';
    }
  }

  // Fall back to type
  if (connection.type) {
    switch (connection.type) {
      case 'bluetooth':
      case 'cellular':
        return '3g';
      case 'ethernet':
      case 'wifi':
        return '4g';
      case 'none':
        return 'offline';
      default:
        return 'unknown';
    }
  }

  // Estimate based on downlink speed
  if (connection.downlink) {
    if (connection.downlink < 0.25) return 'slow-2g';
    if (connection.downlink < 0.75) return '2g';
    if (connection.downlink < 2) return '3g';
    return '4g';
  }

  return 'unknown';
}

/**
 * Check if metrics should be collected based on network
 */
export function shouldCollectMetrics(): boolean {
  const network = getNetworkInfo();
  
  // Don't collect if offline
  if (network.type === 'offline') {
    return false;
  }
  
  // Don't collect if data saver is on
  if (network.saveData) {
    return false;
  }
  
  // Don't collect on very slow networks (optional)
  if (network.type === 'slow-2g' && !import.meta.env.DEV) {
    return false;
  }
  
  return true;
}

/**
 * Adapt metric collection based on network quality
 */
export function getMetricCollectionConfig() {
  const network = getNetworkInfo();
  
  // High quality network - collect everything
  if (network.type === '4g' && network.rtt < 100) {
    return {
      collectWebVitals: true,
      collectCustomMetrics: true,
      collectResourceTiming: true,
      batchSize: 50,
      flushInterval: 5000,
      sampleRate: 1.0
    };
  }
  
  // Medium quality network - collect most things
  if (network.type === '3g' || (network.type === '4g' && network.rtt >= 100)) {
    return {
      collectWebVitals: true,
      collectCustomMetrics: true,
      collectResourceTiming: false,
      batchSize: 30,
      flushInterval: 10000,
      sampleRate: 0.5
    };
  }
  
  // Low quality network - collect essentials only
  if (network.type === '2g') {
    return {
      collectWebVitals: true,
      collectCustomMetrics: false,
      collectResourceTiming: false,
      batchSize: 10,
      flushInterval: 30000,
      sampleRate: 0.1
    };
  }
  
  // Very low quality or unknown - minimal collection
  return {
    collectWebVitals: true,
    collectCustomMetrics: false,
    collectResourceTiming: false,
    batchSize: 5,
    flushInterval: 60000,
    sampleRate: 0.05
  };
}

/**
 * Monitor network changes
 */
export function onNetworkChange(callback: (network: NetworkInfo) => void): () => void {
  const connection = (navigator as any).connection as NetworkConnection || 
                     (navigator as any).mozConnection as NetworkConnection || 
                     (navigator as any).webkitConnection as NetworkConnection;

  if (!connection) {
    return () => {}; // No-op cleanup function
  }

  const handleChange = () => {
    callback(getNetworkInfo());
  };

  // Listen for connection changes
  connection.addEventListener?.('change', handleChange);

  // Also listen for online/offline events
  window.addEventListener('online', handleChange);
  window.addEventListener('offline', handleChange);

  // Return cleanup function
  return () => {
    connection.removeEventListener?.('change', handleChange);
    window.removeEventListener('online', handleChange);
    window.removeEventListener('offline', handleChange);
  };
}

/**
 * Estimate time to download a resource
 */
export function estimateDownloadTime(bytes: number): number {
  const network = getNetworkInfo();
  
  // Convert downlink from Mbps to bytes per second
  const bytesPerSecond = (network.downlink * 1024 * 1024) / 8;
  
  if (bytesPerSecond === 0) {
    return Infinity;
  }
  
  // Add RTT for connection setup
  return (bytes / bytesPerSecond * 1000) + network.rtt;
}

/**
 * Check if network is considered fast
 */
export function isNetworkFast(): boolean {
  const network = getNetworkInfo();
  return network.type === '4g' && network.rtt < 150 && network.downlink > 1.5;
}

/**
 * Check if network is considered slow
 */
export function isNetworkSlow(): boolean {
  const network = getNetworkInfo();
  return network.type === '2g' || network.type === 'slow-2g' || 
         network.rtt > 400 || network.downlink < 0.5;
}

/**
 * Get network quality score (0-100)
 */
export function getNetworkQualityScore(): number {
  const network = getNetworkInfo();
  
  let score = 100;
  
  // Penalize based on connection type
  switch (network.type) {
    case '4g':
      score -= 0;
      break;
    case '3g':
      score -= 25;
      break;
    case '2g':
      score -= 50;
      break;
    case 'slow-2g':
      score -= 75;
      break;
    case 'offline':
      return 0;
    default:
      score -= 10;
  }
  
  // Penalize based on RTT (round trip time)
  if (network.rtt > 500) {
    score -= 30;
  } else if (network.rtt > 300) {
    score -= 20;
  } else if (network.rtt > 150) {
    score -= 10;
  }
  
  // Penalize based on downlink speed
  if (network.downlink < 0.5) {
    score -= 30;
  } else if (network.downlink < 1) {
    score -= 20;
  } else if (network.downlink < 2) {
    score -= 10;
  }
  
  // Penalize if data saver is on
  if (network.saveData) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}