/**
 * Setlist service for managing user setlists
 * Built with QueryBuilder pattern from the start
 */

import { supabase } from '../../../lib/supabase'
import { 
  withMigration,
  createQueryBuilder 
} from '../../../lib/database/migrationHelper'
import type { Database } from '../../../lib/database.types'
import type { JsonValue } from '../../../shared/types/common'

// Type definitions
type SupabaseSetlist = Database['public']['Tables']['setlists']['Row']
type SetlistInsert = Database['public']['Tables']['setlists']['Insert']
type SetlistUpdate = Database['public']['Tables']['setlists']['Update']

interface SetlistMetadata {
  song_ids?: string[] | null
  share_token?: string | null
}

export interface Setlist {
  id: string
  name: string
  description?: string
  songIds: string[]
  createdBy: string
  isPublic: boolean
  shareToken?: string
  createdAt: string
  updatedAt: string
}

export interface SetlistFilter {
  userId?: string
  isPublic?: boolean
  searchQuery?: string
}

// Custom error classes
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

// Helper function to map Supabase data to application type
function mapSupabaseSetlistToSetlist(supabaseSetlist: SupabaseSetlist): Setlist {
  const metadata = (supabaseSetlist.metadata as SetlistMetadata) || {}
  return {
    id: supabaseSetlist.id,
    name: supabaseSetlist.name,
    description: supabaseSetlist.description || undefined,
    songIds: metadata.song_ids || [],
    createdBy: supabaseSetlist.created_by || '',
    isPublic: supabaseSetlist.is_public || false,
    shareToken: metadata.share_token || supabaseSetlist.share_id || undefined,
    createdAt: supabaseSetlist.created_at || '',
    updatedAt: supabaseSetlist.updated_at || ''
  }
}

// Cache implementation
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const requestCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds

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

function clearCache() {
  requestCache.clear()
}

// QueryBuilder implementation of getUserSetlists
async function getUserSetlistsWithQueryBuilder(filter?: SetlistFilter): Promise<Setlist[]> {
  try {
    const cacheKey = `getUserSetlists:${JSON.stringify(filter || {})}`
    const cachedResult = getCachedResult<Setlist[]>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    let queryBuilder = createQueryBuilder(supabase, 'setlists')
      .select('*')
      .orderBy('updated_at', { ascending: false })

    // Apply filters
    if (filter) {
      if (filter.userId) {
        queryBuilder = queryBuilder.eq('created_by', filter.userId)
      }
      
      if (filter.isPublic !== undefined) {
        queryBuilder = queryBuilder.eq('is_public', filter.isPublic)
      }
      
      if (filter.searchQuery) {
        queryBuilder = queryBuilder.ilike('name', `%${filter.searchQuery}%`)
      }
    }

    const result = await queryBuilder.execute()

    if (result.error) {
      throw new APIError(result.error.message, result.error.statusCode || 500, result.error.code)
    }

    const setlists = (result.data as SupabaseSetlist[] || []).map(mapSupabaseSetlistToSetlist)
    setCachedResult(cacheKey, setlists)
    return setlists
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to fetch setlists')
  }
}

// Legacy implementation (same as QueryBuilder for new service)
async function getUserSetlistsLegacy(filter?: SetlistFilter): Promise<Setlist[]> {
  return getUserSetlistsWithQueryBuilder(filter)
}

