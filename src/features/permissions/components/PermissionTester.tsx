import { useState, useMemo } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { Button } from '@shared/components/ui'
import { permissionCheckSchema } from '../validation/permissionSchemas'
import type { 
  ResourceType, 
  PermissionAction, 
  PermissionCheckResult
} from '../types/permission.types'
import styles from './PermissionTester.module.css'

interface PermissionTest {
  id: string
  userId: string
  resource: ResourceType
  action: PermissionAction
  resourceId?: string
  context?: Record<string, unknown>
  result?: PermissionCheckResult
  executedAt?: string
  duration?: number
}

interface PermissionTesterProps {
  initialUserId?: string
  initialResource?: ResourceType
  initialAction?: PermissionAction
  onTestComplete?: (test: PermissionTest) => void
}

// Mock users for demo - in real app, these would come from API
const MOCK_USERS = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Admin User', email: 'admin@example.com' },
  { id: '4', name: 'Moderator User', email: 'moderator@example.com' }
]

// Mock resources for testing
const MOCK_RESOURCES = {
  song: [
    { id: '1', name: 'Amazing Grace' },
    { id: '2', name: 'How Great Thou Art' },
    { id: '3', name: 'Silent Night' }
  ],
  arrangement: [
    { id: '1', name: 'Piano Solo - Amazing Grace' },
    { id: '2', name: 'Guitar Chords - How Great Thou Art' }
  ],
  setlist: [
    { id: '1', name: 'Sunday Morning Service' },
    { id: '2', name: 'Christmas Eve Service' }
  ],
  user: [
    { id: '1', name: 'John Doe (john@example.com)' },
    { id: '2', name: 'Jane Smith (jane@example.com)' }
  ],
  role: [
    { id: '1', name: 'Admin Role' },
    { id: '2', name: 'Moderator Role' }
  ],
  system: [
    { id: '1', name: 'System Configuration' },
    { id: '2', name: 'Database Access' }
  ]
}

const PERMISSION_ACTIONS: PermissionAction[] = [
  'create', 'read', 'update', 'delete',
  'approve', 'reject', 'flag',
  'assign_role', 'revoke_role',
  'export', 'import', 'bulk_edit'
]

