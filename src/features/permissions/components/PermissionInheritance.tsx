import { useState, useMemo } from 'react'
import { useCustomRoles } from '../hooks/useCustomRoles'
import { Button } from '@shared/components/ui'
import { validateNoCircularInheritance } from '../validation/permissionSchemas'
import type { CustomRole } from '../types/permission.types'
import styles from './PermissionInheritance.module.css'

interface TreeNode {
  id: string
  role: CustomRole
  children: TreeNode[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
}

interface PermissionInheritanceProps {
  selectedRoleId?: string
  onRoleSelect?: (roleId: string | null) => void
  onInheritanceChange?: (childId: string, parentIds: string[]) => void
  readOnly?: boolean
  showDragDrop?: boolean
}

export function PermissionInheritance({
  selectedRoleId,
  onRoleSelect,
  onInheritanceChange,
  readOnly = false,
  showDragDrop = false
}: PermissionInheritanceProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [draggedRole, setDraggedRole] = useState<string | null>(null)
  const [dragTarget, setDragTarget] = useState<string | null>(null)
  const [showSystemRoles, setShowSystemRoles] = useState(true)
  const [showInactiveRoles, setShowInactiveRoles] = useState(false)

  const { roles = [], updateRole } = useCustomRoles()

  // Build inheritance tree structure
  const treeData = useMemo(() => {
    // Filter roles based on display options
    const filteredRoles = roles.filter(role => {
      if (!showSystemRoles && role.isSystem) return false
      if (!showInactiveRoles && !role.isActive) return false
      return true
    })

    // Create role lookup map
    const roleMap = new Map(filteredRoles.map(role => [role.id, role]))
    
    // Build parent-child relationships
    const childrenMap = new Map<string, string[]>()
    const hasParent = new Set<string>()

    filteredRoles.forEach(role => {
      if (role.inheritsFrom) {
        role.inheritsFrom.forEach(parentId => {
          if (roleMap.has(parentId)) {
            if (!childrenMap.has(parentId)) {
              childrenMap.set(parentId, [])
            }
            childrenMap.get(parentId)!.push(role.id)
            hasParent.add(role.id)
          }
        })
      }
    })

    // Find root roles (roles with no parents in the filtered set)
    const rootRoles = filteredRoles.filter(role => !hasParent.has(role.id))

    // Build tree recursively
    const buildTree = (roleId: string, depth: number): TreeNode => {
      const role = roleMap.get(roleId)!
      const children = childrenMap.get(roleId) || []
      
      return {
        id: roleId,
        role,
        children: children.map(childId => buildTree(childId, depth + 1)),
        depth,
        isExpanded: expandedNodes.has(roleId),
        hasChildren: children.length > 0
      }
    }

    return rootRoles.map(role => buildTree(role.id, 0))
  }, [roles, expandedNodes, showSystemRoles, showInactiveRoles])

  // Flatten tree for easier rendering
  const flattenedTree = useMemo(() => {
    const flattened: TreeNode[] = []
    
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        flattened.push(node)
        if (node.isExpanded && node.children.length > 0) {
          traverse(node.children)
        }
      })
    }
    
