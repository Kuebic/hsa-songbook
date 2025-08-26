#!/usr/bin/env node
/**
 * @file analyzeBundles.js
 * @description Automated bundle size analysis for CI/CD pipeline
 * Parses build output and enforces size thresholds
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  distDir: path.join(__dirname, '..', 'dist'),
  statsFile: path.join(__dirname, '..', 'dist', 'stats.html'),
  
  // Size thresholds in KB
  thresholds: {
    mainBundle: 500,      // Main bundle should be < 500KB
    initialJS: 200,       // Initial JS should be < 200KB
    totalInitial: 350,    // Total initial load < 350KB
    maxChunk: 250,        // No single chunk > 250KB
    criticalCSS: 50,      // Critical CSS < 50KB
    
    // Specific chunk limits
    chunks: {
      'react-vendor': 150,
      'chord-lib': 250,
      'editor-vendor': 200,
      'admin': 100,
      'auth': 100,
      'monitoring': 50,
      'supabase-vendor': 150
    }
  },
  
  // Warning thresholds (percentage of limit)
  warningThreshold: 0.9,
  
  // Output formats
  outputFormat: process.env.CI ? 'json' : 'table'
};

// Colors for terminal output
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
 * Format bytes to human readable size
 */
function formatSize(bytes) {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size / 1024;
  } catch (error) {
    return 0;
  }
}

/**
 * Parse dist directory for bundle files
 */
function parseBundles() {
  const bundles = {
    js: [],
    css: [],
    total: 0,
    initial: {
      js: 0,
      css: 0,
      total: 0
    }
  };
  
  // Check if dist directory exists
  if (!fs.existsSync(CONFIG.distDir)) {
    throw new Error('Dist directory not found. Please run build first.');
  }
  
  // Find all JS files
  const jsDir = path.join(CONFIG.distDir, 'assets', 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir, { recursive: true })
      .filter(file => file.endsWith('.js') && !file.endsWith('.map'));
    
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const sizeKB = getFileSizeKB(filePath);
      const isInitial = file.includes('index') || file.includes('react-vendor');
      
      bundles.js.push({
        name: file,
        path: filePath,
        size: sizeKB,
        isInitial
      });
      
      bundles.total += sizeKB;
      if (isInitial) {
        bundles.initial.js += sizeKB;
        bundles.initial.total += sizeKB;
      }
    });
  }
  
  // Find all CSS files
  const cssDir = path.join(CONFIG.distDir, 'assets', 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir)
      .filter(file => file.endsWith('.css') && !file.endsWith('.map'));
    
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const sizeKB = getFileSizeKB(filePath);
      const isInitial = file.includes('index');
      
      bundles.css.push({
        name: file,
        path: filePath,
        size: sizeKB,
        isInitial
      });
      
      bundles.total += sizeKB;
      if (isInitial) {
        bundles.initial.css += sizeKB;
        bundles.initial.total += sizeKB;
      }
    });
  }
  
  // Sort by size
  bundles.js.sort((a, b) => b.size - a.size);
  bundles.css.sort((a, b) => b.size - a.size);
  
  return bundles;
}

/**
 * Check bundle sizes against thresholds
 */
function checkThresholds(bundles) {
  const violations = [];
  const warnings = [];
  
  // Check total initial bundle
  if (bundles.initial.total > CONFIG.thresholds.totalInitial) {
    violations.push({
      type: 'Initial Bundle',
      size: bundles.initial.total,
      limit: CONFIG.thresholds.totalInitial,
      severity: 'error'
    });
  } else if (bundles.initial.total > CONFIG.thresholds.totalInitial * CONFIG.warningThreshold) {
    warnings.push({
      type: 'Initial Bundle',
      size: bundles.initial.total,
      limit: CONFIG.thresholds.totalInitial,
      severity: 'warning'
    });
  }
  
  // Check initial JS
  if (bundles.initial.js > CONFIG.thresholds.initialJS) {
    violations.push({
      type: 'Initial JavaScript',
      size: bundles.initial.js,
      limit: CONFIG.thresholds.initialJS,
      severity: 'error'
    });
  }
  
  // Check individual chunks
  bundles.js.forEach(bundle => {
    // Check max chunk size
    if (bundle.size > CONFIG.thresholds.maxChunk) {
      violations.push({
        type: `Chunk: ${bundle.name}`,
        size: bundle.size,
        limit: CONFIG.thresholds.maxChunk,
        severity: 'error'
      });
    }
    
    // Check specific chunk limits
    Object.entries(CONFIG.thresholds.chunks).forEach(([chunkName, limit]) => {
      if (bundle.name.includes(chunkName)) {
        if (bundle.size > limit) {
          violations.push({
            type: `Chunk: ${chunkName}`,
            size: bundle.size,
            limit: limit,
            severity: 'error'
          });
        } else if (bundle.size > limit * CONFIG.warningThreshold) {
          warnings.push({
            type: `Chunk: ${chunkName}`,
            size: bundle.size,
            limit: limit,
            severity: 'warning'
          });
        }
      }
    });
  });
  
  // Check CSS
  const totalCSS = bundles.css.reduce((sum, file) => sum + file.size, 0);
  if (totalCSS > CONFIG.thresholds.criticalCSS) {
    warnings.push({
      type: 'Total CSS',
      size: totalCSS,
      limit: CONFIG.thresholds.criticalCSS,
      severity: 'warning'
    });
  }
  
  return { violations, warnings };
}

/**
 * Generate report in table format
 */
