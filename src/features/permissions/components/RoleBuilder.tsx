import { useState, useMemo } from 'react'
import { useCustomRoles } from '../hooks/useCustomRoles'
import { usePermissions } from '../hooks/usePermissions'
import { Button } from '../../../shared/components/ui'
import { createCustomRoleSchema } from '../validation/permissionSchemas'
import { validateNoCircularInheritance } from '../validation/permissionSchemas'
import type { 
  CreateCustomRoleInput, 
  Permission, 
  CustomRole, 
  PermissionEffect,
  PermissionAssignment
} from '../types/permission.types'
import styles from './RoleBuilder.module.css'

interface RoleBuilderProps {
  initialData?: Partial<CreateCustomRoleInput>
  onComplete?: (roleId: string) => void
  onCancel?: () => void
}

interface FormData {
  name: string
  description: string
  permissions: PermissionAssignment[]
  inheritsFrom: string[]
}

type Step = 'basic' | 'permissions' | 'inheritance' | 'preview'

export function RoleBuilder({ initialData, onComplete, onCancel }: RoleBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissions: initialData?.permissions || [],
    inheritsFrom: initialData?.inheritsFrom || []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { 
    roles: existingRoles = [], 
    createRole, 
    isCreating 
  } = useCustomRoles()
  
  const { 
    allPermissions = [], 
    isLoading: permissionsLoading 
  } = usePermissions()

  // Group permissions by resource type
  const groupedPermissions = useMemo(() => {
    return allPermissions.reduce((groups: Record<string, Permission[]>, permission: Permission) => {
      const group = permission.resource
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(permission)
      return groups
    }, {} as Record<string, Permission[]>)
  }, [allPermissions])

  // Calculate effective permissions including inheritance
  const effectivePermissions = useMemo(() => {
    const inherited = new Set<string>()
    
    // Collect inherited permissions
    formData.inheritsFrom.forEach((roleId: string) => {
      const parentRole = existingRoles.find((r: CustomRole) => r.id === roleId)
      if (parentRole) {
        parentRole.permissions.forEach((p: PermissionAssignment) => {
          if (p.effect === 'allow') {
            inherited.add(p.permissionId)
          }
        })
      }
    })

    // Combine with direct permissions
    const direct = new Map<string, PermissionEffect>()
    formData.permissions.forEach(p => {
      direct.set(p.permissionId, p.effect)
    })

    return { inherited, direct }
  }, [formData.inheritsFrom, formData.permissions, existingRoles])

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 'basic':
        if (!formData.name.trim()) {
          newErrors.name = 'Role name is required'
        } else if (formData.name.length < 2) {
          newErrors.name = 'Role name must be at least 2 characters'
        } else if (formData.name.length > 50) {
          newErrors.name = 'Role name must be less than 50 characters'
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
          newErrors.name = 'Role name can only contain letters, numbers, underscores, and hyphens'
        } else if (existingRoles.some((role: CustomRole) => role.name.toLowerCase() === formData.name.toLowerCase())) {
          newErrors.name = 'A role with this name already exists'
        }

        if (formData.description && formData.description.length > 500) {
          newErrors.description = 'Description must be less than 500 characters'
        }
        break

      case 'permissions':
        if (formData.permissions.length === 0 && formData.inheritsFrom.length === 0) {
          newErrors.permissions = 'At least one permission or inheritance is required'
        }
        break

      case 'inheritance':
        // Check for circular inheritance
        if (formData.inheritsFrom.length > 0) {
          const allRoleInheritance = new Map<string, string[]>()
          existingRoles.forEach((role: CustomRole) => {
            allRoleInheritance.set(role.id, role.inheritsFrom || [])
          })

          if (!validateNoCircularInheritance('new-role', formData.inheritsFrom, allRoleInheritance)) {
            newErrors.inheritance = 'Circular inheritance detected'
          }
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    const steps: Step[] = ['basic', 'permissions', 'inheritance', 'preview']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    const steps: Step[] = ['basic', 'permissions', 'inheritance', 'preview']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handlePermissionChange = (permissionId: string, effect: PermissionEffect | null) => {
    setFormData(prev => ({
      ...prev,
      permissions: effect 
        ? [
            ...prev.permissions.filter(p => p.permissionId !== permissionId),
            { permissionId, effect, conditions: [], resourceId: undefined, expiresAt: undefined }
          ]
        : prev.permissions.filter(p => p.permissionId !== permissionId)
    }))
  }

  const handleInheritanceChange = (roleId: string, inherit: boolean) => {
    setFormData(prev => ({
      ...prev,
      inheritsFrom: inherit 
        ? [...prev.inheritsFrom, roleId]
        : prev.inheritsFrom.filter(id => id !== roleId)
    }))
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    try {
      // Validate the complete form data
      const validatedData = createCustomRoleSchema.parse(formData)
      
      const role = await createRole(validatedData)
      onComplete?.(role.id)
    } catch (error) {
      console.error('Failed to create role:', error)
      setErrors({ submit: 'Failed to create role. Please try again.' })
    }
  }

  const renderBasicStep = () => (
    <div className={styles.stepContent}>
      <h3>Basic Information</h3>
      
      <div className={styles.field}>
        <label htmlFor="roleName">Role Name *</label>
        <input
          id="roleName"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className={errors.name ? styles.fieldError : ''}
          placeholder="Enter role name..."
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
      </div>

      <div className={styles.field}>
        <label htmlFor="roleDescription">Description</label>
        <textarea
          id="roleDescription"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className={errors.description ? styles.fieldError : ''}
          placeholder="Describe the purpose of this role..."
          rows={3}
        />
        {errors.description && <span className={styles.errorText}>{errors.description}</span>}
      </div>
    </div>
  )

  const renderPermissionsStep = () => (
    <div className={styles.stepContent}>
      <h3>Select Permissions</h3>
      {errors.permissions && <div className={styles.errorBanner}>{errors.permissions}</div>}
      
      {permissionsLoading ? (
        <div className={styles.loading}>Loading permissions...</div>
      ) : (
        <div className={styles.permissionGroups}>
          {Object.entries(groupedPermissions).map(([resource, permissions]: [string, Permission[]]) => (
            <div key={resource} className={styles.permissionGroup}>
              <h4>{resource} ({permissions.length})</h4>
              <div className={styles.permissionList}>
                {permissions.map((permission: Permission) => {
                  const directAssignment = formData.permissions.find(p => p.permissionId === permission.id)
                  const isInherited = effectivePermissions.inherited.has(permission.id)
                  const currentEffect = directAssignment?.effect || (isInherited ? 'allow' : null)
                  
                  return (
                    <div key={permission.id} className={styles.permissionItem}>
                      <div className={styles.permissionInfo}>
                        <span className={styles.permissionName}>{permission.name}</span>
                        <span className={styles.permissionAction}>{permission.action}</span>
                        {permission.description && (
                          <span className={styles.permissionDescription}>{permission.description}</span>
                        )}
                        {isInherited && !directAssignment && (
                          <span className={styles.inheritedBadge}>Inherited</span>
                        )}
                      </div>
                      <div className={styles.permissionControls}>
                        <button
                          type="button"
                          className={`${styles.effectButton} ${currentEffect === 'allow' ? styles.active : ''}`}
                          onClick={() => handlePermissionChange(permission.id, 
                            currentEffect === 'allow' ? null : 'allow'
                          )}
                        >
                          Allow
                        </button>
                        <button
                          type="button"
                          className={`${styles.effectButton} ${currentEffect === 'deny' ? styles.active : ''}`}
                          onClick={() => handlePermissionChange(permission.id, 
                            currentEffect === 'deny' ? null : 'deny'
                          )}
                        >
                          Deny
                        </button>
                        {directAssignment && (
                          <button
                            type="button"
                            className={styles.clearButton}
                            onClick={() => handlePermissionChange(permission.id, null)}
                            title="Clear assignment"
                          >
                            ✗
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderInheritanceStep = () => (
    <div className={styles.stepContent}>
      <h3>Role Inheritance</h3>
      {errors.inheritance && <div className={styles.errorBanner}>{errors.inheritance}</div>}
      
      <p className={styles.stepDescription}>
        Select parent roles to inherit permissions from. This role will automatically 
        receive all "allow" permissions from selected parent roles.
      </p>

      <div className={styles.inheritanceList}>
        {existingRoles.filter((role: CustomRole) => !role.isSystem && role.isActive).map((role: CustomRole) => {
          const isSelected = formData.inheritsFrom.includes(role.id)
          
          return (
            <div key={role.id} className={styles.inheritanceItem}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleInheritanceChange(role.id, e.target.checked)}
                />
                <div className={styles.roleInfo}>
                  <span className={styles.roleName}>{role.name}</span>
                  {role.description && (
                    <span className={styles.roleDescription}>{role.description}</span>
                  )}
                  <span className={styles.roleStats}>
                    {role.permissions.length} permissions
                  </span>
                </div>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderPreviewStep = () => {
    const totalEffectivePermissions = new Set([
      ...effectivePermissions.inherited,
      ...Array.from(effectivePermissions.direct.keys())
    ]).size

    return (
      <div className={styles.stepContent}>
        <h3>Preview Role</h3>
        
        <div className={styles.previewSection}>
          <h4>Basic Information</h4>
          <div className={styles.previewItem}>
            <strong>Name:</strong> {formData.name}
          </div>
          {formData.description && (
            <div className={styles.previewItem}>
              <strong>Description:</strong> {formData.description}
            </div>
          )}
        </div>

        {formData.inheritsFrom.length > 0 && (
          <div className={styles.previewSection}>
            <h4>Inherits From ({formData.inheritsFrom.length})</h4>
            {formData.inheritsFrom.map((roleId: string) => {
              const parentRole = existingRoles.find((r: CustomRole) => r.id === roleId)
              return parentRole ? (
                <div key={roleId} className={styles.previewItem}>
                  {parentRole.name}
                </div>
              ) : null
            })}
          </div>
        )}

        <div className={styles.previewSection}>
          <h4>Direct Permissions ({formData.permissions.length})</h4>
          {formData.permissions.length > 0 ? (
            formData.permissions.map((assignment: PermissionAssignment) => {
              const permission = allPermissions.find((p: Permission) => p.id === assignment.permissionId)
              return permission ? (
                <div key={assignment.permissionId} className={styles.previewItem}>
                  <span className={`${styles.effectBadge} ${styles[assignment.effect]}`}>
                    {assignment.effect.toUpperCase()}
                  </span>
                  {permission.name} ({permission.resource}.{permission.action})
                </div>
              ) : null
            })
          ) : (
            <div className={styles.previewItem}>No direct permissions assigned</div>
          )}
        </div>

        <div className={styles.previewSection}>
          <h4>Effective Permissions Summary</h4>
          <div className={styles.previewItem}>
            <strong>Total:</strong> {totalEffectivePermissions} unique permissions
          </div>
          <div className={styles.previewItem}>
            <strong>Inherited:</strong> {effectivePermissions.inherited.size} permissions
          </div>
          <div className={styles.previewItem}>
            <strong>Direct:</strong> {effectivePermissions.direct.size} permissions
          </div>
        </div>

        {errors.submit && (
          <div className={styles.errorBanner}>{errors.submit}</div>
        )}
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return renderBasicStep()
      case 'permissions':
        return renderPermissionsStep()
      case 'inheritance':
        return renderInheritanceStep()
      case 'preview':
        return renderPreviewStep()
    }
  }

  const steps: Step[] = ['basic', 'permissions', 'inheritance', 'preview']
  const currentStepIndex = steps.indexOf(currentStep)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create Custom Role</h2>
        <div className={styles.stepIndicator}>
          {steps.map((step, index) => (
            <div
              key={step}
              className={`${styles.stepDot} ${
                index === currentStepIndex ? styles.active : ''
              } ${index < currentStepIndex ? styles.completed : ''}`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {renderStepContent()}
      </div>

      <div className={styles.actions}>
        <div className={styles.leftActions}>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </div>
        <div className={styles.rightActions}>
          {currentStepIndex > 0 && (
            <Button onClick={handlePrevious} variant="outline">
              Previous
            </Button>
          )}
          {currentStepIndex < steps.length - 1 ? (
            <Button onClick={handleNext} variant="default">
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              variant="default" 
              disabled={isCreating}
            >
              {isCreating ? 'Creating Role...' : 'Create Role'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}