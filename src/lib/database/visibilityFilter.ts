/**
 * Visibility filtering logic for database queries
 * Implements the exact logic from songService.ts lines 197-208
 */

export interface UserPermissions {
  userId?: string
  roles: string[]
  canModerate: boolean
  canAdmin: boolean
}

/**
 * Apply visibility filtering for public/anonymous users
 * Only shows public content that is not rejected
 * @param query - The Supabase query builder chain
 * @returns Modified query with visibility filters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function forPublicUser(query: any): any {
  // Public users: show only public content that is not rejected
  // Include records where moderation_status is null, 'approved', 'pending', or 'flagged'
  return query
    .eq('is_public', true)
    .or('moderation_status.is.null,moderation_status.in.(approved,pending,flagged)')
}

/**
 * Apply visibility filtering for authenticated users
 * Shows public content + user's own content
 * @param query - The Supabase query builder chain
 * @param userId - The authenticated user's ID
 * @returns Modified query with visibility filters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function forAuthenticatedUser(query: any, userId: string): any {
  // Authenticated non-moderator users: see public content + their own content
  // Complex OR condition: (public AND not rejected) OR (created by user)
  // Include records where moderation_status is null, 'approved', 'pending', or 'flagged' (exclude only 'rejected')
  
  // Sanitize userId to prevent injection (escape single quotes)
  const sanitizedUserId = userId.replace(/'/g, "''")
  
  return query.or(
    `and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.${sanitizedUserId}`
  )
}

/**
 * Apply visibility filtering for moderators/admins
 * Shows all content without restriction
 * @param query - The Supabase query builder chain
 * @returns Unmodified query (moderators see everything)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function forModerator(query: any): any {
  // Moderators and admins see everything - no filtering needed
  return query
}

/**
 * Main entry point for applying visibility filters
 * Determines the appropriate filter based on user permissions
 * @param query - The Supabase query builder chain
 * @param permissions - User permissions object
 * @returns Modified query with appropriate visibility filters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilter(query: any, permissions: UserPermissions): any {
  // If user can moderate or admin, they see everything
  if (permissions.canModerate || permissions.canAdmin) {
    return forModerator(query)
  }
  
  // If user is authenticated but not a moderator
  if (permissions.userId) {
    return forAuthenticatedUser(query, permissions.userId)
  }
  
  // Public/anonymous users
  return forPublicUser(query)
}

/**
 * Check if a single record is visible to a user
 * Used for single record fetches where we need to verify access
 * @param record - The database record to check
 * @param permissions - User permissions object
 * @returns True if the record is visible to the user
 */
export function isRecordVisible(
  record: {
    is_public?: boolean | null
    moderation_status?: string | null
    created_by?: string | null
  },
  permissions: UserPermissions
): boolean {
  // Moderators and admins can see everything
  if (permissions.canModerate || permissions.canAdmin) {
    return true
  }
  
  // Check if record is created by the user
  if (permissions.userId && record.created_by === permissions.userId) {
    return true
  }
  
  // Check public visibility
  if (record.is_public === false) {
    return false
  }
  
  // Check moderation status (reject only 'rejected' status)
  if (record.moderation_status === 'rejected') {
    return false
  }
  
  // Record is visible (public and not rejected)
  return true
}

/**
 * Build a visibility filter string for raw SQL or RPC calls
 * @param permissions - User permissions object
 * @returns SQL WHERE clause string
 */
export function buildVisibilitySQL(permissions: UserPermissions): string {
  if (permissions.canModerate || permissions.canAdmin) {
    return '1=1' // No filtering for moderators
  }
  
  if (permissions.userId) {
    // Sanitize userId for SQL
    const sanitizedUserId = permissions.userId.replace(/'/g, "''")
    return `(
      (is_public != false AND (moderation_status IS NULL OR moderation_status IN ('approved', 'pending', 'flagged')))
      OR created_by = '${sanitizedUserId}'
    )`
  }
  
  // Public users
  return `(
    is_public = true 
    AND (moderation_status IS NULL OR moderation_status IN ('approved', 'pending', 'flagged'))
  )`
}

/**
 * Create a filter object for client-side filtering
 * Useful for filtering already fetched data
 * @param permissions - User permissions object
 * @returns Filter function
 */
export function createClientFilter(permissions: UserPermissions) {
  return (record: {
    is_public?: boolean | null
    moderation_status?: string | null
    created_by?: string | null
  }) => isRecordVisible(record, permissions)
}