function generateTableReport(bundles, { violations, warnings }) {
  console.log(`\n${colors.bold}${colors.cyan}Bundle Analysis Report${colors.reset}`);
  console.log('=' .repeat(80));
  
  // Summary
  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`Total Bundle Size: ${formatSize(bundles.total * 1024)}`);
  console.log(`Initial Load: ${formatSize(bundles.initial.total * 1024)}`);
  console.log(`  - JavaScript: ${formatSize(bundles.initial.js * 1024)}`);
  console.log(`  - CSS: ${formatSize(bundles.initial.css * 1024)}`);
  
  // Top JavaScript bundles
  console.log(`\n${colors.bold}Top JavaScript Bundles:${colors.reset}`);
  console.log('-'.repeat(60));
  console.log('File'.padEnd(40) + 'Size'.padEnd(12) + 'Type');
  console.log('-'.repeat(60));
  
  bundles.js.slice(0, 10).forEach(bundle => {
    const color = bundle.isInitial ? colors.yellow : colors.reset;
    const type = bundle.isInitial ? 'Initial' : 'Lazy';
    console.log(
      `${color}${bundle.name.substring(0, 39).padEnd(40)}${formatSize(bundle.size * 1024).padEnd(12)}${type}${colors.reset}`
    );
  });
  
  // CSS bundles
  if (bundles.css.length > 0) {
    console.log(`\n${colors.bold}CSS Bundles:${colors.reset}`);
    console.log('-'.repeat(60));
    bundles.css.forEach(bundle => {
      console.log(`${bundle.name.padEnd(40)}${formatSize(bundle.size * 1024)}`);
    });
  }
  
  // Warnings
  if (warnings.length > 0) {
    console.log(`\n${colors.bold}${colors.yellow}⚠ Warnings:${colors.reset}`);
    warnings.forEach(warning => {
      console.log(
        `${colors.yellow}  - ${warning.type}: ${formatSize(warning.size * 1024)} ` +
        `(limit: ${formatSize(warning.limit * 1024)})${colors.reset}`
      );
    });
  }
  
  // Violations
  if (violations.length > 0) {
    console.log(`\n${colors.bold}${colors.red}✗ Violations:${colors.reset}`);
    violations.forEach(violation => {
      console.log(
        `${colors.red}  - ${violation.type}: ${formatSize(violation.size * 1024)} ` +
        `(limit: ${formatSize(violation.limit * 1024)})${colors.reset}`
      );
    });
  } else {
    console.log(`\n${colors.green}✓ All bundle sizes within limits${colors.reset}`);
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Generate JSON report for CI
 */
function generateJSONReport(bundles, { violations, warnings }) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSize: bundles.total,
      initialLoad: bundles.initial.total,
      initialJS: bundles.initial.js,
      initialCSS: bundles.initial.css,
      totalChunks: bundles.js.length,
      totalCSS: bundles.css.length
    },
    bundles: {
      js: bundles.js.map(b => ({
        name: b.name,
        size: b.size,
        isInitial: b.isInitial
      })),
      css: bundles.css.map(b => ({
        name: b.name,
        size: b.size,
        isInitial: b.isInitial
      }))
    },
    violations,
    warnings,
    passed: violations.length === 0
  };
  
  console.log(JSON.stringify(report, null, 2));
  
  // Write to file for CI artifacts
  if (process.env.CI) {
    const reportPath = path.join(CONFIG.distDir, 'bundle-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.error(`Report written to: ${reportPath}`);
  }
  
  return report;
}

/**
 * Compare with baseline (for PR comments)
 */
function compareWithBaseline(current, baselinePath) {
  if (!fs.existsSync(baselinePath)) {
    return null;
  }
  
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  
  const comparison = {
    totalDiff: current.summary.totalSize - baseline.summary.totalSize,
    initialDiff: current.summary.initialLoad - baseline.summary.initialLoad,
    chunksDiff: current.summary.totalChunks - baseline.summary.totalChunks,
    
    changes: []
  };
  
  // Calculate percentage changes
  comparison.totalPercent = (comparison.totalDiff / baseline.summary.totalSize) * 100;
  comparison.initialPercent = (comparison.initialDiff / baseline.summary.initialLoad) * 100;
  
  return comparison;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`${colors.cyan}Analyzing bundle sizes...${colors.reset}`);
    
    // Parse bundles
    const bundles = parseBundles();
    
    // Check thresholds
    const results = checkThresholds(bundles);
    
    // Generate report
    if (CONFIG.outputFormat === 'json') {
      const report = generateJSONReport(bundles, results);
      
      // Compare with baseline if provided
      if (process.argv[2]) {
        const comparison = compareWithBaseline(report, process.argv[2]);
        if (comparison) {
          console.error(`\nComparison with baseline:`);
          console.error(`Total size: ${comparison.totalDiff > 0 ? '+' : ''}${formatSize(comparison.totalDiff * 1024)} (${comparison.totalPercent.toFixed(1)}%)`);
          console.error(`Initial load: ${comparison.initialDiff > 0 ? '+' : ''}${formatSize(comparison.initialDiff * 1024)} (${comparison.initialPercent.toFixed(1)}%)`);
        }
      }
      
      // Exit with error if violations
      if (results.violations.length > 0) {
        process.exit(1);
      }
    } else {
      generateTableReport(bundles, results);
      
      // Exit with error if violations
      if (results.violations.length > 0) {
        console.log(`\n${colors.red}Bundle size check failed!${colors.reset}`);
        process.exit(1);
      } else {
        console.log(`\n${colors.green}Bundle size check passed!${colors.reset}`);
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
main();

export {
  parseBundles,
  checkThresholds,
  formatSize
};