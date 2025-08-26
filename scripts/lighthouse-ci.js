#!/usr/bin/env node

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  url: process.env.LIGHTHOUSE_URL || 'http://localhost:4173',
  outputDir: path.join(__dirname, '..', 'lighthouse-reports'),
  budgetPath: path.join(__dirname, '..', 'src', 'config', 'performanceBudget.json'),
  thresholds: {
    performance: 90,
    accessibility: 90,
    'best-practices': 90,
    seo: 90,
    pwa: 80
  },
  webVitals: {
    LCP: 2500,  // Largest Contentful Paint (ms)
    TBT: 200,   // Total Blocking Time (ms) - FID proxy
    CLS: 0.1,   // Cumulative Layout Shift
    FCP: 1800,  // First Contentful Paint (ms)
    SI: 3800,   // Speed Index (ms)
    TTI: 3800   // Time to Interactive (ms)
  }
};

// Lighthouse configuration
const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675
    },
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false
    },
    emulatedUserAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
  }
};

// ANSI color codes for terminal output
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
 * Run Lighthouse audit
 */
async function runLighthouse(url, options = {}) {
  console.log(`${colors.cyan}🔍 Running Lighthouse audit for ${url}...${colors.reset}\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Run Lighthouse
    const { lhr, report } = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      logLevel: 'error',
      ...LIGHTHOUSE_CONFIG
    });
    
    await browser.close();
    
    return { lhr, report };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

/**
 * Check performance budget
 */
async function checkBudget(lhr) {
  try {
    const budgetData = await fs.readFile(CONFIG.budgetPath, 'utf-8');
    const budget = JSON.parse(budgetData);
    
    const violations = [];
    
    // Check metric budgets
    if (budget.metrics) {
      for (const [metric, config] of Object.entries(budget.metrics)) {
        const audit = lhr.audits[metric.toLowerCase().replace(/_/g, '-')];
        if (audit && audit.numericValue > config.budget) {
          violations.push({
            metric,
            actual: audit.numericValue,
            budget: config.budget,
            unit: config.unit
          });
        }
      }
    }
    
    // Check resource budgets
    if (budget.resources) {
      const resourceSummary = lhr.audits['resource-summary'];
      if (resourceSummary && resourceSummary.details) {
        const items = resourceSummary.details.items;
        for (const item of items) {
          const budgetKey = item.resourceType.toLowerCase();
          if (budget.resources[budgetKey] && item.transferSize > budget.resources[budgetKey]) {
            violations.push({
              resource: item.resourceType,
              actual: item.transferSize,
              budget: budget.resources[budgetKey],
              unit: 'bytes'
            });
          }
        }
      }
    }
    
    return violations;
  } catch (error) {
    console.warn(`${colors.yellow}⚠️  Could not load performance budget: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Format and display results
 */
function displayResults(lhr, budgetViolations) {
  console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}       LIGHTHOUSE AUDIT RESULTS        ${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  
  // Category scores
  console.log(`${colors.bold}📊 Category Scores:${colors.reset}`);
  const categories = lhr.categories;
  let allPassed = true;
  
  for (const [key, category] of Object.entries(categories)) {
    const score = Math.round(category.score * 100);
    const threshold = CONFIG.thresholds[key] || 0;
    const passed = score >= threshold;
    allPassed = allPassed && passed;
    
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    
    console.log(`  ${icon} ${category.title}: ${color}${score}/100${colors.reset} (threshold: ${threshold})`);
  }
  
  console.log('');
  
  // Core Web Vitals
  console.log(`${colors.bold}🚀 Core Web Vitals:${colors.reset}`);
  const vitals = {
    'Largest Contentful Paint': { key: 'largest-contentful-paint', threshold: CONFIG.webVitals.LCP },
    'Total Blocking Time': { key: 'total-blocking-time', threshold: CONFIG.webVitals.TBT },
    'Cumulative Layout Shift': { key: 'cumulative-layout-shift', threshold: CONFIG.webVitals.CLS },
    'First Contentful Paint': { key: 'first-contentful-paint', threshold: CONFIG.webVitals.FCP },
    'Speed Index': { key: 'speed-index', threshold: CONFIG.webVitals.SI },
    'Time to Interactive': { key: 'interactive', threshold: CONFIG.webVitals.TTI }
  };
  
  for (const [name, config] of Object.entries(vitals)) {
    const audit = lhr.audits[config.key];
    if (!audit) continue;
    
    const value = audit.numericValue;
    const passed = value <= config.threshold;
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    
    const displayValue = audit.displayValue || `${Math.round(value)}ms`;
    console.log(`  ${icon} ${name}: ${color}${displayValue}${colors.reset} (threshold: ${config.threshold}${name.includes('Shift') ? '' : 'ms'})`);
    
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('');
  
  // Budget violations
  if (budgetViolations.length > 0) {
    console.log(`${colors.bold}${colors.red}⚠️  Performance Budget Violations:${colors.reset}`);
    for (const violation of budgetViolations) {
      const actualFormatted = violation.unit === 'bytes' 
        ? `${(violation.actual / 1024).toFixed(2)}KB`
        : `${violation.actual}${violation.unit}`;
      const budgetFormatted = violation.unit === 'bytes'
        ? `${(violation.budget / 1024).toFixed(2)}KB`
        : `${violation.budget}${violation.unit}`;
      
      console.log(`  ❌ ${violation.metric || violation.resource}: ${colors.red}${actualFormatted}${colors.reset} (budget: ${budgetFormatted})`);
    }
    allPassed = false;
    console.log('');
  }
  
  // Opportunities
  const opportunities = Object.values(lhr.audits)
    .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.numericValue > 0)
    .sort((a, b) => b.numericValue - a.numericValue)
    .slice(0, 5);
  
  if (opportunities.length > 0) {
    console.log(`${colors.bold}💡 Top Performance Opportunities:${colors.reset}`);
    for (const opp of opportunities) {
      const savings = Math.round(opp.numericValue / 100) / 10;
      console.log(`  • ${opp.title}: ${colors.yellow}${savings}s potential savings${colors.reset}`);
    }
    console.log('');
  }
  
  // Diagnostics
  const diagnostics = Object.values(lhr.audits)
    .filter(audit => audit.details && audit.details.type === 'table' && audit.score !== null && audit.score < 1)
    .slice(0, 3);
  
  if (diagnostics.length > 0) {
    console.log(`${colors.bold}🔧 Diagnostics to Review:${colors.reset}`);
    for (const diag of diagnostics) {
      console.log(`  • ${diag.title}`);
    }
    console.log('');
  }
  
  return allPassed;
}

/**
 * Save report to file
 */
async function saveReport(lhr, report) {
  try {
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(CONFIG.outputDir, `lighthouse-${timestamp}.json`);
    const htmlPath = path.join(CONFIG.outputDir, `lighthouse-${timestamp}.html`);
    
    // Save JSON report
    await fs.writeFile(jsonPath, JSON.stringify(lhr, null, 2));
    
    // Generate and save HTML report
    const ReportGenerator = require('lighthouse/report/generator/report-generator');
    const html = ReportGenerator.generateReport(lhr, 'html');
    await fs.writeFile(htmlPath, html);
    
    console.log(`${colors.cyan}📁 Reports saved:${colors.reset}`);
    console.log(`  • JSON: ${jsonPath}`);
    console.log(`  • HTML: ${htmlPath}\n`);
  } catch (error) {
    console.error(`${colors.red}Failed to save reports: ${error.message}${colors.reset}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log(`${colors.bold}${colors.cyan}🚀 HSA Songbook - Lighthouse Performance Audit${colors.reset}\n`);
    
    // Parse arguments
    const args = process.argv.slice(2);
    const url = args[0] || CONFIG.url;
    const saveReports = !args.includes('--no-save');
    
    // Run Lighthouse
    const { lhr, report } = await runLighthouse(url);
    
    // Check performance budget
    const budgetViolations = await checkBudget(lhr);
    
    // Display results
    const passed = displayResults(lhr, budgetViolations);
    
    // Save reports if requested
    if (saveReports) {
      await saveReport(lhr, report);
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
    
    if (passed && budgetViolations.length === 0) {
      console.log(`${colors.bold}${colors.green}✅ All performance checks PASSED!${colors.reset}`);
      console.log(`${colors.cyan}Completed in ${duration}s${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.bold}${colors.red}❌ Performance checks FAILED${colors.reset}`);
      console.log(`${colors.cyan}Completed in ${duration}s${colors.reset}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if required dependencies are installed
async function checkDependencies() {
  const requiredPackages = ['puppeteer', 'lighthouse'];
  const missing = [];
  
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
    } catch {
      missing.push(pkg);
    }
  }
  
  if (missing.length > 0) {
    console.error(`${colors.red}Missing required packages: ${missing.join(', ')}${colors.reset}`);
    console.error(`Run: ${colors.cyan}npm install --save-dev ${missing.join(' ')}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
checkDependencies().then(() => {
  main().catch(error => {
    console.error(`${colors.red}Unexpected error: ${error}${colors.reset}`);
    process.exit(1);
  });
});