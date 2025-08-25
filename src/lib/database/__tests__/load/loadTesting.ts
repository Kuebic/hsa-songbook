import { QueryBuilder } from '@lib/database/queryBuilder'
import { supabase } from '@lib/supabase'
import { seedTestData, setSeed } from '../helpers/testData'
import { PerformanceMonitor, ConnectionPoolMonitor } from '@lib/database/monitoring/performanceMonitor'

// Load test configuration
interface LoadTestConfig {
  concurrent: number      // Number of concurrent users
  duration: number        // Test duration in seconds
  rampUp: number         // Ramp-up time in seconds
  scenarios: LoadScenario[]
}

// Load test scenario
interface LoadScenario {
  name: string
  weight: number  // Relative weight (probability)
  operation: () => Promise<any>
}

// Load test results
interface LoadTestResults {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errors: Map<string, number>
  scenarioResults: Map<string, ScenarioMetrics>
  timeSeriesData: TimeSeriesPoint[]
}

interface ScenarioMetrics {
  count: number
  successCount: number
  errorCount: number
  avgDuration: number
  p95Duration: number
}

interface TimeSeriesPoint {
  timestamp: number
  activeUsers: number
  requestsPerSecond: number
  avgResponseTime: number
  errorRate: number
}

/**
 * Load testing framework for database operations
 */
export class LoadTester {
  private config: LoadTestConfig
  private performanceMonitor: PerformanceMonitor
  private connectionMonitor: ConnectionPoolMonitor
  private results: LoadTestResults
  private isRunning = false
  private startTime = 0
  private requests: Array<{ duration: number, success: boolean, error?: string, scenario: string }> = []
  private timeSeriesData: TimeSeriesPoint[] = []
  
  constructor(config: LoadTestConfig) {
    this.config = config
    this.performanceMonitor = new PerformanceMonitor()
    this.connectionMonitor = new ConnectionPoolMonitor(config.concurrent * 2)
    this.results = this.initializeResults()
  }
  