// QueryBuilder implementation of getSetlistById
async function getSetlistByIdWithQueryBuilder(id: string): Promise<Setlist> {
  try {
    const cacheKey = `getSetlistById:${id}`
    const cachedResult = getCachedResult<Setlist>(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    const queryBuilder = createQueryBuilder(supabase, 'setlists')
      .select('*')
      .eq('id', id)
      .single()
    
    const result = await queryBuilder.execute()

    if (result.error) {
      if (result.error.code === 'NOT_FOUND') {
        throw new NotFoundError(`Setlist with id ${id}`)
      }
      throw new APIError(result.error.message, result.error.statusCode || 500, result.error.code)
    }

    if (!result.data) {
      throw new NotFoundError(`Setlist with id ${id}`)
    }

    const setlist = mapSupabaseSetlistToSetlist(result.data as SupabaseSetlist)
    setCachedResult(cacheKey, setlist)
    return setlist
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to fetch setlist')
  }
}

// Legacy implementation
async function getSetlistByIdLegacy(id: string): Promise<Setlist> {
  return getSetlistByIdWithQueryBuilder(id)
}

// QueryBuilder implementation of createSetlist
async function createSetlistWithQueryBuilder(setlistData: Partial<Setlist>): Promise<Setlist> {
  try {
    clearCache()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
    }

    const insertData: SetlistInsert = {
      name: setlistData.name || 'Untitled Setlist',
      description: setlistData.description || null,
      metadata: {
        song_ids: setlistData.songIds || [],
        share_token: setlistData.shareToken || null
      } as SetlistMetadata as JsonValue,
      created_by: user.id,
      is_public: setlistData.isPublic || false,
      share_id: setlistData.shareToken || null
    }

    const queryBuilder = createQueryBuilder(supabase, 'setlists')
      .insert(insertData)
      .select('*')
      .single()
    
    const result = await queryBuilder.execute()

    if (result.error) {
      throw new APIError(result.error.message, 400, result.error.code)
    }

    if (!result.data) {
      throw new APIError('Failed to create setlist', 500, 'CREATE_FAILED')
    }

    return mapSupabaseSetlistToSetlist(result.data as SupabaseSetlist)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to create setlist')
  }
}

// Legacy implementation
async function createSetlistLegacy(setlistData: Partial<Setlist>): Promise<Setlist> {
  return createSetlistWithQueryBuilder(setlistData)
}

// QueryBuilder implementation of updateSetlist
async function updateSetlistWithQueryBuilder(id: string, setlistData: Partial<Setlist>): Promise<Setlist> {
  try {
    clearCache()

    const updateData: Partial<SetlistUpdate> = {}
    
    if (setlistData.name !== undefined) updateData.name = setlistData.name
    if (setlistData.description !== undefined) updateData.description = setlistData.description
    if (setlistData.songIds !== undefined || setlistData.shareToken !== undefined) {
      const currentMetadata: SetlistMetadata = {}
      if (setlistData.songIds !== undefined) currentMetadata.song_ids = setlistData.songIds
      if (setlistData.shareToken !== undefined) currentMetadata.share_token = setlistData.shareToken
      updateData.metadata = currentMetadata as SetlistMetadata as JsonValue
    }
    if (setlistData.isPublic !== undefined) updateData.is_public = setlistData.isPublic
    if (setlistData.shareToken !== undefined) updateData.share_id = setlistData.shareToken

    const queryBuilder = createQueryBuilder(supabase, 'setlists')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
    
    const result = await queryBuilder.execute()

    if (result.error) {
      if (result.error.code === 'NOT_FOUND') {
        throw new NotFoundError(`Setlist with id ${id}`)
      }
      throw new APIError(result.error.message, 400, result.error.code)
    }

    if (!result.data) {
      throw new APIError('Failed to update setlist', 500, 'UPDATE_FAILED')
    }

    return mapSupabaseSetlistToSetlist(result.data as SupabaseSetlist)
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to update setlist')
  }
}

// Legacy implementation
async function updateSetlistLegacy(id: string, setlistData: Partial<Setlist>): Promise<Setlist> {
  return updateSetlistWithQueryBuilder(id, setlistData)
}

// QueryBuilder implementation of deleteSetlist
async function deleteSetlistWithQueryBuilder(id: string): Promise<void> {
  try {
    clearCache()

    const result = await createQueryBuilder(supabase, 'setlists')
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
    throw new NetworkError('Failed to delete setlist')
  }
}

// Legacy implementation
async function deleteSetlistLegacy(id: string): Promise<void> {
  return deleteSetlistWithQueryBuilder(id)
}

