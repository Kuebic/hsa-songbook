import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useWebVitals } from '../useWebVitals';

// Mock the performanceService
vi.mock('../../services/performanceService', () => ({
  performanceService: {
    reportMetric: vi.fn()
  }
}));

// Mock web-vitals/attribution
vi.mock('web-vitals/attribution', () => ({
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn()
}));

import { performanceService } from '../../services/performanceService';
import * as webVitals from 'web-vitals/attribution';

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not load web vitals in development mode', () => {
    // Mock development environment
    vi.stubEnv('PROD', false);

    const mockReporter = vi.fn();
    renderHook(() => useWebVitals(mockReporter));

    // Verify web-vitals is not imported in dev
    expect(webVitals.onCLS).not.toHaveBeenCalled();
    expect(webVitals.onINP).not.toHaveBeenCalled();
    expect(webVitals.onLCP).not.toHaveBeenCalled();
  });

  it('loads web vitals in production mode', async () => {
    // Mock production environment
    vi.stubEnv('PROD', true);

    const mockReporter = vi.fn();
    
    // Configure the mocked web-vitals functions to call their callbacks
    const mockCLSMetric = { name: 'CLS', value: 0.1, id: '1' };
    const mockINPMetric = { name: 'INP', value: 200, id: '2' };
    const mockLCPMetric = { name: 'LCP', value: 2500, id: '3' };
    const mockFCPMetric = { name: 'FCP', value: 1800, id: '4' };
    const mockTTFBMetric = { name: 'TTFB', value: 100, id: '5' };

    webVitals.onCLS.mockImplementation((callback) => {
      setTimeout(() => callback(mockCLSMetric), 0);
    });
    webVitals.onINP.mockImplementation((callback) => {
      setTimeout(() => callback(mockINPMetric), 0);
    });
    webVitals.onLCP.mockImplementation((callback) => {
      setTimeout(() => callback(mockLCPMetric), 0);
    });
    webVitals.onFCP.mockImplementation((callback) => {
      setTimeout(() => callback(mockFCPMetric), 0);
    });
    webVitals.onTTFB.mockImplementation((callback) => {
      setTimeout(() => callback(mockTTFBMetric), 0);
    });

    renderHook(() => useWebVitals(mockReporter));

    // Wait for async import and callbacks
    await vi.waitFor(() => {
      expect(mockReporter).toHaveBeenCalledTimes(5);
    }, { timeout: 1000 });

    // Verify all metrics were reported
    expect(mockReporter).toHaveBeenCalledWith(mockCLSMetric);
    expect(mockReporter).toHaveBeenCalledWith(mockINPMetric);
    expect(mockReporter).toHaveBeenCalledWith(mockLCPMetric);
    expect(mockReporter).toHaveBeenCalledWith(mockFCPMetric);
    expect(mockReporter).toHaveBeenCalledWith(mockTTFBMetric);
  });

  it('reports metrics to performance service', async () => {
    // Mock production environment
    vi.stubEnv('PROD', true);
    
    const mockCLSMetric = { name: 'CLS', value: 0.1, id: '1' };
    
    // Configure the mocked CLS function to call its callback
    webVitals.onCLS.mockImplementation((callback) => {
      setTimeout(() => callback(mockCLSMetric), 0);
    });

    renderHook(() => useWebVitals());

    // Wait for async import and callback
    await vi.waitFor(() => {
      expect(performanceService.reportMetric).toHaveBeenCalled();
    }, { timeout: 1000 });

    expect(performanceService.reportMetric).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CLS', value: 0.1 })
    );
  });
});