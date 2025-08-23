// Components
export { UserList } from './components/UserList'
export { AuditLogViewer } from './components/AuditLogViewer'
export { RoleAssignmentModal } from './components/RoleAssignmentModal'
export { AdminNav } from './components/AdminNav'

// Hooks
export { useUsers, useAdminStats } from './hooks/useUsers'
export { useRoleManagement } from './hooks/useRoleManagement'
export { useAuditLog } from './hooks/useAuditLog'

// Types
export type {
  UserWithRole,
  RoleAssignment,
  AuditLogEntry,
  AdminStats,
  UserFilter
} from './types/admin.types'

// Services
export { adminService } from './services/adminService'