export function PermissionTester({
  initialUserId = '',
  initialResource = 'song',
  initialAction = 'read',
  onTestComplete
}: PermissionTesterProps) {
  const [formData, setFormData] = useState({
    userId: initialUserId,
    resource: initialResource,
    action: initialAction,
    resourceId: '',
    context: ''
  })
  const [testHistory, setTestHistory] = useState<PermissionTest[]>([])
  const [isTestingBatch, setIsTestingBatch] = useState(false)
  const [batchResults, setBatchResults] = useState<PermissionTest[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { hasPermission, isLoading } = usePermissions()

  // TODO: Add getUserPermissions to usePermissions hook when available
  const userPermissions = null

  const availableResources = useMemo(() => {
    return MOCK_RESOURCES[formData.resource] || []
  }, [formData.resource])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.userId) {
      newErrors.userId = 'User is required'
    }

    if (!formData.resource) {
      newErrors.resource = 'Resource type is required'
    }

    if (!formData.action) {
      newErrors.action = 'Action is required'
    }

    // Validate context JSON if provided
    if (formData.context) {
      try {
        JSON.parse(formData.context)
      } catch {
        newErrors.context = 'Context must be valid JSON'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const executeTest = async (): Promise<PermissionTest | null> => {
    if (!validateForm()) return null

    const startTime = performance.now()

    try {
      let context: Record<string, unknown> | undefined
      if (formData.context) {
        context = JSON.parse(formData.context)
      }

      const testData = {
        userId: formData.userId,
        resource: formData.resource,
        action: formData.action,
        resourceId: formData.resourceId || undefined,
        context
      }

      // Validate the request
      permissionCheckSchema.parse(testData)

      // TODO: Replace with proper checkPermission when available
      const result: PermissionCheckResult = {
        allowed: hasPermission(testData.resource, testData.action, testData.resourceId),
        reason: 'Permission check performed'
      }
      const endTime = performance.now()

      const test: PermissionTest = {
        id: Date.now().toString(),
        ...testData,
        result,
        executedAt: new Date().toISOString(),
        duration: endTime - startTime
      }

      return test

    } catch (error) {
      console.error('Permission test failed:', error)
      const endTime = performance.now()

      const test: PermissionTest = {
        id: Date.now().toString(),
        userId: formData.userId,
        resource: formData.resource,
        action: formData.action,
        resourceId: formData.resourceId || undefined,
        result: {
          allowed: false,
          reason: error instanceof Error ? error.message : 'Test failed'
        },
        executedAt: new Date().toISOString(),
        duration: endTime - startTime
      }

      return test
    }
  }

  const handleSingleTest = async () => {
    const test = await executeTest()
    if (test) {
      setTestHistory(prev => [test, ...prev.slice(0, 19)]) // Keep last 20 tests
      onTestComplete?.(test)
    }
  }

  const handleBatchTest = async () => {
    if (!formData.userId) {
      setErrors({ userId: 'User is required for batch testing' })
      return
    }

    setIsTestingBatch(true)
    setBatchResults([])

    try {
      const batchTests: PermissionTest[] = []

      // Test all combinations of resource types and actions
      for (const resource of Object.keys(MOCK_RESOURCES) as ResourceType[]) {
        for (const action of PERMISSION_ACTIONS) {
          const originalFormData = { ...formData }
          
          setFormData(prev => ({ ...prev, resource, action, resourceId: '' }))
          
          const test = await executeTest()
          if (test) {
            batchTests.push(test)
          }

          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 50))
          
          // Restore original form data for next iteration
          setFormData(prev => ({ 
            ...prev, 
            resource: originalFormData.resource, 
            action: originalFormData.action,
            resourceId: originalFormData.resourceId
          }))
        }
      }

      setBatchResults(batchTests)
      
    } finally {
      setIsTestingBatch(false)
    }
  }

  const clearHistory = () => {
    setTestHistory([])
    setBatchResults([])
  }

  const exportResults = () => {
    const allResults = [...testHistory, ...batchResults]
    const dataStr = JSON.stringify(allResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `permission-tests-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const getResultIcon = (result?: PermissionCheckResult) => {
    if (!result) return '❓'
    return result.allowed ? '✅' : '❌'
  }

  const getResultClass = (result?: PermissionCheckResult) => {
    if (!result) return styles.resultUnknown
    return result.allowed ? styles.resultAllowed : styles.resultDenied
  }

  const renderPermissionTrace = (result: PermissionCheckResult) => {
    if (!result.matchedPermission && !result.deniedBy) {
      return <span className={styles.noMatch}>No matching permission found</span>
    }

    return (
      <div className={styles.trace}>
        {result.matchedPermission && (
          <div className={styles.traceItem}>
            <span className={styles.traceLabel}>Matched:</span>
            <span className={styles.traceValue}>
              {result.matchedPermission.resource}.{result.matchedPermission.action} 
              ({result.matchedPermission.effect}) - {result.matchedPermission.source}
            </span>
          </div>
        )}
        {result.deniedBy && (
          <div className={styles.traceItem}>
            <span className={styles.traceLabel}>Denied by:</span>
            <span className={styles.traceValue}>
              {result.deniedBy.resource}.{result.deniedBy.action} 
              ({result.deniedBy.effect}) - {result.deniedBy.source}
            </span>
          </div>
        )}
        {result.reason && (
          <div className={styles.traceItem}>
            <span className={styles.traceLabel}>Reason:</span>
            <span className={styles.traceValue}>{result.reason}</span>
          </div>
        )}
      </div>
    )
  }

  const batchSummary = useMemo(() => {
    if (batchResults.length === 0) return null

    const allowed = batchResults.filter(t => t.result?.allowed).length
    const denied = batchResults.filter(t => t.result && !t.result.allowed).length
    const avgDuration = batchResults.reduce((sum, t) => sum + (t.duration || 0), 0) / batchResults.length

    return { total: batchResults.length, allowed, denied, avgDuration }
  }, [batchResults])

  const selectedUser = MOCK_USERS.find(u => u.id === formData.userId)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Permission Tester</h3>
        <div className={styles.actions}>
          {(testHistory.length > 0 || batchResults.length > 0) && (
            <>
              <Button onClick={exportResults} variant="outline" size="sm">
                Export Results
              </Button>
              <Button onClick={clearHistory} variant="outline" size="sm">
                Clear History
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.testForm}>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label>User *</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
              className={errors.userId ? styles.fieldError : ''}
            >
              <option value="">Select user...</option>
              {MOCK_USERS.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {errors.userId && <span className={styles.errorText}>{errors.userId}</span>}
          </div>

          <div className={styles.field}>
            <label>Resource Type *</label>
            <select
              value={formData.resource}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                resource: e.target.value as ResourceType,
                resourceId: '' // Reset resource ID when type changes
              }))}
              className={errors.resource ? styles.fieldError : ''}
            >
              <option value="song">Song</option>
              <option value="arrangement">Arrangement</option>
              <option value="setlist">Setlist</option>
              <option value="user">User</option>
              <option value="role">Role</option>
              <option value="system">System</option>
            </select>
            {errors.resource && <span className={styles.errorText}>{errors.resource}</span>}
          </div>

          <div className={styles.field}>
            <label>Action *</label>
            <select
              value={formData.action}
              onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value as PermissionAction }))}
              className={errors.action ? styles.fieldError : ''}
            >
              {PERMISSION_ACTIONS.map(action => (
                <option key={action} value={action}>
                  {action.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            {errors.action && <span className={styles.errorText}>{errors.action}</span>}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label>Specific Resource (Optional)</label>
            <select
              value={formData.resourceId}
              onChange={(e) => setFormData(prev => ({ ...prev, resourceId: e.target.value }))}
            >
              <option value="">Any {formData.resource}</option>
              {availableResources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Context (JSON, Optional)</label>
            <textarea
              value={formData.context}
              onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
              placeholder='{"key": "value"}'
              className={errors.context ? styles.fieldError : ''}
              rows={2}
            />
            {errors.context && <span className={styles.errorText}>{errors.context}</span>}
          </div>
        </div>

        <div className={styles.testActions}>
          <Button 
            onClick={handleSingleTest} 
            variant="default"
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test Permission'}
          </Button>
          <Button 
            onClick={handleBatchTest} 
            variant="outline"
            disabled={isLoading || isTestingBatch || !formData.userId}
          >
            {isTestingBatch ? 'Running Batch Test...' : 'Batch Test All Permissions'}
          </Button>
        </div>
      </div>

      {selectedUser && userPermissions && (
        <div className={styles.userInfo}>
          <h4>User Context: {selectedUser.name}</h4>
          <div className={styles.userStats}>
            <span>Mock user stats (not implemented)</span>
          </div>
        </div>
      )}

      {batchSummary && (
        <div className={styles.batchSummary}>
          <h4>Batch Test Results</h4>
          <div className={styles.summaryStats}>
            <span>Total Tests: {batchSummary.total}</span>
            <span>Allowed: {batchSummary.allowed}</span>
            <span>Denied: {batchSummary.denied}</span>
            <span>Avg Duration: {batchSummary.avgDuration.toFixed(2)}ms</span>
          </div>
        </div>
      )}

      <div className={styles.results}>
        <h4>Test Results</h4>
        
        {isTestingBatch && (
          <div className={styles.batchProgress}>
            Running batch test... ({batchResults.length} completed)
          </div>
        )}

        {[...testHistory, ...batchResults].length === 0 ? (
          <div className={styles.emptyState}>
            No tests have been run yet. Use the form above to test permissions.
          </div>
        ) : (
          <div className={styles.resultsList}>
            {[...batchResults, ...testHistory].slice(0, 50).map(test => (
              <div key={test.id} className={`${styles.resultItem} ${getResultClass(test.result)}`}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultIcon}>{getResultIcon(test.result)}</span>
                  <span className={styles.testSignature}>
                    {MOCK_USERS.find(u => u.id === test.userId)?.name || 'Unknown User'} → {test.resource}.{test.action}
                    {test.resourceId && ` (${availableResources.find(r => r.id === test.resourceId)?.name || test.resourceId})`}
                  </span>
                  <span className={styles.testTime}>
                    {new Date(test.executedAt!).toLocaleTimeString()} ({test.duration?.toFixed(1)}ms)
                  </span>
                </div>
                
                {test.result && (
                  <div className={styles.resultDetails}>
                    {renderPermissionTrace(test.result)}
                    {test.context && (
                      <div className={styles.contextInfo}>
                        <span className={styles.traceLabel}>Context:</span>
                        <code className={styles.contextCode}>
                          {JSON.stringify(test.context, null, 2)}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}