    traverse(treeData)
    return flattened
  }, [treeData])

  const toggleExpanded = (roleId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roleId)) {
        newSet.delete(roleId)
      } else {
        newSet.add(roleId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.hasChildren) {
          allIds.add(node.id)
        }
        traverse(node.children)
      })
    }
    traverse(treeData)
    setExpandedNodes(allIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const handleRoleClick = (roleId: string) => {
    onRoleSelect?.(selectedRoleId === roleId ? null : roleId)
  }

  const handleDragStart = (e: React.DragEvent, roleId: string) => {
    if (!showDragDrop || readOnly) return
    
    setDraggedRole(roleId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', roleId)
  }

  const handleDragOver = (e: React.DragEvent, targetRoleId: string) => {
    if (!showDragDrop || !draggedRole || readOnly) return
    
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragTarget(targetRoleId)
  }

  const handleDragLeave = () => {
    setDragTarget(null)
  }

  const handleDrop = async (e: React.DragEvent, targetRoleId: string) => {
    e.preventDefault()
    
    if (!showDragDrop || !draggedRole || draggedRole === targetRoleId || readOnly) {
      setDraggedRole(null)
      setDragTarget(null)
      return
    }

    try {
      const draggedRoleObj = roles.find(r => r.id === draggedRole)
      const targetRoleObj = roles.find(r => r.id === targetRoleId)

      if (!draggedRoleObj || !targetRoleObj) return

      // Validate no circular dependency
      const allRoleInheritance = new Map<string, string[]>()
      roles.forEach(role => {
        allRoleInheritance.set(role.id, role.inheritsFrom || [])
      })

      // Check if adding this inheritance would create a cycle
      const newParents = [...(draggedRoleObj.inheritsFrom || []), targetRoleId]
      
      if (!validateNoCircularInheritance(draggedRole, newParents, allRoleInheritance)) {
        alert('Cannot create inheritance: would result in circular dependency')
        return
      }

      // Update the role with new inheritance
      await updateRole(draggedRole, {
        inheritsFrom: newParents
      })

      onInheritanceChange?.(draggedRole, newParents)
      
    } catch (error) {
      console.error('Failed to update inheritance:', error)
    } finally {
      setDraggedRole(null)
      setDragTarget(null)
    }
  }

  const removeInheritance = async (childId: string, parentId: string) => {
    if (readOnly) return

    try {
      const childRole = roles.find(r => r.id === childId)
      if (!childRole) return

      const newParents = (childRole.inheritsFrom || []).filter(id => id !== parentId)
      
      await updateRole(childId, {
        inheritsFrom: newParents
      })

      onInheritanceChange?.(childId, newParents)
      
    } catch (error) {
      console.error('Failed to remove inheritance:', error)
    }
  }

  const getNodeIndentation = (depth: number) => ({
    paddingLeft: `${depth * 1.5 + 0.5}rem`
  })

  const getRoleIcon = (role: CustomRole) => {
    if (role.isSystem) return '⚙️'
    if (!role.isActive) return '🚫'
    return '👤'
  }

  const getRoleStatusClass = (role: CustomRole) => {
    let className = styles.roleItem
    if (role.isSystem) className += ` ${styles.systemRole}`
    if (!role.isActive) className += ` ${styles.inactiveRole}`
    if (selectedRoleId === role.id) className += ` ${styles.selectedRole}`
    if (draggedRole === role.id) className += ` ${styles.draggedRole}`
    if (dragTarget === role.id) className += ` ${styles.dropTarget}`
    return className
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Role Inheritance Hierarchy</h3>
        <div className={styles.controls}>
          <div className={styles.expansionControls}>
            <Button onClick={expandAll} variant="outline" size="sm">
              Expand All
            </Button>
            <Button onClick={collapseAll} variant="outline" size="sm">
              Collapse All
            </Button>
          </div>
          
          <div className={styles.filterControls}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showSystemRoles}
                onChange={(e) => setShowSystemRoles(e.target.checked)}
              />
              System Roles
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showInactiveRoles}
                onChange={(e) => setShowInactiveRoles(e.target.checked)}
              />
              Inactive Roles
            </label>
          </div>
        </div>
      </div>

      <div className={styles.treeContainer}>
        {flattenedTree.length === 0 ? (
          <div className={styles.emptyState}>
            No roles match the current filters
          </div>
        ) : (
          <div className={styles.tree}>
            {flattenedTree.map(node => (
              <div
                key={node.id}
                className={getRoleStatusClass(node.role)}
                style={getNodeIndentation(node.depth)}
                draggable={showDragDrop && !readOnly && !node.role.isSystem}
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragOver={(e) => handleDragOver(e, node.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, node.id)}
                onClick={() => handleRoleClick(node.id)}
              >
                <div className={styles.roleContent}>
                  <div className={styles.roleMain}>
                    {node.hasChildren && (
                      <button
                        className={styles.expandButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(node.id)
                        }}
                      >
                        {node.isExpanded ? '▼' : '▶'}
                      </button>
                    )}
                    {!node.hasChildren && (
                      <span className={styles.expandSpacer}></span>
                    )}
                    
                    <span className={styles.roleIcon}>
                      {getRoleIcon(node.role)}
                    </span>
                    
                    <div className={styles.roleInfo}>
                      <span className={styles.roleName}>{node.role.name}</span>
                      {node.role.description && (
                        <span className={styles.roleDescription}>
                          {node.role.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.roleActions}>
                    <span className={styles.permissionCount}>
                      {node.role.permissions.length} permissions
                    </span>
                    
                    {node.role.inheritsFrom && node.role.inheritsFrom.length > 0 && (
                      <div className={styles.inheritanceInfo}>
                        <span>Inherits from: {node.role.inheritsFrom.length}</span>
                        {!readOnly && (
                          <div className={styles.inheritanceList}>
                            {node.role.inheritsFrom.map(parentId => {
                              const parentRole = roles.find(r => r.id === parentId)
                              return parentRole ? (
                                <div key={parentId} className={styles.inheritanceItem}>
                                  <span>{parentRole.name}</span>
                                  <button
                                    className={styles.removeInheritance}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeInheritance(node.id, parentId)
                                    }}
                                    title="Remove inheritance"
                                  >
                                    ✗
                                  </button>
                                </div>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDragDrop && !readOnly && (
        <div className={styles.instructions}>
          <h4>Drag & Drop Instructions</h4>
          <ul>
            <li>Drag a role and drop it onto another role to create inheritance</li>
            <li>System roles cannot be dragged</li>
            <li>Circular dependencies are automatically prevented</li>
            <li>Click the ✗ button to remove inheritance relationships</li>
          </ul>
        </div>
      )}

      {selectedRoleId && (
        <div className={styles.selectedRoleInfo}>
          {(() => {
            const selectedRole = roles.find(r => r.id === selectedRoleId)
            if (!selectedRole) return null
            
            return (
              <div className={styles.roleDetails}>
                <h4>Selected Role: {selectedRole.name}</h4>
                <div className={styles.roleStats}>
                  <span>Direct permissions: {selectedRole.permissions.length}</span>
                  <span>Inherits from: {selectedRole.inheritsFrom?.length || 0} roles</span>
                  <span>Status: {selectedRole.isActive ? 'Active' : 'Inactive'}</span>
                  {selectedRole.isSystem && <span>System Role</span>}
                </div>
                {selectedRole.description && (
                  <p className={styles.selectedRoleDescription}>
                    {selectedRole.description}
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}