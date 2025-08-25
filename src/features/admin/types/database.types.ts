// Temporary database types for RBAC tables
// These should be generated from the database schema using `npx supabase gen types`
// but are manually defined here until the database types are regenerated

import type { UserRole } from '../../auth/types'

export interface UserRoleRow {
  id: string
  user_id: string | null
  role: UserRole
  granted_by: string | null
  granted_at: string | null
  expires_at: string | null
  is_active: boolean | null
}

export interface RoleAuditLogRow {
  id: string
  user_id: string | null
  role: UserRole
  action: 'grant' | 'revoke' | 'expire'
  performed_by: string | null
  performed_at: string | null
  reason: string | null
  metadata: Record<string, unknown> | null
}

export interface UserRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string | null
  last_sign_in_at: string | null
  username: string | null
  provider: string | null
  provider_id: string | null
  metadata: Record<string, unknown> | null
}