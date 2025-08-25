/**
 * Feature flags for controlling application functionality
 * These flags allow us to enable/disable features without code changes
 */

/**
 * Enable advanced permission management UI
 * When false, the permission management page shows "Coming Soon"
 * When true, shows the full permission matrix interface (once tables are created)
 */
export const ENABLE_ADVANCED_PERMISSIONS = false

/**
 * Enable custom roles functionality
 * Requires additional database tables that don't exist yet
 */
export const ENABLE_CUSTOM_ROLES = false

/**
 * Enable permission groups functionality
 * Requires additional database tables that don't exist yet
 */
export const ENABLE_PERMISSION_GROUPS = false

/**
 * Enable direct permission assignments to users
 * Requires user_permissions table that doesn't exist yet
 */
export const ENABLE_DIRECT_PERMISSIONS = false

/**
 * Feature flag registry for runtime checking
 */
export const FEATURE_FLAGS = {
  ADVANCED_PERMISSIONS: ENABLE_ADVANCED_PERMISSIONS,
  CUSTOM_ROLES: ENABLE_CUSTOM_ROLES,
  PERMISSION_GROUPS: ENABLE_PERMISSION_GROUPS,
  DIRECT_PERMISSIONS: ENABLE_DIRECT_PERMISSIONS,
} as const

/**
 * Helper function to check if a feature is enabled
 * @param feature Feature flag name
 * @returns true if the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] as boolean === true
}