  /**
   * Run load test
   */
  async run(): Promise<LoadTestResults> {
    console.log(`Starting load test with ${this.config.concurrent} concurrent users for ${this.config.duration}s`)
    
    this.isRunning = true
    this.startTime = Date.now()
    
    // Start metrics collection
    const metricsInterval = this.startMetricsCollection()
    
    // Create virtual users
    const users: Promise<void>[] = []
    
    for (let i = 0; i < this.config.concurrent; i++) {
      // Stagger user start times during ramp-up
      const delay = (this.config.rampUp / this.config.concurrent) * i * 1000
      users.push(this.runVirtualUser(i, delay))
    }
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, this.config.duration * 1000))
    
    // Stop test
    this.isRunning = false
    clearInterval(metricsInterval)
    
    // Wait for all users to complete
    await Promise.all(users)
    
    // Calculate results
    this.calculateResults()
    
    return this.results
  }
  
  /**
   * Run a virtual user
   */
  private async runVirtualUser(userId: number, startDelay: number): Promise<void> {
    // Wait for ramp-up delay
    await new Promise(resolve => setTimeout(resolve, startDelay))
    
    while (this.isRunning) {
      // Select scenario based on weights
      const scenario = this.selectScenario()
      
      // Execute scenario with monitoring
      const startTime = performance.now()
      let success = true
      let error: string | undefined
      
      try {
        await this.connectionMonitor.trackConnection(async () => {
          await scenario.operation()
        })
      } catch (err) {
        success = false
        error = (err as Error).message
      }
      
      const duration = performance.now() - startTime
      
      // Record request
      this.requests.push({
        duration,
        success,
        error,
        scenario: scenario.name,
      })
      
      // Think time between requests (100-500ms)
      await new Promise(resolve => 
        setTimeout(resolve, Math.random() * 400 + 100)
      )
    }
  }
  
  /**
   * Select scenario based on weights
   */
  private selectScenario(): LoadScenario {
    const totalWeight = this.config.scenarios.reduce((sum, s) => sum + s.weight, 0)
    const random = Math.random() * totalWeight
    
    let cumulative = 0
    for (const scenario of this.config.scenarios) {
      cumulative += scenario.weight
      if (random <= cumulative) {
        return scenario
      }
    }
    
    return this.config.scenarios[0]
  }
  
  /**
   * Start collecting time-series metrics
   */
  private startMetricsCollection(): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now()
      const elapsed = (now - this.startTime) / 1000
      
      // Calculate metrics for last second
      const recentRequests = this.requests.filter(r => 
        r.duration >= (elapsed - 1) * 1000
      )
      
      const point: TimeSeriesPoint = {
        timestamp: now,
        activeUsers: this.config.concurrent,
        requestsPerSecond: recentRequests.length,
        avgResponseTime: recentRequests.length > 0
          ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
          : 0,
        errorRate: recentRequests.length > 0
          ? recentRequests.filter(r => !r.success).length / recentRequests.length
          : 0,
      }
      
      this.timeSeriesData.push(point)
    }, 1000)
  }
  
  /**
   * Calculate final results
   */
  private calculateResults(): void {
    const durations = this.requests.map(r => r.duration).sort((a, b) => a - b)
    const successCount = this.requests.filter(r => r.success).length
    const elapsedSeconds = (Date.now() - this.startTime) / 1000
    
    // Calculate error distribution
    const errors = new Map<string, number>()
    this.requests.filter(r => !r.success).forEach(r => {
      const error = r.error || 'Unknown error'
      errors.set(error, (errors.get(error) || 0) + 1)
    })
    
    // Calculate scenario metrics
    const scenarioResults = new Map<string, ScenarioMetrics>()
    for (const scenario of this.config.scenarios) {
      const scenarioRequests = this.requests.filter(r => r.scenario === scenario.name)
      const scenarioDurations = scenarioRequests.map(r => r.duration).sort((a, b) => a - b)
      
      scenarioResults.set(scenario.name, {
        count: scenarioRequests.length,
        successCount: scenarioRequests.filter(r => r.success).length,
        errorCount: scenarioRequests.filter(r => !r.success).length,
        avgDuration: scenarioDurations.length > 0
          ? scenarioDurations.reduce((a, b) => a + b, 0) / scenarioDurations.length
          : 0,
        p95Duration: this.percentile(scenarioDurations, 0.95),
      })
    }
    
    this.results = {
      totalRequests: this.requests.length,
      successfulRequests: successCount,
      failedRequests: this.requests.length - successCount,
      avgResponseTime: durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      p50ResponseTime: this.percentile(durations, 0.5),
      p95ResponseTime: this.percentile(durations, 0.95),
      p99ResponseTime: this.percentile(durations, 0.99),
      requestsPerSecond: this.requests.length / elapsedSeconds,
      errors,
      scenarioResults,
      timeSeriesData: this.timeSeriesData,
    }
  }
  
  /**
   * Initialize empty results
   */
  private initializeResults(): LoadTestResults {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errors: new Map(),
      scenarioResults: new Map(),
      timeSeriesData: [],
    }
  }
  
  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0
    const index = Math.ceil(sortedArray.length * p) - 1
    return sortedArray[Math.max(0, index)]
  }
  
  /**
   * Print results summary
   */
  printResults(): void {
    console.log('\n=== Load Test Results ===\n')
    console.log(`Total Requests: ${this.results.totalRequests}`)
    console.log(`Successful: ${this.results.successfulRequests} (${(this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2)}%)`)
    console.log(`Failed: ${this.results.failedRequests} (${(this.results.failedRequests / this.results.totalRequests * 100).toFixed(2)}%)`)
    console.log(`\nResponse Times:`)
    console.log(`  Average: ${this.results.avgResponseTime.toFixed(2)}ms`)
    console.log(`  P50: ${this.results.p50ResponseTime.toFixed(2)}ms`)
    console.log(`  P95: ${this.results.p95ResponseTime.toFixed(2)}ms`)
    console.log(`  P99: ${this.results.p99ResponseTime.toFixed(2)}ms`)
    console.log(`\nThroughput: ${this.results.requestsPerSecond.toFixed(2)} req/s`)
    
    if (this.results.errors.size > 0) {
      console.log(`\nErrors:`)
      this.results.errors.forEach((count, error) => {
        console.log(`  ${error}: ${count}`)
      })
    }
    
    console.log(`\nScenario Results:`)
    this.results.scenarioResults.forEach((metrics, name) => {
      console.log(`  ${name}:`)
      console.log(`    Requests: ${metrics.count}`)
      console.log(`    Success Rate: ${(metrics.successCount / metrics.count * 100).toFixed(2)}%`)
      console.log(`    Avg Duration: ${metrics.avgDuration.toFixed(2)}ms`)
      console.log(`    P95 Duration: ${metrics.p95Duration.toFixed(2)}ms`)
    })
  }
}

