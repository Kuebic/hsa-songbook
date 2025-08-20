import { supabase } from '../../../lib/supabase'
import type { Arrangement } from '../types/song.types'
import type { Database } from '../../../lib/database.types'
import { generateUniqueSlug, type SlugOptions } from '../validation/utils/slugGeneration'

// Re-export error classes from songService for consistency
export { APIError, NetworkError, NotFoundError } from './songService'
import { APIError, NetworkError, NotFoundError } from './songService'

// Type mapping from Supabase to application types
type SupabaseArrangement = Database['public']['Tables']['arrangements']['Row']

// Convert Supabase arrangement to application Arrangement type
export function mapSupabaseArrangementToArrangement(supabaseArrangement: SupabaseArrangement): Arrangement {
  return {
    id: supabaseArrangement.id,
    name: supabaseArrangement.name,
    slug: supabaseArrangement.slug,
    songIds: [supabaseArrangement.song_id], // Note: single song ID in array for compatibility
    key: supabaseArrangement.key || '',
    tempo: supabaseArrangement.tempo || undefined,
    timeSignature: supabaseArrangement.time_signature,
    difficulty: (supabaseArrangement.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
    tags: supabaseArrangement.tags || [],
    chordData: supabaseArrangement.chord_data,
    description: supabaseArrangement.description || undefined,
    createdBy: supabaseArrangement.created_by || '',
    metadata: {
      isPublic: true, // Default for now
      views: 0 // Default for now
    },
    createdAt: supabaseArrangement.created_at,
    updatedAt: supabaseArrangement.updated_at
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
    const { data, error } = await supabase
      .from('arrangements')
      .select('slug')

    if (error) {
      console.warn('Failed to fetch existing arrangement slugs:', error)
      return []
    }

    return (data || []).map(item => item.slug)
  } catch (error) {
    console.warn('Error fetching existing arrangement slugs:', error)
    return []
  }
}

export const arrangementService = {
  async getAllArrangements(): Promise<Arrangement[]> {
    try {
      // Check cache first
      const cacheKey = 'getAllArrangements'
      const cachedResult = getCachedResult<Arrangement[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('arrangements')
        .select(`
          *,
          songs!arrangements_song_id_fkey (title)
        `)
        .order('name')

      if (error) {
        console.error('Supabase error in getAllArrangements:', error)
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const arrangements = (data || []).map(mapSupabaseArrangementToArrangement)
      
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
      // Check cache first
      const cacheKey = `getArrangementById:${id}`
      const cachedResult = getCachedResult<Arrangement>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('arrangements')
        .select(`
          *,
          songs!arrangements_song_id_fkey (title)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Arrangement with id ${id}`)
        }
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const arrangement = mapSupabaseArrangementToArrangement(data)
      
      // Cache the result
      setCachedResult(cacheKey, arrangement)
      
      return arrangement
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch arrangement')
    }
  },

  async getArrangementBySlug(slug: string): Promise<Arrangement> {
    try {
      // Check cache first
      const cacheKey = `getArrangementBySlug:${slug}`
      const cachedResult = getCachedResult<Arrangement>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('arrangements')
        .select(`
          *,
          songs!arrangements_song_id_fkey (title)
        `)
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Arrangement with slug ${slug}`)
        }
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const arrangement = mapSupabaseArrangementToArrangement(data)
      
      // Cache the result
      setCachedResult(cacheKey, arrangement)
      
      return arrangement
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch arrangement')
    }
  },

  async getArrangementsBySongId(songId: string): Promise<Arrangement[]> {
    try {
      // Check cache first
      const cacheKey = `getArrangementsBySongId:${songId}`
      const cachedResult = getCachedResult<Arrangement[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('arrangements')
        .select(`
          *,
          songs!arrangements_song_id_fkey (title)
        `)
        .eq('song_id', songId)
        .order('name')

      if (error) {
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const arrangements = (data || []).map(mapSupabaseArrangementToArrangement)
      
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

  async searchArrangements(params: {
    searchQuery?: string
    songId?: string
    key?: string
    difficulty?: Arrangement['difficulty']
    tags?: string[]
  }): Promise<Arrangement[]> {
    try {
      // Check cache first
      const cacheKey = `searchArrangements:${JSON.stringify(params)}`
      const cachedResult = getCachedResult<Arrangement[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      let query = supabase
        .from('arrangements')
        .select(`
          *,
          songs!arrangements_song_id_fkey (title, artist)
        `)
        .order('name')

      // Apply filters
      if (params.searchQuery) {
        // Search in arrangement name and description
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
        query = query.overlaps('tags', params.tags)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error in searchArrangements:', error)
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const arrangements = (data || []).map(mapSupabaseArrangementToArrangement)
      
      // Cache the result
      setCachedResult(cacheKey, arrangements)
      
      return arrangements
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
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

      // ChordPro data is optional - can be added later in the editor
      // if (!arrangementData.chordData) {
      //   throw new APIError('Chord data is required', 400, 'VALIDATION_ERROR')
      // }

      const songId = arrangementData.songIds[0] // Take first song ID

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

      // Map application Arrangement type to Supabase insert type
      const insertData: Database['public']['Tables']['arrangements']['Insert'] = {
        name: arrangementData.name,
        song_id: songId,
        slug,
        chord_data: arrangementData.chordData || '', // Default to empty string if not provided
        key: arrangementData.key || null,
        tempo: arrangementData.tempo || null,
        time_signature: arrangementData.timeSignature || '4/4',
        difficulty: arrangementData.difficulty || 'beginner',
        description: arrangementData.description || null,
        tags: arrangementData.tags || [],
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('arrangements')
        .insert(insertData)
        .select(`
          *,
          songs!arrangements_song_id_fkey (title)
        `)
        .single()

      if (error) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          throw new APIError('An arrangement with this slug already exists', 400, 'DUPLICATE_SLUG')
        }
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      return mapSupabaseArrangementToArrangement(data)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
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
        const { data: currentData, error: fetchError } = await supabase
          .from('arrangements')
          .select(`
            slug,
            songs!arrangements_song_id_fkey (title)
          `)
          .eq('id', id)
          .single()

        if (fetchError) {
          throw new APIError(fetchError.message, 500, 'SUPABASE_ERROR')
        }

        const existingSlugs = await getExistingArrangementSlugs()
        // Remove current slug from check list
        const filteredSlugs = existingSlugs.filter(slug => slug !== currentData.slug)
        
        const songTitle = Array.isArray(currentData.songs) 
          ? currentData.songs[0]?.title 
          : (currentData.songs as { title: string })?.title
        
        const newSlug = await generateArrangementSlug(
          arrangementData.name,
          songTitle || '',
          filteredSlugs
        )
        
        updateData.slug = newSlug
      }

      const { data, error } = await supabase
        .from('arrangements')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          songs!arrangements_song_id_fkey (title)
        `)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Arrangement with id ${id}`)
        }
        // Handle unique constraint violations
        if (error.code === '23505') {
          throw new APIError('An arrangement with this slug already exists', 400, 'DUPLICATE_SLUG')
        }
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      return mapSupabaseArrangementToArrangement(data)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to update arrangement')
    }
  },

  async deleteArrangement(id: string): Promise<void> {
    try {
      clearArrangementCache() // Clear cache after mutation

      const { error } = await supabase
        .from('arrangements')
        .delete()
        .eq('id', id)

      if (error) {
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to delete arrangement')
    }
  },

  // Utility functions
  async getArrangementTitlePreview(arrangementName: string, songId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('title')
        .eq('id', songId)
        .single()

      if (error || !data) {
        return `${arrangementName} - Unknown Song`
      }

      return `${data.title} - ${arrangementName}`
    } catch (_error) {
      return `${arrangementName} - Unknown Song`
    }
  },

  // Cache management
  clearCache: clearArrangementCache,
  
  // Export mapping function for external use
  mapSupabaseArrangementToArrangement
}