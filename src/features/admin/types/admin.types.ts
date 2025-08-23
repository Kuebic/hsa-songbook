import type { UserRole } from '../../auth/types'

export interface UserWithRole {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  createdAt: string
  lastSignIn: string | null
  role: UserRole
  roleGrantedBy: string | null
  roleGrantedAt: string | null
  roleExpiresAt: string | null
  isRoleActive: boolean
}

export interface RoleAssignment {
  userId: string
  role: UserRole
  expiresAt?: string
  reason?: string
}

export interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  role: UserRole
  action: 'grant' | 'revoke' | 'expire'
  performedBy: string
  performedByEmail: string
  performedAt: string
  reason: string | null
  metadata: Record<string, unknown> | null
}

export interface AdminStats {
  totalUsers: number
  adminCount: number
  moderatorCount: number
  regularUserCount: number
  recentRoleChanges: number
}

export interface UserFilter {
  search?: string
  role?: UserRole | 'all'
  sortBy?: 'email' | 'created_at' | 'last_sign_in' | 'role'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}