/**
 * Predefined load test scenarios
 */
export const loadTestScenarios = {
  /**
   * Read-heavy workload (typical user browsing)
   */
  readHeavy: (testData: any): LoadScenario[] => [
    {
      name: 'Browse Songs',
      weight: 30,
      operation: async () => {
        const qb = new QueryBuilder(supabase, 'songs')
        await qb
          .select('*')
          .withVisibility({ userId: undefined, roles: [], canModerate: false, canAdmin: false })
          .paginate({ page: Math.floor(Math.random() * 10) + 1, limit: 20 })
          .execute()
      },
    },
    {
      name: 'Search Songs',
      weight: 20,
      operation: async () => {
        const terms = ['worship', 'praise', 'love', 'grace', 'faith']
        const term = terms[Math.floor(Math.random() * terms.length)]
        
        const qb = new QueryBuilder(supabase, 'songs')
        await qb
          .select('*')
          .ilike('title', `%${term}%`)
          .limit(10)
          .execute()
      },
    },
    {
      name: 'View Arrangement',
      weight: 25,
      operation: async () => {
        const arrangementId = testData.arrangements[Math.floor(Math.random() * testData.arrangements.length)].id
        
        const qb = new QueryBuilder(supabase, 'arrangements')
        await qb
          .select('*, songs(*)')
          .eq('id', arrangementId)
          .single()
          .execute()
      },
    },
    {
      name: 'List Setlists',
      weight: 15,
      operation: async () => {
        const qb = new QueryBuilder(supabase, 'setlists')
        await qb
          .select('*')
          .eq('is_public', true)
          .orderBy('created_at', { ascending: false })
          .limit(10)
          .execute()
      },
    },
    {
      name: 'View User Profile',
      weight: 10,
      operation: async () => {
        const userId = testData.users[Math.floor(Math.random() * testData.users.length)].id
        
        const qb = new QueryBuilder(supabase, 'users')
        await qb
          .select('*')
          .eq('id', userId)
          .single()
          .execute()
      },
    },
  ],
  
  /**
   * Write-heavy workload (content creation)
   */
  writeHeavy: (testData: any): LoadScenario[] => [
    {
      name: 'Create Arrangement',
      weight: 30,
      operation: async () => {
        const songId = testData.songs[Math.floor(Math.random() * testData.songs.length)].id
        
        const qb = new QueryBuilder(supabase, 'arrangements')
        await qb
          .insert({
            song_id: songId,
            name: `Load Test Arrangement ${Date.now()}`,
            chord_data: '[C]Test [G]Arrangement',
            created_by: testData.users[0].id,
            is_public: true,
            slug: `test-${Date.now()}`,
          })
          .execute()
      },
    },
    {
      name: 'Update Arrangement',
      weight: 25,
      operation: async () => {
        const arrangementId = testData.arrangements[Math.floor(Math.random() * testData.arrangements.length)].id
        
        const qb = new QueryBuilder(supabase, 'arrangements')
        await qb
          .update({ views: Math.floor(Math.random() * 1000) })
          .eq('id', arrangementId)
          .execute()
      },
    },
    {
      name: 'Create Review',
      weight: 20,
      operation: async () => {
        const arrangementId = testData.arrangements[Math.floor(Math.random() * testData.arrangements.length)].id
        const userId = testData.users[Math.floor(Math.random() * testData.users.length)].id
        
        const qb = new QueryBuilder(supabase, 'reviews')
        await qb
          .insert({
            song_id: arrangementId,
            user_id: userId,
            rating: Math.floor(Math.random() * 5) + 1,
            comment: 'Load test review',
          })
          .execute()
      },
    },
    {
      name: 'Create Setlist',
      weight: 15,
      operation: async () => {
        const userId = testData.users[Math.floor(Math.random() * testData.users.length)].id
        
        const qb = new QueryBuilder(supabase, 'setlists')
        await qb
          .insert({
            name: `Load Test Setlist ${Date.now()}`,
            created_by: userId,
            is_public: Math.random() > 0.5,
          })
          .execute()
      },
    },
    {
      name: 'Delete Review',
      weight: 10,
      operation: async () => {
        // Create then delete to avoid running out of reviews
        const arrangementId = testData.arrangements[Math.floor(Math.random() * testData.arrangements.length)].id
        const userId = testData.users[Math.floor(Math.random() * testData.users.length)].id
        
        const insertQb = new QueryBuilder(supabase, 'reviews')
        const result = await insertQb
          .insert({
            song_id: arrangementId,
            user_id: userId,
            rating: 5,
            comment: 'To be deleted',
          })
          .single()
          .execute()
        
        if (result.data && !Array.isArray(result.data)) {
          const deleteQb = new QueryBuilder(supabase, 'reviews')
          await deleteQb
            .delete()
            .eq('id', result.data.id)
            .execute()
        }
      },
    },
  ],
  
  /**
   * Mixed workload (realistic usage)
   */
  mixed: (testData: any): LoadScenario[] => [
    ...loadTestScenarios.readHeavy(testData).map(s => ({ ...s, weight: s.weight * 0.7 })),
    ...loadTestScenarios.writeHeavy(testData).map(s => ({ ...s, weight: s.weight * 0.3 })),
  ],
  
  /**
   * Stress test (complex queries)
   */
  stress: (testData: any): LoadScenario[] => [
    {
      name: 'Complex Join Query',
      weight: 30,
      operation: async () => {
        await supabase
          .from('setlists')
          .select(`
            *,
            setlist_items (
              *,
              arrangements (
                *,
                songs (*)
              )
            )
          `)
          .limit(5)
      },
    },
    {
      name: 'Full Text Search',
      weight: 25,
      operation: async () => {
        await supabase
          .from('songs')
          .select('*')
          .textSearch('title,artist', 'worship praise', {
            type: 'websearch',
            config: 'english',
          })
          .limit(20)
      },
    },
    {
      name: 'Aggregation Query',
      weight: 20,
      operation: async () => {
        await supabase
          .from('arrangements')
          .select('song_id, count(*)')
          .group('song_id')
          .limit(50)
      },
    },
    {
      name: 'Large Result Set',
      weight: 15,
      operation: async () => {
        const qb = new QueryBuilder(supabase, 'songs')
        await qb
          .select('*')
          .limit(500)
          .execute()
      },
    },
    {
      name: 'Multiple Concurrent Reads',
      weight: 10,
      operation: async () => {
        await Promise.all([
          new QueryBuilder(supabase, 'songs').select('*').limit(10).execute(),
          new QueryBuilder(supabase, 'arrangements').select('*').limit(10).execute(),
          new QueryBuilder(supabase, 'setlists').select('*').limit(10).execute(),
          new QueryBuilder(supabase, 'users').select('*').limit(10).execute(),
        ])
      },
    },
  ],
}

