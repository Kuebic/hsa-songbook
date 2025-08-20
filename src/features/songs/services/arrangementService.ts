import { supabase } from '../../../lib/supabase'
import type { Arrangement } from '../types/song.types'
import type { ArrangementFormData } from '../validation/schemas/arrangementSchema'
import type { Database } from '../../../lib/database.types'

// Use existing error classes from songService
export { APIError, NetworkError, NotFoundError } from './songService'

// Type mapping from Supabase to application types
type SupabaseArrangement = Database['public']['Tables']['arrangements']['Row']

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

// Simple cache for deduplicating requests
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const arrangementCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds

// Helper function to handle caching
function getCachedArrangementResult<T>(cacheKey: string): T | null {
  const cached = arrangementCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCachedArrangementResult<T>(cacheKey: string, data: T): void {
  arrangementCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  })
}

// Function to clear the cache (useful for mutations)
function clearArrangementCache() {
  arrangementCache.clear()
}

export const arrangementService = {
  async getAllArrangements(filter?: {
    songId?: string
    key?: string
    difficulty?: string
    page?: number
    limit?: number
  }): Promise<{ arrangements: Arrangement[], total: number, page: number, pages: number }> {
    try {
      // Check cache first
      const cacheKey = `getAllArrangements:${JSON.stringify(filter || {})}`
      const cachedResult = getCachedArrangementResult<{ arrangements: Arrangement[], total: number, page: number, pages: number }>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      let query = supabase
        .from('arrangements')
        .select('*', { count: 'exact' })
        .eq('is_public', true)
        .order('name')

      // Apply filters
      if (filter) {
        if (filter.songId) {
          query = query.eq('song_id', filter.songId)
        }
        if (filter.key) {
          query = query.eq('key', filter.key)
        }
        if (filter.difficulty) {
          query = query.eq('difficulty', filter.difficulty)
        }

        // Handle pagination
        const page = filter.page || 1
        const limit = filter.limit || 20
        const offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Supabase error in getAllArrangements:', error)
        throw new Error(error.message)
      }

      const arrangements = (data || []).map(mapSupabaseArrangementToArrangement)
      const total = count || 0
      const page = filter?.page || 1
      const limit = filter?.limit || 20
      const pages = Math.ceil(total / limit)

      const result = { arrangements, total, page, pages }
      
      // Cache the result
      setCachedArrangementResult(cacheKey, result)
      
      return result
    } catch (error) {
      console.error('Error in getAllArrangements:', error)
      throw new Error('Failed to fetch arrangements')
    }
  },

  async getArrangementById(id: string, includeChordData = true): Promise<Arrangement> {
    try {
      // Check cache first
      const cacheKey = `getArrangementById:${id}:${includeChordData}`
      const cachedResult = getCachedArrangementResult<Arrangement>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('arrangements')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`Arrangement with id ${id} not found`)
        }
        throw new Error(error.message)
      }

      const arrangement = mapSupabaseArrangementToArrangement(data)
      
      // Cache the result
      setCachedArrangementResult(cacheKey, arrangement)
      
      return arrangement
    } catch (error) {
      console.error('Error in getArrangementById:', error)
      throw new Error('Failed to fetch arrangement')
    }
  },

  async getArrangementBySlug(slug: string, includeChordData = true): Promise<Arrangement> {
    try {
      // Check cache first
      const cacheKey = `getArrangementBySlug:${slug}:${includeChordData}`
      const cachedResult = getCachedArrangementResult<Arrangement>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('arrangements')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`Arrangement with slug ${slug} not found`)
        }
        throw new Error(error.message)
      }

      const arrangement = mapSupabaseArrangementToArrangement(data)
      
      // Cache the result
      setCachedArrangementResult(cacheKey, arrangement)
      
      return arrangement
    } catch (error) {
      console.error('Error in getArrangementBySlug:', error)
      throw new Error('Failed to fetch arrangement')
    }
  },

  async getArrangementsBySong(songId: string): Promise<Arrangement[]> {
    try {
      // Check cache first
      const cacheKey = `getArrangementsBySong:${songId}`
      const cachedResult = getCachedArrangementResult<Arrangement[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const { data, error } = await supabase
        .from('arrangements')
        .select('*')
        .eq('song_id', songId)
        .order('name')

      if (error) {
        throw new Error(error.message)
      }

      const arrangements = (data || []).map(mapSupabaseArrangementToArrangement)
      
      // Cache the result
      setCachedArrangementResult(cacheKey, arrangements)
      
      return arrangements
    } catch (error) {
      console.error('Error in getArrangementsBySong:', error)
      throw new Error('Failed to fetch arrangements for song')
    }
  },

  async createArrangement(
    arrangementData: ArrangementFormData
  ): Promise<Arrangement> {
    try {
      clearArrangementCache()

      // Get current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      // Map ArrangementFormData to Supabase insert type
      const insertData = {
        name: arrangementData.name,
        song_id: arrangementData.songIds?.[0] || '', // Take first song ID
        slug: arrangementData.slug || '',
        chord_data: arrangementData.chordData || arrangementData.chordProText || '',
        key: arrangementData.key || null,
        tempo: arrangementData.tempo || null,
        time_signature: arrangementData.timeSignature || '4/4',
        difficulty: arrangementData.difficulty || null,
        description: arrangementData.description || null,
        tags: arrangementData.tags || [],
        created_by: user.id
      }

      console.log('🔍 Creating arrangement with Supabase data:', insertData)

      const { data, error } = await supabase
        .from('arrangements')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('🚨 Supabase error creating arrangement:', error)
        throw new Error(error.message)
      }

      return mapSupabaseArrangementToArrangement(data)
    } catch (error) {
      console.error('Error in createArrangement:', error)
      throw new Error('Failed to create arrangement')
    }
  },

  async updateArrangement(
    id: string,
    arrangementData: Partial<ArrangementFormData>
  ): Promise<Arrangement> {
    try {
      clearArrangementCache()

      // Map ArrangementFormData to Supabase update type
      const updateData: Partial<Database['public']['Tables']['arrangements']['Update']> = {}
      
      if (arrangementData.name !== undefined) updateData.name = arrangementData.name
      if (arrangementData.slug !== undefined) updateData.slug = arrangementData.slug
      if (arrangementData.chordData !== undefined) updateData.chord_data = arrangementData.chordData
      if (arrangementData.chordProText !== undefined) updateData.chord_data = arrangementData.chordProText
      if (arrangementData.key !== undefined) updateData.key = arrangementData.key
      if (arrangementData.tempo !== undefined) updateData.tempo = arrangementData.tempo
      if (arrangementData.timeSignature !== undefined) updateData.time_signature = arrangementData.timeSignature
      if (arrangementData.difficulty !== undefined) updateData.difficulty = arrangementData.difficulty
      if (arrangementData.description !== undefined) updateData.description = arrangementData.description
      if (arrangementData.tags !== undefined) updateData.tags = arrangementData.tags

      const { data, error } = await supabase
        .from('arrangements')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`Arrangement with id ${id} not found`)
        }
        throw new Error(error.message)
      }

      return mapSupabaseArrangementToArrangement(data)
    } catch (error) {
      console.error('Error in updateArrangement:', error)
      throw new Error('Failed to update arrangement')
    }
  },

  async deleteArrangement(id: string): Promise<void> {
    try {
      clearArrangementCache()

      const { error } = await supabase
        .from('arrangements')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error in deleteArrangement:', error)
      throw new Error('Failed to delete arrangement')
    }
  },

}