/**
 * Options for slug generation
 */
export interface SlugOptions {
  /** Song title */
  title: string
  /** Song artist (optional) */
  artist?: string
  /** Existing slugs to check against for uniqueness */
  existingSlugs?: string[]
  /** Maximum attempts to generate unique slug before using timestamp */
  maxAttempts?: number
  /** Whether to include artist initials in slug */
  includeArtistInitials?: boolean
  /** Custom random ID length (default: 5) */
  randomIdLength?: number
}

/**
 * Generate a URL-safe slug from a string
 * 
 * @param text - Text to convert to slug
 * @returns URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-')      // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
}

/**
 * Extract initials from artist name
 * 
 * @param artist - Artist name
 * @returns Lowercase initials
 */
export function getArtistInitials(artist: string): string {
  if (!artist || artist.trim().length === 0) {
    return ''
  }
  
  // Split on spaces and hyphens to handle names like "Jean-Paul"
  return artist
    .trim()
    .split(/[\s-]+/)
    .map(word => word[0])
    .filter(char => char !== undefined)
    .join('')
    .toLowerCase()
}

/**
 * Generate a random alphanumeric ID
 * 
 * @param length - Length of the ID (default: 5)
 * @returns Random ID string
 */
export function generateRandomId(length: number = 5): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Generate a unique slug for a song
 * 
 * @param options - Slug generation options
 * @returns Promise resolving to unique slug
 */
export async function generateUniqueSlug(options: SlugOptions): Promise<string> {
  const {
    title,
    artist,
    existingSlugs = [],
    maxAttempts = 10,
    includeArtistInitials = true,
    randomIdLength = 5
  } = options
  
  // Generate base slug from title
  const baseSlug = slugify(title)
  
  // Handle empty base slug
  if (!baseSlug) {
    return `song-${generateRandomId(8)}`
  }
  
  // Generate artist initials if provided and enabled
  const initials = includeArtistInitials && artist 
    ? getArtistInitials(artist)
    : ''
  
  // Try to generate unique slug with random ID
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomId = generateRandomId(randomIdLength)
    
    const slug = initials 
      ? `${baseSlug}-${initials}-${randomId}`
      : `${baseSlug}-${randomId}`
    
    if (!existingSlugs.includes(slug)) {
      return slug
    }
  }
  
  // Fallback with timestamp if all attempts fail
  const timestamp = Date.now().toString(36)
  return initials
    ? `${baseSlug}-${initials}-${timestamp}`
    : `${baseSlug}-${timestamp}`
}

/**
 * Validate if a slug is well-formed
 * 
 * @param slug - Slug to validate
 * @returns True if valid slug format
 */
export function isValidSlug(slug: string): boolean {
  // Check if slug matches expected pattern
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugPattern.test(slug)
}

/**
 * Check if a slug is unique
 * 
 * @param slug - Slug to check
 * @param existingSlugs - Array of existing slugs
 * @returns True if slug is unique
 */
export function isUniqueSlug(slug: string, existingSlugs: string[]): boolean {
  return !existingSlugs.includes(slug)
}

/**
 * Parse a slug to extract components
 * 
 * @param slug - Slug to parse
 * @returns Parsed slug components
 */
export function parseSlug(slug: string): {
  base: string
  initials?: string
  id?: string
} {
  const parts = slug.split('-')
  
  // If only one part, it's all base
  if (parts.length === 1) {
    return { base: slug }
  }
  
  // Assume last part is ID if it looks like a random ID 
  // (5-8 chars, alphanumeric with at least one digit)
  const lastPart = parts[parts.length - 1]
  const isRandomId = /^[a-z0-9]{5,8}$/.test(lastPart) && /\d/.test(lastPart)
  
  if (!isRandomId) {
    return { base: slug }
  }
  
  const id = lastPart
  const remainingParts = parts.slice(0, -1)
  
  // Check if second-to-last part looks like initials (1-3 lowercase letters)
  // We limit to 3 to avoid confusing common words with initials
  if (remainingParts.length > 1) {
    const secondToLast = remainingParts[remainingParts.length - 1]
    const isInitials = /^[a-z]{1,3}$/.test(secondToLast)
    
    if (isInitials && remainingParts.length > 1) {
      const initials = secondToLast
      const baseParts = remainingParts.slice(0, -1)
      return {
        base: baseParts.join('-'),
        initials,
        id
      }
    }
  }
  
  return {
    base: remainingParts.join('-'),
    id
  }
}

/**
 * Regenerate a slug while preserving structure
 * 
 * @param existingSlug - Existing slug to regenerate
 * @param existingSlugs - Array of existing slugs to check against
 * @returns New unique slug with same structure
 */
export async function regenerateSlug(
  existingSlug: string,
  existingSlugs: string[]
): Promise<string> {
  const parsed = parseSlug(existingSlug)
  
  // Generate new random ID
  const newId = generateRandomId(parsed.id?.length || 5)
  
  // Reconstruct slug with new ID
  let newSlug: string
  if (parsed.initials) {
    newSlug = `${parsed.base}-${parsed.initials}-${newId}`
  } else if (parsed.id) {
    newSlug = `${parsed.base}-${newId}`
  } else {
    newSlug = `${parsed.base}-${newId}`
  }
  
  // Check uniqueness
  if (isUniqueSlug(newSlug, existingSlugs)) {
    return newSlug
  }
  
  // If still not unique, add timestamp
  const timestamp = Date.now().toString(36)
  return `${parsed.base}-${timestamp}`
}