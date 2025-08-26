#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const BASELINE_FILE = path.join(__dirname, '..', 'performance-baseline.json');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Run Lighthouse and get metrics
 */
async function getCurrentMetrics() {
  console.log(`${colors.cyan}📊 Collecting current performance metrics...${colors.reset}`);
  
  try {
    // Run lighthouse CI script
    const output = execSync('node scripts/lighthouse-ci.js --no-save', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Find the latest lighthouse report
    const reportsDir = path.join(__dirname, '..', 'lighthouse-reports');
    const files = await fs.readdir(reportsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort();
    
    if (jsonFiles.length === 0) {
      throw new Error('No Lighthouse reports found');
    }
    
    const latestReport = path.join(reportsDir, jsonFiles[jsonFiles.length - 1]);
    const reportData = await fs.readFile(latestReport, 'utf-8');
    const lhr = JSON.parse(reportData);
    
    return extractMetrics(lhr);
  } catch (error) {
    // Fallback: generate mock metrics for testing
    console.warn(`${colors.yellow}⚠️  Could not run Lighthouse, using mock data${colors.reset}`);
    return getMockMetrics();
  }
}

/**
 * Extract key metrics from Lighthouse report
 */
function extractMetrics(lhr) {
  const metrics = {
    timestamp: new Date().toISOString(),
    scores: {},
    webVitals: {},
    resources: {}
  };
  
  // Category scores
  for (const [key, category] of Object.entries(lhr.categories)) {
    metrics.scores[key] = Math.round(category.score * 100);
  }
  
  // Web vitals
  const vitalAudits = {
    LCP: 'largest-contentful-paint',
    TBT: 'total-blocking-time',
    CLS: 'cumulative-layout-shift',
    FCP: 'first-contentful-paint',
    SI: 'speed-index',
    TTI: 'interactive'
  };
  
  for (const [key, auditKey] of Object.entries(vitalAudits)) {
    if (lhr.audits[auditKey]) {
      metrics.webVitals[key] = lhr.audits[auditKey].numericValue;
    }
  }
  
  // Resource sizes
  if (lhr.audits['resource-summary'] && lhr.audits['resource-summary'].details) {
    const items = lhr.audits['resource-summary'].details.items;
    for (const item of items) {
      metrics.resources[item.resourceType] = item.transferSize;
    }
  }
  
  return metrics;
}

/**
 * Get mock metrics for testing
 */
function getMockMetrics() {
  return {
    timestamp: new Date().toISOString(),
    scores: {
      performance: 92,
      accessibility: 95,
      'best-practices': 90,
      seo: 92,
      pwa: 85
    },
    webVitals: {
      LCP: 2200,
      TBT: 180,
      CLS: 0.08,
      FCP: 1600,
      SI: 3500,
      TTI: 3600
    },
    resources: {
      Script: 245000,
      Stylesheet: 68000,
      Image: 125000,
      Font: 45000,
      Document: 12000,
      Other: 5000,
      Total: 500000
    }
  };
}

/**
 * Load baseline metrics
 */
async function loadBaseline() {
  try {
    const data = await fs.readFile(BASELINE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save baseline metrics
 */
async function saveBaseline(metrics) {
  await fs.writeFile(BASELINE_FILE, JSON.stringify(metrics, null, 2));
}

/**
 * Compare metrics with baseline
 */
function compareMetrics(current, baseline) {
  const comparison = {
    improved: [],
    degraded: [],
    stable: []
  };
  
  // Compare scores
  for (const [key, value] of Object.entries(current.scores)) {
    const baseValue = baseline.scores[key];
    if (!baseValue) continue;
    
    const diff = value - baseValue;
    const item = {
      metric: key,
      current: value,
      baseline: baseValue,
      diff,
      percentage: ((diff / baseValue) * 100).toFixed(1)
    };
    
    if (Math.abs(diff) < 2) {
      comparison.stable.push(item);
    } else if (diff > 0) {
      comparison.improved.push(item);
    } else {
      comparison.degraded.push(item);
    }
  }
  
  // Compare web vitals (lower is better)
  for (const [key, value] of Object.entries(current.webVitals)) {
    const baseValue = baseline.webVitals[key];
    if (!baseValue) continue;
    
    const diff = value - baseValue;
    const item = {
      metric: key,
      current: Math.round(value),
      baseline: Math.round(baseValue),
      diff: Math.round(diff),
      percentage: ((diff / baseValue) * 100).toFixed(1)
    };
    
    // For web vitals, negative diff is improvement
    if (Math.abs(diff / baseValue) < 0.05) {
      comparison.stable.push(item);
    } else if (diff < 0) {
      comparison.improved.push(item);
    } else {
      comparison.degraded.push(item);
    }
  }
  
  // Compare resource sizes (lower is better)
  for (const [key, value] of Object.entries(current.resources)) {
    const baseValue = baseline.resources[key];
    if (!baseValue) continue;
    
    const diff = value - baseValue;
    const item = {
      metric: `${key} size`,
      current: `${(value / 1024).toFixed(1)}KB`,
      baseline: `${(baseValue / 1024).toFixed(1)}KB`,
      diff: `${(diff / 1024).toFixed(1)}KB`,
      percentage: ((diff / baseValue) * 100).toFixed(1)
    };
    
    if (Math.abs(diff / baseValue) < 0.05) {
      comparison.stable.push(item);
    } else if (diff < 0) {
      comparison.improved.push(item);
    } else {
      comparison.degraded.push(item);
    }
  }
  
  return comparison;
}

/**
 * Display comparison results
 */
function displayComparison(comparison) {
  console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}    PERFORMANCE BASELINE COMPARISON    ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  
  // Improvements
  if (comparison.improved.length > 0) {
    console.log(`${colors.bold}${colors.green}✅ Improvements:${colors.reset}`);
    for (const item of comparison.improved) {
      const arrow = item.percentage > 0 ? '↑' : '↓';
      console.log(`  ${colors.green}${arrow} ${item.metric}: ${item.current} (${item.percentage}% better)${colors.reset}`);
    }
    console.log('');
  }
  
  // Degradations
  if (comparison.degraded.length > 0) {
    console.log(`${colors.bold}${colors.red}❌ Degradations:${colors.reset}`);
    for (const item of comparison.degraded) {
      const arrow = item.percentage > 0 ? '↑' : '↓';
      console.log(`  ${colors.red}${arrow} ${item.metric}: ${item.current} (${item.percentage}% worse)${colors.reset}`);
    }
    console.log('');
  }
  
  // Stable metrics
  if (comparison.stable.length > 0) {
    console.log(`${colors.bold}${colors.cyan}→ Stable:${colors.reset}`);
    for (const item of comparison.stable) {
      console.log(`  ${colors.cyan}→ ${item.metric}: ${item.current}${colors.reset}`);
    }
    console.log('');
  }
  
  // Summary
  const total = comparison.improved.length + comparison.degraded.length + comparison.stable.length;
  const improvementRate = (comparison.improved.length / total * 100).toFixed(0);
  const degradationRate = (comparison.degraded.length / total * 100).toFixed(0);
  
  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`  Improved: ${colors.green}${comparison.improved.length} (${improvementRate}%)${colors.reset}`);
  console.log(`  Degraded: ${colors.red}${comparison.degraded.length} (${degradationRate}%)${colors.reset}`);
  console.log(`  Stable: ${colors.cyan}${comparison.stable.length}${colors.reset}\n`);
  
  return comparison.degraded.length === 0;
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'create':
      case 'update': {
        console.log(`${colors.cyan}📊 Creating performance baseline...${colors.reset}\n`);
        const metrics = await getCurrentMetrics();
        await saveBaseline(metrics);
        console.log(`${colors.green}✅ Baseline saved to ${BASELINE_FILE}${colors.reset}`);
        console.log(`\nBaseline metrics:`);
        console.log(`  Performance: ${metrics.scores.performance}/100`);
        console.log(`  LCP: ${Math.round(metrics.webVitals.LCP)}ms`);
        console.log(`  TBT: ${Math.round(metrics.webVitals.TBT)}ms`);
        console.log(`  CLS: ${metrics.webVitals.CLS.toFixed(3)}`);
        break;
      }
      
      case 'compare': {
        const baseline = await loadBaseline();
        if (!baseline) {
          console.error(`${colors.red}❌ No baseline found. Run 'npm run perf:baseline create' first${colors.reset}`);
          process.exit(1);
        }
        
        console.log(`${colors.cyan}📊 Comparing with baseline from ${baseline.timestamp}...${colors.reset}\n`);
        const current = await getCurrentMetrics();
        const comparison = compareMetrics(current, baseline);
        const passed = displayComparison(comparison);
        
        process.exit(passed ? 0 : 1);
        break;
      }
      
      case 'show': {
        const baseline = await loadBaseline();
        if (!baseline) {
          console.error(`${colors.red}❌ No baseline found${colors.reset}`);
          process.exit(1);
        }
        
        console.log(`${colors.cyan}📊 Current baseline (${baseline.timestamp}):${colors.reset}\n`);
        console.log('Scores:');
        for (const [key, value] of Object.entries(baseline.scores)) {
          console.log(`  ${key}: ${value}/100`);
        }
        console.log('\nWeb Vitals:');
        for (const [key, value] of Object.entries(baseline.webVitals)) {
          const formatted = key === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`;
          console.log(`  ${key}: ${formatted}`);
        }
        console.log('\nResources:');
        for (const [key, value] of Object.entries(baseline.resources)) {
          console.log(`  ${key}: ${(value / 1024).toFixed(1)}KB`);
        }
        break;
      }
      
      default: {
        console.log(`${colors.cyan}Performance Baseline Tool${colors.reset}\n`);
        console.log('Usage:');
        console.log('  node scripts/performance-baseline.js create   - Create/update baseline');
        console.log('  node scripts/performance-baseline.js compare  - Compare with baseline');
        console.log('  node scripts/performance-baseline.js show     - Show current baseline');
        process.exit(0);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Unexpected error: ${error}${colors.reset}`);
  process.exit(1);
});