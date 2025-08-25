import { useState, useMemo } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import { Button } from '../../../shared/components/ui'
import type { 
  ResourceType, 
  PermissionAction, 
  PermissionEffect
} from '../types/permission.types'
import styles from './ResourcePermissions.module.css'

interface ResourcePermissionsProps {
  userId: string
  resourceType?: ResourceType
  resourceId?: string
  onResourceChange?: (type: ResourceType, id?: string) => void
  compact?: boolean
}

interface ResourcePermissionEntry {
  permission: {
    id: string
    name: string
    action: PermissionAction
    description?: string
  }
  effect: PermissionEffect | null
  source: 'role' | 'direct' | 'inherited' | 'group'
  isInherited: boolean
  canModify: boolean
}

// Mock resources for demo - in real app, these would come from API
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
  ]
}

export function ResourcePermissions({
  userId,
  resourceType,
  resourceId,
  onResourceChange,
  compact = false
}: ResourcePermissionsProps) {
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType>(resourceType || 'song')
  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>(resourceId)
  const [showInherited, setShowInherited] = useState(true)

  const {
    allPermissions = [],
    isLoading
  } = usePermissions()

  // Mock functions for permissions management - these should be replaced with actual API calls
  const assignPermission = async (params: {
    userId: string
    permissionId: string
    effect: 'allow' | 'deny'
    resourceId?: string
  }) => {
    console.log('Assign permission:', params)
  }

  const revokePermission = async (params: {
    userId: string
    permissionId: string
    resourceId?: string
  }) => {
    console.log('Revoke permission:', params)
  }

  // Filter permissions for the selected resource type
  const resourcePermissions = useMemo(() => {
    return allPermissions.filter(permission => 
      permission.resource === selectedResourceType
    )
  }, [allPermissions, selectedResourceType])

  // Build permission entries with current state
  const permissionEntries = useMemo((): ResourcePermissionEntry[] => {
    // Since userPermissions is always null in current implementation, return mock data
    return resourcePermissions.map(permission => {
      return {
        permission: {
          id: permission.id,
          name: permission.name,
          action: permission.action,
          description: permission.description
        },
        effect: null, // No permissions assigned yet
        source: 'direct',
        isInherited: false,
        canModify: true
      }
    })
  }, [resourcePermissions, selectedResourceId])

  // Filter entries based on showInherited setting
  const displayedEntries = useMemo(() => {
    if (showInherited) {
      return permissionEntries
    }
    return permissionEntries.filter(entry => entry.effect !== null)
  }, [permissionEntries, showInherited])

  const handleResourceTypeChange = (type: ResourceType) => {
    setSelectedResourceType(type)
    setSelectedResourceId(undefined)
    onResourceChange?.(type)
  }

  const handleResourceIdChange = (id: string | undefined) => {
    setSelectedResourceId(id)
    onResourceChange?.(selectedResourceType, id)
  }

  const handlePermissionChange = async (
    permissionId: string,
    effect: PermissionEffect | null
  ) => {
    try {
      if (effect) {
        await assignPermission({
          userId,
          permissionId,
          effect,
          resourceId: selectedResourceId
        })
      } else {
        await revokePermission({
          userId,
          permissionId,
          resourceId: selectedResourceId
        })
      }
    } catch (error) {
      console.error('Failed to update permission:', error)
    }
  }

  const getPermissionStatusClass = (entry: ResourcePermissionEntry) => {
    if (!entry.effect) return styles.noPermission
    if (entry.isInherited) return styles.inherited
    return entry.effect === 'allow' ? styles.allowed : styles.denied
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'role': return 'Role'
      case 'direct': return 'Direct'
      case 'inherited': return 'Inherited'
      case 'group': return 'Group'
      default: return source
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading permissions...</div>
  }

  const resourceOptions = (MOCK_RESOURCES as Record<string, Array<{id: string; name: string}>>)[selectedResourceType] || []

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h3>Resource Permissions</h3>
        <div className={styles.controls}>
          <div className={styles.resourceTypeSelector}>
            <label>Resource Type:</label>
            <select
              value={selectedResourceType}
              onChange={(e) => handleResourceTypeChange(e.target.value as ResourceType)}
            >
              <option value="song">Songs</option>
              <option value="arrangement">Arrangements</option>
              <option value="setlist">Setlists</option>
              <option value="user">Users</option>
              <option value="role">Roles</option>
              <option value="system">System</option>
            </select>
          </div>

          {resourceOptions.length > 0 && (
            <div className={styles.resourceSelector}>
              <label>Specific Resource:</label>
              <select
                value={selectedResourceId || ''}
                onChange={(e) => handleResourceIdChange(e.target.value || undefined)}
              >
                <option value="">All {selectedResourceType}s</option>
                {resourceOptions.map((resource: {id: string; name: string}) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.toggles}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showInherited}
                onChange={(e) => setShowInherited(e.target.checked)}
              />
              Show inherited
            </label>
          </div>
        </div>
      </div>

      <div className={styles.permissionsTable}>
        {compact ? (
          <div className={styles.compactView}>
            {displayedEntries.map(entry => (
              <div key={entry.permission.id} className={styles.compactRow}>
                <div className={styles.permissionInfo}>
                  <span className={styles.permissionName}>{entry.permission.name}</span>
                  <span className={styles.permissionAction}>{entry.permission.action}</span>
                </div>
                <div className={styles.permissionStatus}>
                  <span className={`${styles.statusBadge} ${getPermissionStatusClass(entry)}`}>
                    {entry.effect ? entry.effect.toUpperCase() : 'NONE'}
                  </span>
                  {entry.isInherited && (
                    <span className={styles.sourceBadge}>
                      {getSourceLabel(entry.source)}
                    </span>
                  )}
                </div>
                {entry.canModify && (
                  <div className={styles.permissionActions}>
                    <Button
                      onClick={() => handlePermissionChange(
                        entry.permission.id,
                        entry.effect === 'allow' ? null : 'allow'
                      )}
                      variant={entry.effect === 'allow' ? 'default' : 'outline'}
                      size="sm"
                    >
                      Allow
                    </Button>
                    <Button
                      onClick={() => handlePermissionChange(
                        entry.permission.id,
                        entry.effect === 'deny' ? null : 'deny'
                      )}
                      variant={entry.effect === 'deny' ? 'destructive' : 'outline'}
                      size="sm"
                    >
                      Deny
                    </Button>
                    {entry.effect && (
                      <Button
                        onClick={() => handlePermissionChange(entry.permission.id, null)}
                        variant="outline"
                        size="sm"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Action</th>
                <th>Status</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedEntries.map(entry => (
                <tr key={entry.permission.id}>
                  <td>
                    <div className={styles.permissionInfo}>
                      <span className={styles.permissionName}>
                        {entry.permission.name}
                      </span>
                      {entry.permission.description && (
                        <span className={styles.permissionDescription}>
                          {entry.permission.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={styles.actionBadge}>
                      {entry.permission.action}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getPermissionStatusClass(entry)}`}>
                      {entry.effect ? entry.effect.toUpperCase() : 'NONE'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.sourceBadge}>
                      {getSourceLabel(entry.source)}
                    </span>
                  </td>
                  <td>
                    {entry.canModify ? (
                      <div className={styles.permissionActions}>
                        <Button
                          onClick={() => handlePermissionChange(
                            entry.permission.id,
                            entry.effect === 'allow' ? null : 'allow'
                          )}
                          variant={entry.effect === 'allow' ? 'default' : 'outline'}
                          size="sm"
                        >
                          Allow
                        </Button>
                        <Button
                          onClick={() => handlePermissionChange(
                            entry.permission.id,
                            entry.effect === 'deny' ? null : 'deny'
                          )}
                          variant={entry.effect === 'deny' ? 'destructive' : 'outline'}
                          size="sm"
                        >
                          Deny
                        </Button>
                        {entry.effect && (
                          <Button
                            onClick={() => handlePermissionChange(entry.permission.id, null)}
                            variant="outline"
                            size="sm"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className={styles.inheritedLabel}>
                        {entry.isInherited ? 'Inherited' : 'System'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {displayedEntries.length === 0 && (
          <div className={styles.emptyState}>
            No permissions found for this resource type.
          </div>
        )}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryStats}>
          <span>Total: {displayedEntries.length}</span>
          <span>Allowed: {displayedEntries.filter(e => e.effect === 'allow').length}</span>
          <span>Denied: {displayedEntries.filter(e => e.effect === 'deny').length}</span>
          <span>Inherited: {displayedEntries.filter(e => e.isInherited).length}</span>
        </div>
      </div>
    </div>
  )
}