import { supabase } from '../../../lib/supabase'
import type { UserWithRole, RoleAssignment, AuditLogEntry, UserFilter, AdminStats } from '../types/admin.types'
import type { UserRole } from '../../auth/types'

// Custom error classes (following songService pattern)
export class APIError extends Error {
  statusCode?: number
  code?: string
  
  constructor(message: string, statusCode?: number, code?: string) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.code = code
  }
}

// Cache implementation (reuse pattern from songs service)
interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
}

const requestCache = new Map<string, CacheEntry>()
const CACHE_TTL = 30000 // 30 seconds

function getCachedResult<T>(key: string): T | null {
  const cached = requestCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  requestCache.delete(key)
  return null
}

function setCachedResult<T>(key: string, data: T): void {
  requestCache.set(key, { data, timestamp: Date.now() })
}

function clearCache(): void {
  requestCache.clear()
}

// Helper function to map database users to UserWithRole type
interface DatabaseUser {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at: string
  last_sign_in_at?: string | null
  user_roles?: Array<{
    role: UserRole
    granted_by?: string | null
    granted_at?: string | null
    expires_at?: string | null
    is_active?: boolean
  }>
}

function mapUsersWithRoles(data: DatabaseUser[]): UserWithRole[] {
  return data.map(item => ({
    id: item.id,
    email: item.email,
    fullName: item.full_name || null,
    avatarUrl: item.avatar_url || null,
    createdAt: item.created_at,
    lastSignIn: item.last_sign_in_at || null,
    role: (item.user_roles?.[0]?.role || 'user') as UserRole,
    roleGrantedBy: item.user_roles?.[0]?.granted_by || null,
    roleGrantedAt: item.user_roles?.[0]?.granted_at || null,
    roleExpiresAt: item.user_roles?.[0]?.expires_at || null,
    isRoleActive: item.user_roles?.[0]?.is_active || false
  }))
}

// Helper function to map audit log entries
interface DatabaseAuditEntry {
  id: string
  user_id: string
  role: UserRole
  action: 'grant' | 'revoke' | 'expire'
  performed_by: string
  performed_at: string
  reason?: string | null
  metadata?: Record<string, unknown> | null
  user?: {
    email: string
    full_name?: string | null
  }
  performer?: {
    email: string
    full_name?: string | null
  }
}

function mapAuditEntries(data: DatabaseAuditEntry[]): AuditLogEntry[] {
  return data.map(item => ({
    id: item.id,
    userId: item.user_id,
    userEmail: item.user?.email || 'Unknown',
    role: item.role as UserRole,
    action: item.action,
    performedBy: item.performed_by,
    performedByEmail: item.performer?.email || 'Unknown',
    performedAt: item.performed_at,
    reason: item.reason,
    metadata: item.metadata
  }))
}