/**
 * Run load test with specific configuration
 */
export async function runLoadTest(
  scenario: 'readHeavy' | 'writeHeavy' | 'mixed' | 'stress',
  concurrent: number = 10,
  duration: number = 60,
  rampUp: number = 10
): Promise<LoadTestResults> {
  // Setup test data
  setSeed(99999)
  const testData = await seedTestData({
    songCount: 100,
    arrangementCount: 200,
    userCount: 20,
    setlistCount: 30,
    realistic: false,
  })
  
  // Configure load test
  const config: LoadTestConfig = {
    concurrent,
    duration,
    rampUp,
    scenarios: loadTestScenarios[scenario](testData),
  }
  
  // Run test
  const tester = new LoadTester(config)
  const results = await tester.run()
  
  // Print results
  tester.printResults()
  
  return results
}

// Export for CLI usage
if (require.main === module) {
  const args = process.argv.slice(2)
  const scenario = (args[0] || 'mixed') as any
  const concurrent = parseInt(args[1] || '10')
  const duration = parseInt(args[2] || '60')
  const rampUp = parseInt(args[3] || '10')
  
  console.log(`Running ${scenario} load test...`)
  runLoadTest(scenario, concurrent, duration, rampUp)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Load test failed:', err)
      process.exit(1)
    })
}