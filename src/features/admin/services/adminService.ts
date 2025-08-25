import { supabase } from '../../../lib/supabase'
import type { UserWithRole, RoleAssignment, AuditLogEntry, UserFilter, AdminStats } from '../types/admin.types'
import type { UserRole } from '../../auth/types'
import type { UserRoleRow } from '../types/database.types'

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

// Cache implementation
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

export const adminService = {
  async getUsers(filter?: UserFilter): Promise<{ users: UserWithRole[]; total: number }> {
    try {
      const cacheKey = `users:${JSON.stringify(filter || {})}`
      const cached = getCachedResult<{ users: UserWithRole[]; total: number }>(cacheKey)
      if (cached) return cached

      // First, get users from the users table
      let userQuery = supabase
        .from('users')
        .select('*', { count: 'exact' })

      // Apply search filter
      if (filter?.search) {
        userQuery = userQuery.or(`email.ilike.%${filter.search}%,full_name.ilike.%${filter.search}%`)
      }

      // Sorting
      const sortColumn = filter?.sortBy === 'last_sign_in' ? 'updated_at' : filter?.sortBy || 'created_at'
      userQuery = userQuery.order(sortColumn, { ascending: filter?.sortOrder !== 'desc' })

      // Pagination
      const limit = filter?.limit || 20
      const offset = ((filter?.page || 1) - 1) * limit
      userQuery = userQuery.range(offset, offset + limit - 1)

      const { data: userData, error: userError, count } = await userQuery

      if (userError) throw new APIError(userError.message, 500)

      // Get roles for these users
      const userIds = userData?.map(u => u.id) || []
      let roleData: UserRoleRow[] = []
      
      if (userIds.length > 0) {
        const { data: roles, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .in('user_id', userIds)
          .eq('is_active', true)

        if (roleError) {
          console.warn('Error fetching roles:', roleError)
          // Continue without roles rather than failing
        } else {
          roleData = roles || []
        }
      }

      // Create role lookup map
      const roleMap = new Map<string, UserRoleRow>()
      roleData.forEach(role => {
        if (role.user_id) {
          roleMap.set(role.user_id, role)
        }
      })

      // Map to UserWithRole type
      let users: UserWithRole[] = (userData || []).map((user) => {
        const userRole = roleMap.get(user.id)
        return {
          id: user.id,
          email: user.email,
          fullName: user.full_name || null,
          avatarUrl: user.avatar_url || null,
          createdAt: user.created_at || new Date().toISOString(),
          lastSignIn: user.updated_at || null,
          role: (userRole?.role || 'user') as UserRole,
          roleGrantedBy: userRole?.granted_by || null,
          roleGrantedAt: userRole?.granted_at || null,
          roleExpiresAt: userRole?.expires_at || null,
          isRoleActive: userRole?.is_active ?? false
        }
      })

      // Apply role filter after mapping
      if (filter?.role && filter.role !== 'all') {
        users = users.filter(user => user.role === filter.role)
      }

      const result = { users, total: count || 0 }
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

      // Upsert role assignment
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: assignment.userId,
          role: assignment.role,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          expires_at: assignment.expiresAt,
          is_active: true
        }, {
          onConflict: 'user_id'
        })

      if (roleError) throw new APIError(roleError.message, 400)

      // Log to audit
      const { error: auditError } = await supabase
        .from('role_audit_log')
        .insert({
          user_id: assignment.userId,
          role: assignment.role,
          action: 'grant',
          performed_by: user.id,
          reason: assignment.reason,
          metadata: { expires_at: assignment.expiresAt }
        })

      if (auditError) {
        console.error('Audit log error:', auditError)
        // Don't throw - audit failure shouldn't block operation
      }
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

      // Update role to 'user' and deactivate
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: 'user',
          is_active: false,
          granted_by: user.id,
          granted_at: new Date().toISOString()
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
      const cached = getCachedResult<AuditLogEntry[]>(cacheKey)
      if (cached) return cached

      // First, get the audit log data without joins
      let query = supabase
        .from('role_audit_log')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(100)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: auditData, error: auditError } = await query

      if (auditError) throw new APIError(auditError.message, 500)

      if (!auditData || auditData.length === 0) {
        return []
      }

      // Get unique user IDs for batch lookup
      const userIds = Array.from(new Set([
        ...auditData.map(item => item.user_id),
        ...auditData.map(item => item.performed_by)
      ].filter(Boolean) as string[]))

      // Get user information from the users table (if it exists)
      const userMap = new Map<string, UserWithRole>()
      
      if (userIds.length > 0) {
        // Try to get from public.users first, fallback to minimal data
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', userIds)
          
          if (!userError && userData) {
            userData.forEach(user => {
              userMap.set(user.id, {
                id: user.id,
                email: user.email,
                fullName: user.full_name || null,
                avatarUrl: null,
                createdAt: new Date().toISOString(),
                lastSignIn: null,
                role: 'user' as UserRole,
                roleGrantedBy: null,
                roleGrantedAt: null,
                roleExpiresAt: null,
                isRoleActive: false
              })
            })
          }
        } catch (error) {
          console.warn('Could not fetch user details, using minimal data:', error)
        }
      }

      // Map to AuditLogEntry type
      const entries: AuditLogEntry[] = auditData.map((item) => {
        const user = item.user_id ? userMap.get(item.user_id) : undefined
        const performer = item.performed_by ? userMap.get(item.performed_by) : undefined
        
        return {
          id: item.id,
          userId: item.user_id || 'unknown',
          userEmail: user?.email || 'Unknown User',
          role: item.role as UserRole,
          action: item.action as 'grant' | 'revoke' | 'expire',
          performedBy: item.performed_by || 'system',
          performedByEmail: performer?.email || 'System',
          performedAt: item.performed_at || new Date().toISOString(),
          reason: item.reason,
          metadata: item.metadata as Record<string, unknown> | null
        }
      })

      setCachedResult(cacheKey, entries)
      return entries
    } catch (error) {
      console.error('Error fetching audit log:', error)
      throw error
    }
  },

  async getAdminStats(): Promise<AdminStats> {
    try {
      const cached = getCachedResult<AdminStats>('admin-stats')
      if (cached) return cached

      // Get total users
      const { count: totalUsers, error: userCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (userCountError) {
        console.warn('Error fetching user count:', userCountError)
      }

      // Get user counts by role (handle potential errors gracefully)
      interface RoleCount {
        role: UserRole
        count: number
      }
      let roleCounts: RoleCount[] = []
      try {
        const { data, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('is_active', true)
        
        if (roleError) {
          console.warn('Error fetching role counts:', roleError)
        } else if (data) {
          // Convert raw data to RoleCount format
          const roleGroups = data.reduce((acc, item) => {
            const role = item.role as UserRole
            acc[role] = (acc[role] || 0) + 1
            return acc
          }, {} as Record<UserRole, number>)
          
          roleCounts = Object.entries(roleGroups).map(([role, count]) => ({
            role: role as UserRole,
            count: count as number
          }))
        }
      } catch (error) {
        console.warn('Error fetching role counts:', error)
      }

      // Get recent role changes (last 7 days) - handle potential errors gracefully
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      let recentChanges = 0
      try {
        const { count, error: auditError } = await supabase
          .from('role_audit_log')
          .select('*', { count: 'exact', head: true })
          .gte('performed_at', sevenDaysAgo.toISOString())
        
        if (auditError) {
          console.warn('Error fetching recent changes:', auditError)
        } else {
          recentChanges = count || 0
        }
      } catch (error) {
        console.warn('Error fetching recent changes:', error)
      }

      // Calculate counts by role (data is already aggregated)
      const roleCountMap = new Map<string, number>()
      roleCounts.forEach((item) => {
        roleCountMap.set(item.role, item.count)
      })

      const stats: AdminStats = {
        totalUsers: totalUsers || 0,
        adminCount: roleCountMap.get('admin') || 0,
        moderatorCount: roleCountMap.get('moderator') || 0,
        regularUserCount: Math.max(0, (totalUsers || 0) - (roleCountMap.get('admin') || 0) - (roleCountMap.get('moderator') || 0)),
        recentRoleChanges: recentChanges
      }

      setCachedResult('admin-stats', stats)
      return stats
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      // Return fallback stats rather than throwing
      return {
        totalUsers: 0,
        adminCount: 0,
        moderatorCount: 0,
        regularUserCount: 0,
        recentRoleChanges: 0
      }
    }
  }
}