export const adminService = {
  async getUsers(filter?: UserFilter): Promise<{ users: UserWithRole[]; total: number }> {
    try {
      const cacheKey = `users:${JSON.stringify(filter || {})}`
      const cached = getCachedResult<{ users: UserWithRole[]; total: number }>(cacheKey)
      if (cached) return cached

      // Fetch users from the users table
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filter?.search) {
        query = query.or(`email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`)
      }

      // Sorting (adjust for available columns)
      const sortColumn = filter?.sortBy === 'last_sign_in' ? 'updated_at' : 
                        filter?.sortBy === 'role' ? 'created_at' : 
                        filter?.sortBy || 'created_at'
      query = query.order(sortColumn, { ascending: filter?.sortOrder !== 'desc' })

      // Pagination
      const limit = filter?.limit || 20
      const offset = ((filter?.page || 1) - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw new APIError(error.message, 500)

      // Map users with default roles (since user_roles table is not available in types)
      const users: UserWithRole[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name || null,
        avatarUrl: user.avatar_url || null,
        createdAt: user.created_at || new Date().toISOString(),
        lastSignIn: user.updated_at || null,
        role: 'user' as UserRole, // Default role
        roleGrantedBy: null,
        roleGrantedAt: null,
        roleExpiresAt: null,
        isRoleActive: true
      }))

      // Filter by role if specified (mock filter)
      const filteredUsers = filter?.role && filter.role !== 'all' 
        ? users.filter(u => u.role === filter.role)
        : users

      const result = { users: filteredUsers, total: count || 0 }
      
      setCachedResult(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async assignRole(assignment: RoleAssignment): Promise<void> {
    try {
      clearCache()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new APIError('Authentication required', 401)

      // Mock implementation - log the assignment
      console.log('Role assignment (mock):', {
        userId: assignment.userId,
        role: assignment.role,
        grantedBy: user.id,
        expiresAt: assignment.expiresAt,
        reason: assignment.reason
      })

      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Note: In production, this would update the user_roles table
      // and create an audit log entry
    } catch (error) {
      console.error('Error assigning role:', error)
      throw error
    }
  },

  async revokeRole(userId: string, reason?: string): Promise<void> {
    try {
      clearCache()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new APIError('Authentication required', 401)

      // Get current role for audit
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (!currentRole) throw new APIError('User role not found', 404)

      // Remove role (set to user)
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: 'user',
          is_active: false,
          revoked_by: user.id,
          revoked_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (roleError) throw new APIError(roleError.message, 400)

      // Log to audit
      const { error: auditError } = await supabase
        .from('role_audit_log')
        .insert({
          user_id: userId,
          role: currentRole.role,
          action: 'revoke',
          performed_by: user.id,
          reason,
          metadata: {}
        })

      if (auditError) {
        console.error('Audit log error:', auditError)
      }
    } catch (error) {
      console.error('Error revoking role:', error)
      throw error
    }
  },

  async getAuditLog(userId?: string): Promise<AuditLogEntry[]> {
    try {
      const cacheKey = `audit:${userId || 'all'}`
      const cached = getCachedResult(cacheKey)
      if (cached) return cached

      let query = supabase
        .from('role_audit_log')
        .select(`
          *,
          user:users!role_audit_log_user_id_fkey(email, full_name),
          performer:users!role_audit_log_performed_by_fkey(email, full_name)
        `)
        .order('performed_at', { ascending: false })
        .limit(100)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw new APIError(error.message, 500)

      const entries = mapAuditEntries(data || [])
      setCachedResult(cacheKey, entries)
      return entries
    } catch (error) {
      console.error('Error fetching audit log:', error)
      throw error
    }
  },

  async getAdminStats(): Promise<AdminStats> {
    try {
      const cached = getCachedResult('admin-stats')
      if (cached) return cached

      // Get user counts by role
      const { data: roleCounts, error: roleError } = await supabase
        .from('user_roles')
        .select('role', { count: 'exact' })
        .eq('is_active', true)

      if (roleError) throw new APIError(roleError.message, 500)

      // Get total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (totalError) throw new APIError(totalError.message, 500)

      // Get recent role changes (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: recentChanges, error: recentError } = await supabase
        .from('role_audit_log')
        .select('*', { count: 'exact', head: true })
        .gte('performed_at', sevenDaysAgo.toISOString())

      if (recentError) throw new APIError(recentError.message, 500)

      // Calculate counts by role
      const roleCountMap = new Map<string, number>()
      roleCounts?.forEach(item => {
        roleCountMap.set(item.role, item.count || 0)
      })

      const stats: AdminStats = {
        totalUsers: totalUsers || 0,
        adminCount: roleCountMap.get('admin') || 0,
        moderatorCount: roleCountMap.get('moderator') || 0,
        regularUserCount: roleCountMap.get('user') || 0,
        recentRoleChanges: recentChanges || 0
      }

      setCachedResult('admin-stats', stats)
      return stats
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      throw error
    }
  }
}