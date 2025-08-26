import { supabase } from '../../../lib/supabase'
import { nullToUndefined } from '@shared/utils/typeHelpers'
import type { Song, Arrangement, SongFilter } from '../types/song.types'
import type { Database } from '../../../lib/database.types'
import type { MultilingualText, LanguageCode, LyricsSource } from '../../multilingual/types/multilingual.types'
import { isValidLanguageCode, DEFAULT_LANGUAGE } from '../../multilingual/types/multilingual.types'
import { extractRoleClaims } from '../../auth/utils/jwt'
import { 
  buildUserPermissions,
  createQueryBuilder 
} from '../../../lib/database/migrationHelper'

// Custom error classes for API operations (kept for compatibility)
export class APIError extends Error {
  statusCode?: number
  code?: string
  
  constructor(
    message: string,
    statusCode?: number,
    code?: string
  ) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.code = code
  }
}

export class NetworkError extends APIError {
  constructor(message = 'Network request failed') {
    super(message, 0, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

// Type mapping from Supabase to application types
type SupabaseSong = Database['public']['Tables']['songs']['Row']
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

// Helper function to safely parse JSONB lyrics
function parseSupabaseLyrics(lyricsJson: unknown): MultilingualText {
  if (!lyricsJson) return {};
  
  try {
    const parsed = typeof lyricsJson === 'string' ? JSON.parse(lyricsJson) : lyricsJson;
    
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    
    // Filter to only valid language codes
    const validLyrics: MultilingualText = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isValidLanguageCode(key) && typeof value === 'string') {
        validLyrics[key] = value;
      }
    }
    
    return validLyrics;
  } catch (error) {
    console.warn('Failed to parse lyrics JSONB:', error);
    return {};
  }
}

// Convert Supabase song to application Song type
function mapSupabaseSongToSong(supabaseSong: SupabaseSong): Song {
  return {
    id: supabaseSong.id,
    title: supabaseSong.title,
    artist: supabaseSong.artist || '',
    slug: supabaseSong.slug,
    compositionYear: supabaseSong.composition_year || undefined,
    ccli: supabaseSong.ccli || undefined,
    themes: supabaseSong.themes || [],
    source: supabaseSong.source || undefined,
    notes: supabaseSong.notes || undefined,
    defaultArrangementId: supabaseSong.default_arrangement_id || undefined,
    // Multilingual lyrics fields
    lyrics: parseSupabaseLyrics(supabaseSong.lyrics),
    originalLanguage: (supabaseSong.original_language && isValidLanguageCode(supabaseSong.original_language)) 
      ? supabaseSong.original_language as LanguageCode 
      : DEFAULT_LANGUAGE,
    lyricsVerified: supabaseSong.lyrics_verified || false,
    lyricsSource: (supabaseSong.lyrics_source as LyricsSource) || 'user',
    autoConversionEnabled: supabaseSong.auto_conversion_enabled || false,
    metadata: {
      createdBy: supabaseSong.created_by || undefined,
      isPublic: supabaseSong.is_public !== false, // Default to true if null
      ratings: {
        average: Number(supabaseSong.rating_average || 0),
        count: supabaseSong.rating_count || 0
      },
      views: supabaseSong.views || 0,
      moderationStatus: supabaseSong.moderation_status as 'pending' | 'approved' | 'rejected' | 'flagged' | null,
      moderationNote: supabaseSong.moderation_note || undefined
    }
  }
}

// Convert Supabase arrangement to application Arrangement type
function mapSupabaseArrangementToArrangement(supabaseArrangement: SupabaseArrangement & { song_id?: string | { id: string } }): Arrangement {
  // Handle both cases: when song_id is a string (no join) or an object (with join)
  const songId = typeof supabaseArrangement.song_id === 'object' && supabaseArrangement.song_id 
    ? supabaseArrangement.song_id.id 
    : supabaseArrangement.song_id
    
  return {
    id: supabaseArrangement.id,
    name: supabaseArrangement.name,
    slug: supabaseArrangement.slug,
    songIds: songId ? [songId] : [], // Note: single song ID in array for compatibility
    key: supabaseArrangement.key || '',
    tempo: supabaseArrangement.tempo || undefined,
    timeSignature: nullToUndefined(supabaseArrangement.time_signature),
    difficulty: (supabaseArrangement.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
    tags: supabaseArrangement.tags || [],
    chordData: supabaseArrangement.chord_data,
    description: supabaseArrangement.description || undefined,
    createdBy: supabaseArrangement.created_by || '',
    metadata: {
      isPublic: true, // Default for now
      views: 0
    },
    createdAt: nullToUndefined(supabaseArrangement.created_at),
    updatedAt: nullToUndefined(supabaseArrangement.updated_at)
  }
}

// Simple cache for deduplicating requests (keeping for compatibility)
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const requestCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds

// Helper function to handle caching
function getCachedResult<T>(cacheKey: string): T | null {
  const cached = requestCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCachedResult<T>(cacheKey: string, data: T): void {
  requestCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
}

// Function to clear the cache (useful for mutations)
function clearCache() {
  requestCache.clear()
}

// QueryBuilder implementation of getAllSongs
async function getAllSongs(filter?: SongFilter): Promise<Song[]> {
  try {
    // Check user permissions
    const { canModerate, userId } = await checkUserPermissions()
    
    // Check cache first
    const cacheKey = `getAllSongs:${JSON.stringify(filter || {})}:${canModerate}:${userId}`
    const cachedResult = getCachedResult<Song[]>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    // Build permissions object
    const permissions = buildUserPermissions({
      userId,
      canModerate,
      canAdmin: false, // Will be updated when we have admin context
      roles: []
    })

    // Create QueryBuilder instance
    let queryBuilder = createQueryBuilder(supabase, 'songs')
      .select(`*, arrangements!arrangements_song_id_fkey (*)`)
      .withVisibility(permissions)
      .orderBy('title')

    // Apply filters
    if (filter) {
      if (filter.searchQuery) {
        // Use PostgreSQL full-text search
        queryBuilder = queryBuilder.textSearch('title,artist', filter.searchQuery, {
          type: 'websearch',
          config: 'english'
        })
      }

      if (filter.themes && filter.themes.length > 0) {
        queryBuilder = queryBuilder.overlaps('themes', filter.themes)
      }

      if (filter.key) {
        // For key filtering, we need to join with arrangements
        queryBuilder = queryBuilder.eq('arrangements.key', filter.key)
      }

      if (filter.difficulty) {
        queryBuilder = queryBuilder.eq('arrangements.difficulty', filter.difficulty)
      }
    }

    const result = await queryBuilder.execute()

    if (result.error) {
      console.error('QueryBuilder error in getAllSongs:', result.error)
      throw new APIError(result.error.message, result.error.statusCode || 500, result.error.code)
    }

    const songs = (result.data as SupabaseSong[] || []).map(mapSupabaseSongToSong)
    
    // Cache the result
    setCachedResult(cacheKey, songs)
    
    return songs
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to fetch songs')
  }
}


// QueryBuilder implementation of getSongById
async function getSongById(id: string): Promise<Song> {
  try {
    const { canModerate, userId } = await checkUserPermissions()
    
    const cacheKey = `getSongById:${id}:${canModerate}:${userId}`
    const cachedResult = getCachedResult<Song>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    const permissions = buildUserPermissions({
      userId,
      canModerate,
      canAdmin: false,
      roles: []
    })

    const queryBuilder = createQueryBuilder(supabase, 'songs')
      .select(`*, arrangements!arrangements_song_id_fkey (*)`)
      .withVisibility(permissions)
      .eq('id', id)
      .single()
    
    const result = await queryBuilder.execute()

    if (result.error) {
      if (result.error.code === 'NOT_FOUND') {
        throw new NotFoundError(`Song with id ${id}`)
      }
      throw new APIError(result.error.message, result.error.statusCode || 500, result.error.code)
    }

    if (!result.data) {
      throw new NotFoundError(`Song with id ${id}`)
    }
    const song = mapSupabaseSongToSong(result.data as SupabaseSong)
    setCachedResult(cacheKey, song)
    return song
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to fetch song')
  }
}


// QueryBuilder implementation of getSongBySlug
async function getSongBySlug(slug: string): Promise<Song> {
  try {
    const { canModerate, userId } = await checkUserPermissions()
    
    const cacheKey = `getSongBySlug:${slug}:${canModerate}:${userId}`
    const cachedResult = getCachedResult<Song>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    const permissions = buildUserPermissions({
      userId,
      canModerate,
      canAdmin: false,
      roles: []
    })

    const queryBuilder = createQueryBuilder(supabase, 'songs')
      .select(`*, arrangements!arrangements_song_id_fkey (*)`)
      .withVisibility(permissions)
      .eq('slug', slug)
      .single()
    
    const result = await queryBuilder.execute()

    if (result.error) {
      if (result.error.code === 'NOT_FOUND') {
        throw new NotFoundError(`Song with slug ${slug}`)
      }
      throw new APIError(result.error.message, result.error.statusCode || 500, result.error.code)
    }

    if (!result.data) {
      throw new NotFoundError(`Song with slug ${slug}`)
    }
    const song = mapSupabaseSongToSong(result.data as SupabaseSong)
    setCachedResult(cacheKey, song)
    return song
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to fetch song')
  }
}


// QueryBuilder implementation of getArrangementsBySongId
async function getArrangementsBySongId(songId: string): Promise<Arrangement[]> {
  try {
    const cacheKey = `getArrangementsBySongId:${songId}`
    const cachedResult = getCachedResult<Arrangement[]>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    const result = await createQueryBuilder(supabase, 'arrangements')
      .select('*')
      .eq('song_id', songId)
      .orderBy('name')
      .execute()

    if (result.error) {
      throw new APIError(result.error.message, result.error.statusCode || 500, result.error.code)
    }

    const arrangements = (result.data as SupabaseArrangement[] || []).map(mapSupabaseArrangementToArrangement)
    setCachedResult(cacheKey, arrangements)
    return arrangements
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to fetch arrangements')
  }
}


// QueryBuilder implementation of createSong
async function createSong(songData: Partial<Song>): Promise<Song> {
  try {
    clearCache() // Clear cache after mutation

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
    }

    const insertData = {
      title: songData.title || '',
      artist: songData.artist || null,
      slug: songData.slug || '',
      composition_year: songData.compositionYear || null,
      ccli: songData.ccli || null,
      themes: songData.themes || [],
      source: songData.source || null,
      notes: songData.notes || null,
      created_by: user.id,
      is_public: songData.metadata?.isPublic || false,
      // Multilingual fields
      lyrics: songData.lyrics ? JSON.stringify(songData.lyrics) : null,
      original_language: songData.originalLanguage || DEFAULT_LANGUAGE,
      lyrics_verified: songData.lyricsVerified || false,
      lyrics_source: songData.lyricsSource || 'user',
      auto_conversion_enabled: songData.autoConversionEnabled || false
    }

    const queryBuilder = createQueryBuilder(supabase, 'songs')
      .insert(insertData)
      .select(`*, arrangements!arrangements_song_id_fkey (*)`)
      .single()
    
    const result = await queryBuilder.execute()

    if (result.error) {
      throw new APIError(result.error.message, 400, result.error.code)
    }

    if (!result.data) {
      throw new APIError('Failed to create song', 500, 'CREATE_FAILED')
    }
    return mapSupabaseSongToSong(result.data as SupabaseSong)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to create song')
  }
}


// QueryBuilder implementation of updateSong
async function updateSong(id: string, songData: Partial<Song>): Promise<Song> {
  try {
    clearCache() // Clear cache after mutation

    const updateData: Partial<Database['public']['Tables']['songs']['Update']> = {}
    
    if (songData.title !== undefined) updateData.title = songData.title
    if (songData.artist !== undefined) updateData.artist = songData.artist
    if (songData.slug !== undefined) updateData.slug = songData.slug
    if (songData.compositionYear !== undefined) updateData.composition_year = songData.compositionYear
    if (songData.ccli !== undefined) updateData.ccli = songData.ccli
    if (songData.themes !== undefined) updateData.themes = songData.themes
    if (songData.source !== undefined) updateData.source = songData.source
    if (songData.notes !== undefined) updateData.notes = songData.notes
    if (songData.metadata?.isPublic !== undefined) updateData.is_public = songData.metadata.isPublic
    
    // Multilingual fields
    if (songData.lyrics !== undefined) updateData.lyrics = songData.lyrics ? JSON.stringify(songData.lyrics) : null
    if (songData.originalLanguage !== undefined) updateData.original_language = songData.originalLanguage
    if (songData.lyricsVerified !== undefined) updateData.lyrics_verified = songData.lyricsVerified
    if (songData.lyricsSource !== undefined) updateData.lyrics_source = songData.lyricsSource
    if (songData.autoConversionEnabled !== undefined) updateData.auto_conversion_enabled = songData.autoConversionEnabled

    const queryBuilder = createQueryBuilder(supabase, 'songs')
      .update(updateData)
      .eq('id', id)
      .select(`*, arrangements!arrangements_song_id_fkey (*)`)
      .single()
    
    const result = await queryBuilder.execute()

    if (result.error) {
      if (result.error.code === 'NOT_FOUND') {
        throw new NotFoundError(`Song with id ${id}`)
      }
      throw new APIError(result.error.message, 400, result.error.code)
    }

    if (!result.data) {
      throw new APIError('Failed to update song', 500, 'UPDATE_FAILED')
    }
    return mapSupabaseSongToSong(result.data as SupabaseSong)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to update song')
  }
}


// QueryBuilder implementation of deleteSong
async function deleteSong(id: string): Promise<void> {
  try {
    clearCache() // Clear cache after mutation

    const result = await createQueryBuilder(supabase, 'songs')
      .delete()
      .eq('id', id)
      .execute()

    if (result.error) {
      throw new APIError(result.error.message, 400, result.error.code)
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to delete song')
  }
}


export const songService = {
  async getAllSongs(filter?: SongFilter): Promise<Song[]> {
    return getAllSongs(filter)
  },

  async getSongById(id: string): Promise<Song> {
    return getSongById(id)
  },

  async getSongBySlug(slug: string): Promise<Song> {
    return getSongBySlug(slug)
  },

  async searchSongs(filter: SongFilter): Promise<Song[]> {
    return this.getAllSongs(filter)
  },

  async getArrangementsBySongId(songId: string): Promise<Arrangement[]> {
    return getArrangementsBySongId(songId)
  },

  async createSong(songData: Partial<Song>): Promise<Song> {
    return createSong(songData)
  },

  async updateSong(id: string, songData: Partial<Song>): Promise<Song> {
    return updateSong(id, songData)
  },

  async deleteSong(id: string): Promise<void> {
    return deleteSong(id)
  },

}