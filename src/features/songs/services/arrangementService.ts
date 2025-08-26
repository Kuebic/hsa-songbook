import { supabase } from '../../../lib/supabase'
import { nullToUndefined } from '@shared/utils/typeHelpers'
import type { Arrangement } from '../types/song.types'
import type { Database } from '../../../lib/database.types'
import type { UnknownObject } from '../../../shared/types/common'
import { generateUniqueSlug, type SlugOptions } from '../validation/utils/slugGeneration'
import { extractRoleClaims } from '../../auth/utils/jwt'
import { 
  buildUserPermissions,
  createQueryBuilder 
} from '../../../lib/database/migrationHelper'

// Re-export error classes from songService for consistency
export { APIError, NetworkError, NotFoundError } from './songService'
import { APIError, NetworkError, NotFoundError } from './songService'

// Type mapping from Supabase to application types
type SupabaseArrangement = Database['public']['Tables']['arrangements']['Row']

// Check if user is moderator or admin
async function checkUserPermissions(): Promise<{ canModerate: boolean; userId: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { canModerate: false, userId: null }
    }
    
    const roleClaims = extractRoleClaims(session.access_token)
    return { 
      canModerate: roleClaims.canModerate || roleClaims.canAdmin,
      userId: session.user?.id || null
    }
  } catch {
    return { canModerate: false, userId: null }
  }
}

