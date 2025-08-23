// Export hooks
export {
  usePermissions,
  useCustomRoles,
  usePermissionMatrix
} from './hooks'

// Export types
export type {
  Permission,
  CustomRole,
  PermissionAssignment,
  PermissionCondition,
  UserPermissionSet,
  ResolvedPermission,
  PermissionGroup,
  PermissionMatrix,
  RoleAssignment,
  PermissionCheckResult,
  PermissionFilter,
  CreateCustomRoleInput,
  UpdateCustomRoleInput,
  AssignRoleInput,
  AssignPermissionInput,
  CreatePermissionGroupInput,
  UpdatePermissionGroupInput,
  PermissionAction,
  ResourceType,
  PermissionEffect,
  PermissionScope
} from './types/permission.types'

// Export components
export {
  PermissionMatrix,
  RoleBuilder,
  ResourcePermissions,
  PermissionInheritance,
  PermissionTester
} from './components'

// Export service
export { permissionService } from './services/permissionService'

// Export utils
export { PermissionResolver, PermissionCache } from './utils'