// QueryBuilder implementation of addSongToSetlist
async function addSongToSetlistWithQueryBuilder(setlistId: string, songId: string): Promise<Setlist> {
  try {
    clearCache()

    // Get current setlist
    const setlist = await setlistService.getSetlistById(setlistId)
    
    // Add song if not already present
    if (!setlist.songIds.includes(songId)) {
      setlist.songIds.push(songId)
      
      const updateData: Partial<SetlistUpdate> = {
        metadata: { song_ids: setlist.songIds } as SetlistMetadata as JsonValue
      }

      const queryBuilder = createQueryBuilder(supabase, 'setlists')
        .update(updateData)
        .eq('id', setlistId)
        .select('*')
        .single()
      
      const result = await queryBuilder.execute()

      if (result.error) {
        throw new APIError(result.error.message, 400, result.error.code)
      }

      if (!result.data) {
        throw new APIError('Failed to add song to setlist', 500, 'UPDATE_FAILED')
      }

      return mapSupabaseSetlistToSetlist(result.data as SupabaseSetlist)
    }
    
    return setlist
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to add song to setlist')
  }
}

// Legacy implementation
async function addSongToSetlistLegacy(setlistId: string, songId: string): Promise<Setlist> {
  return addSongToSetlistWithQueryBuilder(setlistId, songId)
}

// QueryBuilder implementation of removeSongFromSetlist
async function removeSongFromSetlistWithQueryBuilder(setlistId: string, songId: string): Promise<Setlist> {
  try {
    clearCache()

    // Get current setlist  
    const setlist = await setlistService.getSetlistById(setlistId)
    
    // Remove song if present
    const index = setlist.songIds.indexOf(songId)
    if (index > -1) {
      setlist.songIds.splice(index, 1)
      
      const updateData: Partial<SetlistUpdate> = {
        metadata: { song_ids: setlist.songIds } as SetlistMetadata as JsonValue
      }

      const queryBuilder = createQueryBuilder(supabase, 'setlists')
        .update(updateData)
        .eq('id', setlistId)
        .select('*')
        .single()
      
      const result = await queryBuilder.execute()

      if (result.error) {
        throw new APIError(result.error.message, 400, result.error.code)
      }

      if (!result.data) {
        throw new APIError('Failed to remove song from setlist', 500, 'UPDATE_FAILED')
      }

      return mapSupabaseSetlistToSetlist(result.data as SupabaseSetlist)
    }
    
    return setlist
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new NetworkError('Failed to remove song from setlist')
  }
}

// Legacy implementation
async function removeSongFromSetlistLegacy(setlistId: string, songId: string): Promise<Setlist> {
  return removeSongFromSetlistWithQueryBuilder(setlistId, songId)
}

// Export the service
export const setlistService = {
  async getUserSetlists(filter?: SetlistFilter): Promise<Setlist[]> {
    return withMigration(
      'getUserSetlists',
      () => getUserSetlistsLegacy(filter),
      () => getUserSetlistsWithQueryBuilder(filter)
    )
  },

  async getSetlistById(id: string): Promise<Setlist> {
    return withMigration(
      'getSetlistById',
      () => getSetlistByIdLegacy(id),
      () => getSetlistByIdWithQueryBuilder(id)
    )
  },

  async createSetlist(setlistData: Partial<Setlist>): Promise<Setlist> {
    return withMigration(
      'createSetlist',
      () => createSetlistLegacy(setlistData),
      () => createSetlistWithQueryBuilder(setlistData)
    )
  },

  async updateSetlist(id: string, setlistData: Partial<Setlist>): Promise<Setlist> {
    return withMigration(
      'updateSetlist',
      () => updateSetlistLegacy(id, setlistData),
      () => updateSetlistWithQueryBuilder(id, setlistData)
    )
  },

  async deleteSetlist(id: string): Promise<void> {
    return withMigration(
      'deleteSetlist',
      () => deleteSetlistLegacy(id),
      () => deleteSetlistWithQueryBuilder(id)
    )
  },

  async addSongToSetlist(setlistId: string, songId: string): Promise<Setlist> {
    return withMigration(
      'addSongToSetlist',
      () => addSongToSetlistLegacy(setlistId, songId),
      () => addSongToSetlistWithQueryBuilder(setlistId, songId)
    )
  },

  async removeSongFromSetlist(setlistId: string, songId: string): Promise<Setlist> {
    return withMigration(
      'removeSongFromSetlist',
      () => removeSongFromSetlistLegacy(setlistId, songId),
      () => removeSongFromSetlistWithQueryBuilder(setlistId, songId)
    )
  }
}