// Convert Supabase arrangement to application Arrangement type
export function mapSupabaseArrangementToArrangement(supabaseArrangement: SupabaseArrangement): Arrangement {
  return {
    id: supabaseArrangement.id,
    name: supabaseArrangement.name,
    slug: supabaseArrangement.slug,
    songIds: [supabaseArrangement.song_id], // Note: single song ID in array for compatibility
    key: supabaseArrangement.key || '',
    tempo: supabaseArrangement.tempo || undefined,
    timeSignature: nullToUndefined(supabaseArrangement.time_signature),
    difficulty: (supabaseArrangement.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
    tags: supabaseArrangement.tags || [],
    chordData: supabaseArrangement.chord_data,
    description: supabaseArrangement.description || undefined,
    createdBy: supabaseArrangement.created_by || '',
    metadata: {
      isPublic: supabaseArrangement.is_public !== false, // Default to true if null
      views: supabaseArrangement.views || 0,
      moderationStatus: supabaseArrangement.moderation_status as 'pending' | 'approved' | 'rejected' | 'flagged' | null,
      moderationNote: supabaseArrangement.moderation_note || undefined
    },
    createdAt: nullToUndefined(supabaseArrangement.created_at),
    updatedAt: nullToUndefined(supabaseArrangement.updated_at)
  }
}

// Simple cache for deduplicating requests (following songService pattern)
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const arrangementCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds

// Helper function to handle caching
function getCachedResult<T>(cacheKey: string): T | null {
  const cached = arrangementCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCachedResult<T>(cacheKey: string, data: T): void {
  arrangementCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
}

// Function to clear the cache (useful for mutations)
function clearArrangementCache() {
  arrangementCache.clear()
}

// Generate arrangement slug with auto-generated title
async function generateArrangementSlug(
  arrangementName: string, 
  songTitle: string,
  existingSlugs: string[] = []
): Promise<string> {
  // Create composite title: "[Song Title] - [Arrangement Name]"
  const compositeTitle = `${songTitle} - ${arrangementName}`
  
  const options: SlugOptions = {
    title: compositeTitle,
    existingSlugs,
    includeArtistInitials: false, // Don't use artist initials for arrangements
    maxAttempts: 10,
    randomIdLength: 5
  }
  
  return generateUniqueSlug(options)
}

// Get all existing arrangement slugs (for uniqueness checking)
async function getExistingArrangementSlugs(): Promise<string[]> {
  try {
    const result = await createQueryBuilder(supabase, 'arrangements')
      .select('slug')
      .execute()
    
    if (result.error) {
      console.warn('Failed to fetch existing arrangement slugs:', result.error)
      return []
    }
    
    return (Array.isArray(result.data) ? result.data : []).map(item => item.slug)
  } catch (error) {
    console.warn('Error fetching existing arrangement slugs:', error)
    return []
  }
}

export const arrangementService = {
  async getAllArrangements(): Promise<Arrangement[]> {
    try {
      // Check user permissions
      const { canModerate, userId } = await checkUserPermissions()
      
      // Check cache first (include permissions in cache key)
      const cacheKey = `getAllArrangements:${canModerate}:${userId}`
      const cachedResult = getCachedResult<Arrangement[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const permissions = buildUserPermissions({ userId, canModerate })
      
      const result = await createQueryBuilder(supabase, 'arrangements')
        .select(`
          *,
          songs!arrangements_song_id_fkey (title)
        `)
        .withVisibility(permissions)
        .orderBy('name', { ascending: true })
        .execute()

      if (result.error) {
        console.error('QueryBuilder error in getAllArrangements:', result.error)
        throw new APIError(result.error.message, 500, 'QUERY_ERROR')
      }

      const arrangements = (Array.isArray(result.data) ? result.data : []).map(mapSupabaseArrangementToArrangement)
      
      // Cache the result
      setCachedResult(cacheKey, arrangements)
      
      return arrangements
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch arrangements')
    }
  },

  async getArrangementById(id: string): Promise<Arrangement> {
    try {
      const { canModerate, userId } = await checkUserPermissions()
      const cacheKey = `getArrangementById:${id}:${canModerate}:${userId}`
      const cachedResult = getCachedResult<Arrangement>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }
      
      const permissions = buildUserPermissions({ userId, canModerate })
      const result = await createQueryBuilder(supabase, 'arrangements')
        .select(`*, songs!arrangements_song_id_fkey (title)`)
        .eq('id', id)
        .withVisibility(permissions)
        .single()
        .execute()
      
      if (result.error) {
        if (result.error.code === 'NOT_FOUND') {
          throw new NotFoundError(`Arrangement with id ${id}`)
        }
        throw new APIError(result.error.message, 500, 'QUERY_ERROR')
      }
      
      if (!result.data) {
        throw new NotFoundError(`Arrangement with id ${id}`)
      }
      
      const arrangement = mapSupabaseArrangementToArrangement(result.data as SupabaseArrangement)
      setCachedResult(cacheKey, arrangement)
      return arrangement
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new NetworkError('Failed to fetch arrangement')
    }
  },

  async getArrangementBySlug(slug: string): Promise<Arrangement> {
    try {
      const { canModerate, userId } = await checkUserPermissions()
      const cacheKey = `getArrangementBySlug:${slug}:${canModerate}:${userId}`
      const cachedResult = getCachedResult<Arrangement>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }
      
      const permissions = buildUserPermissions({ userId, canModerate })
      const result = await createQueryBuilder(supabase, 'arrangements')
        .select(`*, songs!arrangements_song_id_fkey (title)`)
        .eq('slug', slug)
        .withVisibility(permissions)
        .single()
        .execute()
      
      if (result.error) {
        if (result.error.code === 'NOT_FOUND') {
          throw new NotFoundError(`Arrangement with slug ${slug}`)
        }
        throw new APIError(result.error.message, 500, 'QUERY_ERROR')
      }
      
      if (!result.data) {
        throw new NotFoundError(`Arrangement with slug ${slug}`)
      }
      
      const arrangement = mapSupabaseArrangementToArrangement(result.data as SupabaseArrangement)
      setCachedResult(cacheKey, arrangement)
      return arrangement
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new NetworkError('Failed to fetch arrangement')
    }
  },

  async getArrangementsBySongId(songId: string): Promise<Arrangement[]> {
    try {
      const { canModerate, userId } = await checkUserPermissions()
      const cacheKey = `getArrangementsBySongId:${songId}:${canModerate}:${userId}`
      const cachedResult = getCachedResult<Arrangement[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }
      
      const permissions = buildUserPermissions({ userId, canModerate })
      const result = await createQueryBuilder(supabase, 'arrangements')
        .select(`*, songs!arrangements_song_id_fkey (title)`)
        .eq('song_id', songId)
        .withVisibility(permissions)
        .orderBy('name', { ascending: true })
        .execute()
      
      if (result.error) {
        throw new APIError(result.error.message, 500, 'QUERY_ERROR')
      }
      
      const arrangements = (Array.isArray(result.data) ? result.data : []).map(mapSupabaseArrangementToArrangement)
      setCachedResult(cacheKey, arrangements)
      return arrangements
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new NetworkError('Failed to fetch arrangements')
    }
  },

  async searchArrangements(params: {
    searchQuery?: string
    songId?: string
    key?: string
    difficulty?: Arrangement['difficulty']
    tags?: string[]
  }): Promise<Arrangement[]> {
    try {
      const cacheKey = `searchArrangements:${JSON.stringify(params)}`
      const cachedResult = getCachedResult<Arrangement[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }
      
      let query = createQueryBuilder(supabase, 'arrangements')
        .select(`*, songs!arrangements_song_id_fkey (title, artist)`)
      
      // Apply filters
      if (params.searchQuery) {
        query = query.or(`name.ilike.%${params.searchQuery}%,description.ilike.%${params.searchQuery}%`)
      }
      if (params.songId) {
        query = query.eq('song_id', params.songId)
      }
      if (params.key) {
        query = query.eq('key', params.key)
      }
      if (params.difficulty) {
        query = query.eq('difficulty', params.difficulty)
      }
      if (params.tags && params.tags.length > 0) {
        query = query.contains('tags', params.tags)
      }
      
      const result = await query.orderBy('name', { ascending: true }).execute()
      
      if (result.error) {
        console.error('QueryBuilder error in searchArrangements:', result.error)
        throw new APIError(result.error.message, 500, 'QUERY_ERROR')
      }
      
      const arrangements = (Array.isArray(result.data) ? result.data : []).map(mapSupabaseArrangementToArrangement)
      setCachedResult(cacheKey, arrangements)
      return arrangements
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new NetworkError('Failed to search arrangements')
    }
  },

  async createArrangement(arrangementData: Partial<Arrangement>): Promise<Arrangement> {
    try {
      clearArrangementCache() // Clear cache after mutation
      
      // Get current user ID (Supabase handles this automatically via RLS)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
      }
      
      // Validate required fields
      if (!arrangementData.name) {
        throw new APIError('Arrangement name is required', 400, 'VALIDATION_ERROR')
      }
      if (!arrangementData.songIds || arrangementData.songIds.length === 0) {
        throw new APIError('Song ID is required', 400, 'VALIDATION_ERROR')
      }
      
      const songId = arrangementData.songIds[0]
      
      // Get song title for auto-generated slug
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('title')
        .eq('id', songId)
        .single()
      
      if (songError || !songData) {
        throw new APIError('Invalid song ID', 400, 'VALIDATION_ERROR')
      }
      
      // Generate unique slug
      const existingSlugs = await getExistingArrangementSlugs()
      const slug = await generateArrangementSlug(
        arrangementData.name,
        songData.title,
        existingSlugs
      )
      
      // Map to insert data
      const insertData: Database['public']['Tables']['arrangements']['Insert'] = {
        name: arrangementData.name,
        song_id: songId,
        slug,
        chord_data: arrangementData.chordData || '',
        key: arrangementData.key || null,
        tempo: arrangementData.tempo || null,
        time_signature: arrangementData.timeSignature || '4/4',
        difficulty: arrangementData.difficulty || 'beginner',
        description: arrangementData.description || null,
        tags: arrangementData.tags || [],
        created_by: user.id
      }
      
      // Use QueryBuilder for insert
      const result = await createQueryBuilder(supabase, 'arrangements')
        .insert(insertData)
        .select('*, songs!arrangements_song_id_fkey (title)')
        .single()
        .execute()
      
      if (result.error) {
        // Handle unique constraint violations
        if (result.error.code === '23505') {
          throw new APIError('An arrangement with this slug already exists', 400, 'DUPLICATE_SLUG')
        }
        throw new APIError(result.error.message, 400, 'QUERY_ERROR')
      }
      
      if (!result.data) {
        throw new APIError('Failed to create arrangement', 500, 'QUERY_ERROR')
      }
      
      return mapSupabaseArrangementToArrangement(result.data as SupabaseArrangement)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new NetworkError('Failed to create arrangement')
    }
  },

  async updateArrangement(id: string, arrangementData: Partial<Arrangement>): Promise<Arrangement> {
    try {
      clearArrangementCache() // Clear cache after mutation
      
      // Map application Arrangement type to Supabase update type
      const updateData: Partial<Database['public']['Tables']['arrangements']['Update']> = {}
      
      if (arrangementData.name !== undefined) updateData.name = arrangementData.name
      if (arrangementData.chordData !== undefined) updateData.chord_data = arrangementData.chordData
      if (arrangementData.key !== undefined) updateData.key = arrangementData.key
      if (arrangementData.tempo !== undefined) updateData.tempo = arrangementData.tempo
      if (arrangementData.timeSignature !== undefined) updateData.time_signature = arrangementData.timeSignature
      if (arrangementData.difficulty !== undefined) updateData.difficulty = arrangementData.difficulty
      if (arrangementData.description !== undefined) updateData.description = arrangementData.description
      if (arrangementData.tags !== undefined) updateData.tags = arrangementData.tags
      
      // If name is being updated, regenerate slug
      if (arrangementData.name !== undefined) {
        const currentResult = await createQueryBuilder(supabase, 'arrangements')
          .select('slug, songs!arrangements_song_id_fkey (title)')
          .eq('id', id)
          .single()
          .execute()

        if (currentResult.error) {
          throw new APIError(currentResult.error.message, 500, 'QUERY_ERROR')
        }

        if (!currentResult.data) {
          throw new NotFoundError(`Arrangement with id ${id}`)
        }

        const currentData = currentResult.data
        const existingSlugs = await getExistingArrangementSlugs()
        // Remove current slug from check list
        const filteredSlugs = existingSlugs.filter(slug => slug !== (currentData as UnknownObject).slug)
        
        const songTitle = Array.isArray((currentData as UnknownObject).songs) 
          ? ((currentData as UnknownObject).songs as UnknownObject[])[0]?.title 
          : ((currentData as UnknownObject).songs as { title: string })?.title
        
        const newSlug = await generateArrangementSlug(
          arrangementData.name,
          String(songTitle || ''),
          filteredSlugs
        )
        
        updateData.slug = newSlug
      }

      // Use QueryBuilder for update
      const result = await createQueryBuilder(supabase, 'arrangements')
        .update(updateData)
        .eq('id', id)
        .select('*, songs!arrangements_song_id_fkey (title)')
        .single()
        .execute()
      
      if (result.error) {
        if (result.error.code === 'NOT_FOUND') {
          throw new NotFoundError(`Arrangement with id ${id}`)
        }
        if (result.error.code === '23505') {
          throw new APIError('An arrangement with this slug already exists', 400, 'DUPLICATE_SLUG')
        }
        throw new APIError(result.error.message, 400, 'QUERY_ERROR')
      }
      
      if (!result.data) {
        throw new NotFoundError(`Arrangement with id ${id}`)
      }
      
      return mapSupabaseArrangementToArrangement(result.data as SupabaseArrangement)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new NetworkError('Failed to update arrangement')
    }
  },

  async deleteArrangement(id: string): Promise<void> {
    try {
      clearArrangementCache() // Clear cache after mutation
      
      const result = await createQueryBuilder(supabase, 'arrangements')
        .delete()
        .eq('id', id)
        .execute()
      
      if (result.error) {
        throw new APIError(result.error.message, 400, 'QUERY_ERROR')
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new NetworkError('Failed to delete arrangement')
    }
  },

  // Utility functions
  async getArrangementTitlePreview(arrangementName: string, songId: string): Promise<string> {
    try {
      const result = await createQueryBuilder(supabase, 'songs')
        .select('title')
        .eq('id', songId)
        .single()
        .execute()
      
      if (result.error || !result.data) {
        return `${arrangementName} - Unknown Song`
      }
      
      return `${(result.data as { title: string }).title} - ${arrangementName}`
    } catch (_error) {
      return `${arrangementName} - Unknown Song`
    }
  },

  // Cache management
  clearCache: clearArrangementCache,
  
  // Export mapping function for external use
  mapSupabaseArrangementToArrangement
}