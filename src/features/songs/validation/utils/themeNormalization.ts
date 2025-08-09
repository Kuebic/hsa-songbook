import { NORMALIZED_THEMES, THEME_MAPPINGS, type NormalizedTheme } from '../constants/themes'
import { levenshteinDistance } from './levenshtein'

/**
 * Normalize a single theme to its canonical form
 * 
 * @param input - Raw theme input
 * @param maxDistance - Maximum Levenshtein distance for fuzzy matching (optional)
 * @returns Normalized theme string
 */
export function normalizeTheme(input: string, maxDistance?: number): string {
  const trimmed = input.trim()
  
  if (!trimmed) {
    return ''
  }
  
  const trimmedLower = trimmed.toLowerCase()
  
  // Check for mapping first (handles variations)
  if (THEME_MAPPINGS[trimmedLower]) {
    return THEME_MAPPINGS[trimmedLower]
  }
  
  // Check for exact match in normalized themes (case-insensitive)
  const normalized = NORMALIZED_THEMES.find(
    t => t.toLowerCase() === trimmedLower
  )
  if (normalized) {
    return normalized
  }
  
  // Optional: Find closest match within threshold
  if (maxDistance && maxDistance > 0) {
    let closestTheme = ''
    let minDistance = Infinity
    
    for (const theme of NORMALIZED_THEMES) {
      const distance = levenshteinDistance(theme.toLowerCase(), trimmedLower)
      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance
        closestTheme = theme
      }
    }
    
    if (closestTheme) {
      return closestTheme
    }
  }
  
  // Return original trimmed value if no match found (for custom themes)
  return trimmed
}

/**
 * Normalize an array of themes, removing duplicates
 * 
 * @param themes - Array of theme strings
 * @param maxDistance - Maximum Levenshtein distance for fuzzy matching (optional)
 * @returns Array of normalized, unique themes
 */
export function normalizeThemes(themes: string[], maxDistance?: number): string[] {
  const normalized = themes
    .map(t => normalizeTheme(t, maxDistance))
    .filter(t => t.length > 0) // Filter out empty themes
  
  // Remove duplicates while preserving order
  return Array.from(new Set(normalized))
}

/**
 * Suggest themes based on partial input
 * 
 * @param input - Partial theme input
 * @param maxSuggestions - Maximum number of suggestions to return
 * @returns Array of suggested theme strings
 */
export function getSuggestedThemes(input: string, maxSuggestions: number = 5): string[] {
  if (!input || input.trim().length === 0) {
    return []
  }
  
  const lower = input.toLowerCase().trim()
  const suggestions: string[] = []
  
  // Check normalized themes for prefix matches
  for (const theme of NORMALIZED_THEMES) {
    if (theme.toLowerCase().startsWith(lower)) {
      suggestions.push(theme)
      if (suggestions.length >= maxSuggestions) {
        return suggestions
      }
    }
  }
  
  // Check normalized themes for contains matches
  for (const theme of NORMALIZED_THEMES) {
    if (!suggestions.includes(theme) && theme.toLowerCase().includes(lower)) {
      suggestions.push(theme)
      if (suggestions.length >= maxSuggestions) {
        return suggestions
      }
    }
  }
  
  return suggestions
}

/**
 * Validate if a theme is valid (either normalized or can be normalized)
 * 
 * @param theme - Theme to validate
 * @param customValidator - Optional custom validation function
 * @returns True if theme is valid, false otherwise
 */
export function isValidTheme(
  theme: string,
  customValidator?: (theme: string) => boolean
): boolean {
  if (!theme || theme.trim().length === 0) {
    return false
  }
  
  // Check custom validator first
  if (customValidator) {
    return customValidator(theme)
  }
  
  const trimmedLower = theme.trim().toLowerCase()
  
  // Check if it's in the mappings
  if (THEME_MAPPINGS[trimmedLower]) {
    return true
  }
  
  // Check if it's a normalized theme
  return NORMALIZED_THEMES.some(t => t.toLowerCase() === trimmedLower)
}

/**
 * Theme statistics
 */
export interface ThemeStats {
  total: number
  unique: number
  normalized: number
  unknown: number
  frequency: Record<string, number>
}

/**
 * Calculate statistics for a collection of themes
 * 
 * @param themes - Array of theme strings
 * @returns Theme statistics
 */
export function themeStats(themes: string[]): ThemeStats {
  const frequency: Record<string, number> = {}
  let normalized = 0
  let unknown = 0
  
  for (let i = 0; i < themes.length; i++) {
    const original = themes[i]
    const normalizedTheme = normalizeTheme(original)
    
    frequency[normalizedTheme] = (frequency[normalizedTheme] || 0) + 1
    
    // Check if it's in our normalized vocabulary
    if (NORMALIZED_THEMES.includes(normalizedTheme as any)) {
      // Only count as "normalized" if it was actually transformed
      if (original !== normalizedTheme) {
        normalized++
      }
    } else {
      // It's an unknown/custom theme
      unknown++
    }
  }
  
  return {
    total: themes.length,
    unique: Object.keys(frequency).length,
    normalized,
    unknown,
    frequency
  }
}