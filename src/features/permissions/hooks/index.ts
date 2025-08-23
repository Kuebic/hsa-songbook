// Main permissions hook
export { usePermissions, default as usePermissionsDefault } from './usePermissions'
export type { UsePermissionsReturn } from './usePermissions'

// Custom roles management
export { useCustomRoles, default as useCustomRolesDefault } from './useCustomRoles'
export type { UseCustomRolesReturn } from './useCustomRoles'

// Permission matrix operations
export { usePermissionMatrix, default as usePermissionMatrixDefault } from './usePermissionMatrix'
export type { UsePermissionMatrixReturn } from './usePermissionMatrix'

// Re-export commonly used types for convenience
export type {
  Permission,
  CustomRole,
  UserPermissionSet,
  PermissionGroup,
  PermissionMatrix,
  PermissionAction,
  ResourceType,
  PermissionEffect,
  PermissionScope,
  CreateCustomRoleInput,
  UpdateCustomRoleInput,
  AssignRoleInput,
  AssignPermissionInput,
  CreatePermissionGroupInput,
  UpdatePermissionGroupInput,
  PermissionCheckResult
} from '../types/permission.types'