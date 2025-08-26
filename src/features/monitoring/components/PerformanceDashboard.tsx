import { type FC, useState, useEffect, useCallback } from 'react';
import { MetricCard } from './MetricCard';
import { performanceService } from '../services/performanceService';
import { performanceAnalyzer } from '../services/performanceAnalyzer';
import { getThreshold, getWebVitalsMetrics, getCustomMetrics } from '../utils/thresholds';
import { getNetworkInfo, getNetworkQualityScore } from '../utils/networkDetection';
import type { PerformanceStats, PerformanceAlert } from '../types/metrics';

interface AlertsListProps {
  timeRange: string;
}

const AlertsList: FC<AlertsListProps> = ({ timeRange }) => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  
  useEffect(() => {
    const loadAlerts = () => {
      const recentAlerts = performanceAnalyzer.getRecentAlerts(20);
      setAlerts(recentAlerts);
    };
    
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);
  
  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-700">No performance issues detected</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <div
          key={`${alert.metric}-${alert.timestamp}-${index}`}
          className={`border rounded-lg p-3 ${
            alert.severity === 'critical' 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className={`font-medium ${
                alert.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {alert.metric}: {Math.round(alert.value)}ms
              </span>
              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const PerformanceDashboard: FC = () => {
  const [metrics, setMetrics] = useState<Map<string, PerformanceStats>>(new Map());
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [performanceScore, setPerformanceScore] = useState(0);
  const [networkScore, setNetworkScore] = useState(100);
  const [isExporting, setIsExporting] = useState(false);

  const loadMetrics = useCallback(async () => {
    const stats = await performanceService.getAggregatedStats(timeRange);
    setMetrics(stats);
    setPerformanceScore(performanceService.getPerformanceScore());
    setNetworkScore(getNetworkQualityScore());
  }, [timeRange]);

  useEffect(() => {
    loadMetrics();

    if (!autoRefresh) return;

    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, [timeRange, autoRefresh, loadMetrics]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = performanceService.exportMetrics();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-metrics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export metrics:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleClearMetrics = useCallback(() => {
    if (confirm('Are you sure you want to clear all metrics data?')) {
      performanceService.clearMetrics();
      setMetrics(new Map());
    }
  }, []);

  const webVitals = getWebVitalsMetrics().filter(v => v !== 'FID'); // Skip deprecated FID
  const customMetrics = getCustomMetrics();
  const networkInfo = getNetworkInfo();

  return (
    <div className="performance-dashboard p-6 max-w-7xl mx-auto">
      <div className="dashboard-header mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
          
          <div className="controls flex gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d' | '30d')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </button>
            
            <button
              onClick={handleClearMetrics}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors"
            >
              Clear Data
            </button>
          </div>
        </div>
        
        {/* Performance scores */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Performance Score</div>
            <div className="flex items-center">
              <span className={`text-3xl font-bold ${
                performanceScore >= 90 ? 'text-green-500' :
                performanceScore >= 75 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {performanceScore}
              </span>
              <span className="text-lg text-gray-500 ml-1">/100</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Network Quality</div>
            <div className="flex items-center">
              <span className={`text-3xl font-bold ${
                networkScore >= 75 ? 'text-green-500' :
                networkScore >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {networkScore}
              </span>
              <span className="text-lg text-gray-500 ml-1">/100</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {networkInfo.effectiveType} • RTT: {networkInfo.rtt}ms
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 mb-1">Total Samples</div>
            <div className="text-3xl font-bold text-blue-500">
              {Array.from(metrics.values()).reduce((sum, stat) => sum + stat.count, 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="web-vitals-section mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {webVitals.map(vital => (
            <MetricCard
              key={vital}
              name={vital}
              stats={metrics.get(vital)}
              threshold={getThreshold(vital)}
              showTrend
            />
          ))}
        </div>
      </div>

      <div className="custom-metrics-section mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Application Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customMetrics.map(metric => (
            <MetricCard
              key={metric}
              name={metric}
              stats={metrics.get(metric)}
              threshold={getThreshold(metric)}
              showTrend
            />
          ))}
        </div>
      </div>

      <div className="alerts-section">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Alerts</h2>
        <AlertsList timeRange={timeRange} />
      </div>
      
      {/* Network information footer */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Network: {networkInfo.effectiveType} | 
          Downlink: {networkInfo.downlink}Mbps | 
          RTT: {networkInfo.rtt}ms | 
          Data Saver: {networkInfo.saveData ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  );
};