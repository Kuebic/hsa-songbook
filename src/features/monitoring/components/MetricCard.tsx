import { type FC, useMemo } from 'react';
import type { PerformanceStats, PerformanceThreshold } from '../types/metrics';
import { getRatingColor, getRatingEmoji, formatMetricValue, getRating } from '../utils/thresholds';

interface MetricCardProps {
  name: string;
  stats?: PerformanceStats | null;
  threshold?: PerformanceThreshold;
  showTrend?: boolean;
  className?: string;
}

export const MetricCard: FC<MetricCardProps> = ({ 
  name, 
  stats, 
  threshold,
  showTrend = false,
  className = ''
}) => {
  const currentValue = stats?.median || 0;
  const rating = threshold ? getRating(name, currentValue) : 'good';
  const color = getRatingColor(rating);
  const emoji = getRatingEmoji(rating);
  
  const trendIndicator = useMemo(() => {
    if (!showTrend || !stats || stats.count < 20) return null;
    
    // Simple trend calculation based on recent values
    const recentMean = stats.mean;
    const historicalP50 = stats.median;
    
    if (!historicalP50) return null;
    
    const change = ((recentMean - historicalP50) / historicalP50) * 100;
    
    if (Math.abs(change) < 5) {
      return <span className="text-gray-500">→</span>;
    } else if (change < 0) {
      return <span className="text-green-500">↓ {Math.abs(change).toFixed(1)}%</span>;
    } else {
      return <span className="text-red-500">↑ {change.toFixed(1)}%</span>;
    }
  }, [stats, showTrend]);
  
  const sparklineData = useMemo(() => {
    if (!stats || stats.count < 2) return null;
    
    // Generate simple sparkline points
    const points = [];
    const samples = Math.min(stats.count, 50);
    const step = 100 / samples;
    
    for (let i = 0; i < samples; i++) {
      const x = i * step;
      const y = 50; // Placeholder - would need actual historical data
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  }, [stats]);

  if (!stats) {
    return (
      <div className={`metric-card bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">{name}</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`metric-card bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{name}</h3>
        {trendIndicator}
      </div>
      
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-2xl font-bold" style={{ color }}>
            {formatMetricValue(name, currentValue)}
          </span>
          <span className="ml-2 text-lg">{emoji}</span>
        </div>
        
        {threshold && (
          <div className="text-xs text-gray-500">
            <div>Good: {formatMetricValue(name, threshold.good)}</div>
            <div>Poor: {formatMetricValue(name, threshold.poor)}</div>
          </div>
        )}
      </div>
      
      {sparklineData && (
        <svg 
          className="w-full h-8" 
          viewBox="0 0 100 60" 
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={sparklineData}
            opacity="0.5"
          />
        </svg>
      )}
      
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xs text-gray-500">P50</div>
          <div className="text-sm font-medium">
            {formatMetricValue(name, stats.median)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">P75</div>
          <div className="text-sm font-medium">
            {formatMetricValue(name, stats.p75)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">P95</div>
          <div className="text-sm font-medium">
            {formatMetricValue(name, stats.p95)}
          </div>
        </div>
      </div>
      
      {stats.count && (
        <div className="mt-2 text-xs text-gray-400 text-right">
          {stats.count} samples
        </div>
      )}
    </div>
  );
};