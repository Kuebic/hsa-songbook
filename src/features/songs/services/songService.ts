import { supabase } from '../../../lib/supabase'
import type { Song, Arrangement, SongFilter } from '../types/song.types'
import type { Database } from '../../../lib/database.types'
import type { MultilingualText, LanguageCode, LyricsSource } from '../../multilingual/types/multilingual.types'
import { isValidLanguageCode, DEFAULT_LANGUAGE } from '../../multilingual/types/multilingual.types'
import { extractRoleClaims } from '../../auth/utils/jwt'

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
function mapSupabaseArrangementToArrangement(supabaseArrangement: SupabaseArrangement): Arrangement {
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
      views: 0
    },
    createdAt: supabaseArrangement.created_at,
    updatedAt: supabaseArrangement.updated_at
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

export const songService = {
  async getAllSongs(filter?: SongFilter): Promise<Song[]> {
    try {
      // Check user permissions
      const { canModerate, userId } = await checkUserPermissions()
      
      // Check cache first
      const cacheKey = `getAllSongs:${JSON.stringify(filter || {})}:${canModerate}:${userId}`
      const cachedResult = getCachedResult<Song[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      let query = supabase
        .from('songs')
        .select(`
          *,
          arrangements!arrangements_song_id_fkey (*)
        `)
      
      // Apply visibility filters
      if (!canModerate && userId) {
        // Regular users with authentication: show public content AND their own content
        query = query.or(`and(is_public.neq.false,moderation_status.neq.rejected),created_by.eq.${userId}`)
      } else if (!canModerate) {
        // Unauthenticated users: show only public approved content
        query = query.and('is_public.neq.false', 'moderation_status.neq.rejected')
      }
      // Moderators/admins see everything
      
      query = query.order('title')

      // Apply filters
      if (filter) {
        if (filter.searchQuery) {
          // Use PostgreSQL full-text search
          query = query.textSearch('title,artist', filter.searchQuery, {
            type: 'websearch',
            config: 'english'
          })
        }

        if (filter.themes && filter.themes.length > 0) {
          query = query.overlaps('themes', filter.themes)
        }

        if (filter.key) {
          // For key filtering, we need to join with arrangements
          query = query.eq('arrangements.key', filter.key)
        }

        if (filter.difficulty) {
          query = query.eq('arrangements.difficulty', filter.difficulty)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error in getAllSongs:', error)
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const songs = (data || []).map(mapSupabaseSongToSong)
      
      // Cache the result
      setCachedResult(cacheKey, songs)
      
      return songs
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch songs')
    }
  },

  async getSongById(id: string): Promise<Song> {
    try {
      // Check user permissions
      const { canModerate, userId } = await checkUserPermissions()
      
      // Check cache first
      const cacheKey = `getSongById:${id}:${canModerate}:${userId}`
      const cachedResult = getCachedResult<Song>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          arrangements!arrangements_song_id_fkey (*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Song with id ${id}`)
        }
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      // Check visibility permissions
      if (!data) {
        throw new NotFoundError(`Song with id ${id}`)
      }
      if (!canModerate && data.moderation_status === 'rejected' && data.created_by !== userId) {
        throw new NotFoundError(`Song with id ${id}`)
      }
      if (!canModerate && data.is_public === false && data.created_by !== userId) {
        throw new NotFoundError(`Song with id ${id}`)
      }

      const song = mapSupabaseSongToSong(data)
      
      // Cache the result
      setCachedResult(cacheKey, song)
      
      return song
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch song')
    }
  },

  async getSongBySlug(slug: string): Promise<Song> {
    try {
      // Check user permissions
      const { canModerate, userId } = await checkUserPermissions()
      
      // Check cache first
      const cacheKey = `getSongBySlug:${slug}:${canModerate}:${userId}`
      const cachedResult = getCachedResult<Song>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('songs')
        .select(`
          *,
          arrangements!arrangements_song_id_fkey (*)
        `)
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Song with slug ${slug}`)
        }
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      // Check visibility permissions
      if (!data) {
        throw new NotFoundError(`Song with slug ${slug}`)
      }
      if (!canModerate && data.moderation_status === 'rejected' && data.created_by !== userId) {
        throw new NotFoundError(`Song with slug ${slug}`)
      }
      if (!canModerate && data.is_public === false && data.created_by !== userId) {
        throw new NotFoundError(`Song with slug ${slug}`)
      }

      const song = mapSupabaseSongToSong(data)
      
      // Cache the result
      setCachedResult(cacheKey, song)
      
      return song
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch song')
    }
  },

  async searchSongs(filter: SongFilter): Promise<Song[]> {
    return this.getAllSongs(filter)
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
        .select('*')
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

  async createSong(songData: Partial<Song>): Promise<Song> {
    try {
      clearCache() // Clear cache after mutation

      // Get current user ID (Supabase handles this automatically via RLS)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
      }

      // Map application Song type to Supabase insert type
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

      const { data, error } = await supabase
        .from('songs')
        .insert(insertData)
        .select(`
          *,
          arrangements!arrangements_song_id_fkey (*)
        `)
        .single()

      if (error) {
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      return mapSupabaseSongToSong(data)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to create song')
    }
  },

  async updateSong(id: string, songData: Partial<Song>): Promise<Song> {
    try {
      clearCache() // Clear cache after mutation

      // Map application Song type to Supabase update type
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

      const { data, error } = await supabase
        .from('songs')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          arrangements!arrangements_song_id_fkey (*)
        `)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Song with id ${id}`)
        }
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      return mapSupabaseSongToSong(data)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to update song')
    }
  },

  async deleteSong(id: string): Promise<void> {
    try {
      clearCache() // Clear cache after mutation

      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id)

      if (error) {
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to delete song')
    }
  },

}