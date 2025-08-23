import { useState, useMemo } from 'react'
import { usePermissionMatrix } from '../hooks/usePermissionMatrix'
import { Button } from '@/shared/components/ui'
import type { CustomRole, Permission, PermissionEffect } from '../types/permission.types'
import styles from './PermissionMatrix.module.css'

interface PermissionMatrixProps {
  selectedRoleIds?: string[]
  onRoleSelectionChange?: (roleIds: string[]) => void
  readOnly?: boolean
}

export function PermissionMatrix({
  selectedRoleIds = [],
  onRoleSelectionChange,
  readOnly = false
}: PermissionMatrixProps) {
  const {
    matrix,
    isLoading,
    error,
    pendingChanges,
    hasUnsavedChanges,
    updatePermission,
    saveChanges,
    discardChanges,
    isSaving,
    getPermissionEffect,
    isPermissionPending
  } = usePermissionMatrix()

  const [selectedPermissionGroups, setSelectedPermissionGroups] = useState<string[]>(['all'])
  const [bulkOperationMode, setBulkOperationMode] = useState(false)
  const [bulkEffect, setBulkEffect] = useState<PermissionEffect>('allow')

  // Group permissions by resource type for better organization
  const groupedPermissions = useMemo(() => {
    if (!matrix?.permissions) return {}
    
    return matrix.permissions.reduce((groups, permission) => {
      const group = permission.resource
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(permission)
      return groups
    }, {} as Record<string, Permission[]>)
  }, [matrix?.permissions])

  // Filter displayed permissions based on selection
  const displayedPermissions = useMemo(() => {
    if (!matrix?.permissions) return []
    
    if (selectedPermissionGroups.includes('all')) {
      return matrix.permissions
    }
    
    return matrix.permissions.filter(permission => 
      selectedPermissionGroups.includes(permission.resource)
    )
  }, [matrix?.permissions, selectedPermissionGroups])

  // Filter displayed roles based on selection
  const displayedRoles = useMemo(() => {
    if (!matrix?.roles) return []
    
    if (selectedRoleIds.length === 0) {
      return matrix.roles
    }
    
    return matrix.roles.filter(role => selectedRoleIds.includes(role.id))
  }, [matrix?.roles, selectedRoleIds])

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    if (readOnly) return
    
    const currentEffect = getPermissionEffect(roleId, permissionId)
    let newEffect: PermissionEffect | null = null
    
    // Cycle through: null -> allow -> deny -> null
    switch (currentEffect) {
      case null:
        newEffect = 'allow'
        break
      case 'allow':
        newEffect = 'deny'
        break
      case 'deny':
        newEffect = null
        break
    }
    
    updatePermission(roleId, permissionId, newEffect)
  }

  const handleBulkOperation = (permissionIds: string[], effect: PermissionEffect | null) => {
    if (readOnly) return
    
    displayedRoles.forEach(role => {
      permissionIds.forEach(permissionId => {
        updatePermission(role.id, permissionId, effect)
      })
    })
  }

  const handleRoleSelection = (roleId: string, isSelected: boolean) => {
    if (!onRoleSelectionChange) return
    
    const newSelection = isSelected 
      ? [...selectedRoleIds, roleId]
      : selectedRoleIds.filter(id => id !== roleId)
    
    onRoleSelectionChange(newSelection)
  }

  const handlePermissionGroupToggle = (group: string, isSelected: boolean) => {
    if (group === 'all') {
      setSelectedPermissionGroups(isSelected ? ['all'] : [])
    } else {
      const newGroups = isSelected
        ? [...selectedPermissionGroups.filter(g => g !== 'all'), group]
        : selectedPermissionGroups.filter(g => g !== group)
      
      setSelectedPermissionGroups(newGroups.length === 0 ? ['all'] : newGroups)
    }
  }

  const getPermissionButtonClass = (roleId: string, permissionId: string) => {
    const effect = getPermissionEffect(roleId, permissionId)
    const isPending = isPermissionPending(roleId, permissionId)
    
    let className = styles.permissionButton
    
    switch (effect) {
      case 'allow':
        className += ` ${styles.allow}`
        break
      case 'deny':
        className += ` ${styles.deny}`
        break
      default:
        className += ` ${styles.inherit}`
        break
    }
    
    if (isPending) {
      className += ` ${styles.pending}`
    }
    
    return className
  }

  const getPermissionButtonText = (effect: PermissionEffect | null) => {
    switch (effect) {
      case 'allow':
        return '✓'
      case 'deny':
        return '✗'
      default:
        return '—'
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading permission matrix...</div>
  }

  if (error) {
    return <div className={styles.error}>Error loading permissions: {error.message}</div>
  }

  if (!matrix) {
    return <div className={styles.error}>No permission matrix available</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Permission Matrix</h2>
        <div className={styles.stats}>
          <span>{displayedRoles.length} roles</span>
          <span>{displayedPermissions.length} permissions</span>
          {hasUnsavedChanges && (
            <span className={styles.unsavedChanges}>
              {pendingChanges.length} unsaved changes
            </span>
          )}
        </div>
      </div>

      {!readOnly && hasUnsavedChanges && (
        <div className={styles.changesBanner}>
          <span>You have {pendingChanges.length} unsaved changes</span>
          <div className={styles.changesBannerActions}>
            <Button 
              onClick={saveChanges} 
              disabled={isSaving}
              variant="primary"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              onClick={discardChanges} 
              disabled={isSaving}
              variant="outline"
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      <div className={styles.controls}>
        {/* Role Selection */}
        {onRoleSelectionChange && (
          <div className={styles.roleSelector}>
            <label>Show Roles:</label>
            <div className={styles.checkboxGroup}>
              {matrix.roles.map(role => (
                <label key={role.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={(e) => handleRoleSelection(role.id, e.target.checked)}
                  />
                  {role.name}
                  {role.isSystem && <span className={styles.systemBadge}>System</span>}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Permission Group Selection */}
        <div className={styles.permissionSelector}>
          <label>Show Permissions:</label>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={selectedPermissionGroups.includes('all')}
                onChange={(e) => handlePermissionGroupToggle('all', e.target.checked)}
              />
              All
            </label>
            {Object.keys(groupedPermissions).map(group => (
              <label key={group} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={selectedPermissionGroups.includes(group)}
                  onChange={(e) => handlePermissionGroupToggle(group, e.target.checked)}
                />
                {group} ({groupedPermissions[group].length})
              </label>
            ))}
          </div>
        </div>

        {/* Bulk Operations */}
        {!readOnly && (
          <div className={styles.bulkOperations}>
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={bulkOperationMode}
                onChange={(e) => setBulkOperationMode(e.target.checked)}
              />
              Bulk Operations
            </label>
            {bulkOperationMode && (
              <div className={styles.bulkControls}>
                <select 
                  value={bulkEffect} 
                  onChange={(e) => setBulkEffect(e.target.value as PermissionEffect)}
                >
                  <option value="allow">Allow</option>
                  <option value="deny">Deny</option>
                </select>
                <Button
                  onClick={() => handleBulkOperation(
                    displayedPermissions.map(p => p.id), 
                    bulkEffect
                  )}
                  variant="outline"
                  size="sm"
                >
                  Apply to All
                </Button>
                <Button
                  onClick={() => handleBulkOperation(
                    displayedPermissions.map(p => p.id), 
                    null
                  )}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.matrixContainer}>
        <div className={styles.matrixWrapper}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th className={styles.roleHeader}>Role</th>
                {displayedPermissions.map(permission => (
                  <th 
                    key={permission.id} 
                    className={styles.permissionHeader}
                    title={`${permission.name}\n${permission.description || ''}\nScope: ${permission.scope}`}
                  >
                    <div className={styles.permissionHeaderContent}>
                      <span className={styles.permissionName}>{permission.name}</span>
                      <span className={styles.permissionResource}>{permission.resource}</span>
                      <span className={styles.permissionAction}>{permission.action}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedRoles.map(role => (
                <tr key={role.id}>
                  <td className={styles.roleCell}>
                    <div className={styles.roleName}>
                      {role.name}
                      {role.isSystem && <span className={styles.systemBadge}>System</span>}
                    </div>
                    {role.description && (
                      <div className={styles.roleDescription}>{role.description}</div>
                    )}
                  </td>
                  {displayedPermissions.map(permission => {
                    const effect = getPermissionEffect(role.id, permission.id)
                    const isPending = isPermissionPending(role.id, permission.id)
                    
                    return (
                      <td key={permission.id} className={styles.permissionCell}>
                        <button
                          className={getPermissionButtonClass(role.id, permission.id)}
                          onClick={() => handlePermissionToggle(role.id, permission.id)}
                          disabled={readOnly || role.isSystem}
                          title={`${effect || 'inherit'} - ${isPending ? 'pending' : 'saved'}`}
                        >
                          {getPermissionButtonText(effect)}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {displayedRoles.length === 0 && (
            <div className={styles.emptyState}>
              No roles selected. Choose roles to display in the matrix.
            </div>
          )}
        </div>
      </div>

      <div className={styles.legend}>
        <h3>Legend</h3>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <span className={`${styles.permissionButton} ${styles.allow}`}>✓</span>
            Allow
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.permissionButton} ${styles.deny}`}>✗</span>
            Deny
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.permissionButton} ${styles.inherit}`}>—</span>
            Inherit/None
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.permissionButton} ${styles.allow} ${styles.pending}`}>✓</span>
            Pending Changes
          </div>
        </div>
      </div>
    </div>
  )
}