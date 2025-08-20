import { supabase } from '../../../lib/supabase'
import type { Setlist, SetlistArrangement, CreateSetlistRequest, SetlistFilters, Page } from '../types/setlist.types'
import type { Database } from '../../../lib/database.types'

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
type SupabaseSetlist = Database['public']['Tables']['setlists']['Row']
type SupabaseSetlistItem = Database['public']['Tables']['setlist_items']['Row']

// Convert Supabase data to application types
function mapSupabaseSetlistToSetlist(
  supabaseSetlist: SupabaseSetlist,
  setlistItems: (SupabaseSetlistItem & { arrangement?: any })[] = []
): Setlist {
  const arrangements: SetlistArrangement[] = setlistItems
    .sort((a, b) => a.position - b.position)
    .map(item => ({
      id: item.arrangement_id || '',
      arrangementId: item.arrangement_id || '',
      position: item.position,
      notes: item.notes || undefined,
      transposeSteps: item.transpose_steps || 0,
      // Include arrangement data if available
      ...(item.arrangement && {
        name: item.arrangement.name,
        slug: item.arrangement.slug,
        key: item.arrangement.key,
        tempo: item.arrangement.tempo,
        difficulty: item.arrangement.difficulty,
        chordData: item.arrangement.chord_data
      })
    }))

  return {
    id: supabaseSetlist.id,
    name: supabaseSetlist.name,
    description: supabaseSetlist.description || undefined,
    createdBy: supabaseSetlist.created_by || '',
    isPublic: supabaseSetlist.is_public,
    shareId: supabaseSetlist.share_id || undefined,
    arrangements,
    createdAt: supabaseSetlist.created_at,
    updatedAt: supabaseSetlist.updated_at
  }
}

class SetlistService {
  private cache = new Map<string, { data: Setlist; timestamp: number }>()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  async getSetlists(filters?: SetlistFilters): Promise<Page<Setlist>> {
    try {
      let query = supabase
        .from('setlists')
        .select(`
          *,
          setlist_items (
            *,
            arrangements (*)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.userId) {
        query = query.eq('created_by', filters.userId)
      }
      
      if (filters?.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic)
      }
      
      if (filters?.searchQuery) {
        query = query.ilike('name', `%${filters.searchQuery}%`)
      }

      // Handle pagination
      const page = filters?.page || 1
      const size = filters?.size || 20
      const offset = (page - 1) * size
      query = query.range(offset, offset + size - 1)

      const { data, error, count } = await query

      if (error) {
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const setlists = (data || []).map(setlist => 
        mapSupabaseSetlistToSetlist(setlist, setlist.setlist_items || [])
      )

      return {
        items: setlists,
        total: count || 0,
        page,
        size,
        totalPages: Math.ceil((count || 0) / size)
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch setlists')
    }
  }

  async getSetlist(id: string, token?: string): Promise<Setlist> {
    try {
      // Check cache first
      const cached = this.cache.get(id)
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data
      }

      const { data, error } = await supabase
        .from('setlists')
        .select(`
          *,
          setlist_items (
            *,
            arrangements (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Setlist with id ${id}`)
        }
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      const setlist = mapSupabaseSetlistToSetlist(data, data.setlist_items || [])
      
      // Cache the result
      this.cache.set(id, { data: setlist, timestamp: Date.now() })
      
      return setlist
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch setlist')
    }
  }

  async getPublicSetlist(shareId: string): Promise<Setlist> {
    try {
      const { data, error } = await supabase
        .from('setlists')
        .select(`
          *,
          setlist_items (
            *,
            arrangements (*)
          )
        `)
        .eq('share_id', shareId)
        .eq('is_public', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Public setlist with share ID ${shareId}`)
        }
        throw new APIError(error.message, 500, 'SUPABASE_ERROR')
      }

      return mapSupabaseSetlistToSetlist(data, data.setlist_items || [])
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to fetch public setlist')
    }
  }

  async createSetlist(data: CreateSetlistRequest, token: string): Promise<Setlist> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
      }

      const insertData = {
        name: data.name,
        description: data.description || null,
        created_by: user.id,
        is_public: data.isPublic || false
      }

      const { data: setlistData, error } = await supabase
        .from('setlists')
        .insert(insertData)
        .select(`
          *,
          setlist_items (
            *,
            arrangements (*)
          )
        `)
        .single()

      if (error) {
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      // Invalidate cache
      this.cache.clear()
      
      return mapSupabaseSetlistToSetlist(setlistData, setlistData.setlist_items || [])
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to create setlist')
    }
  }

  async updateSetlist(id: string, data: Partial<Setlist>, token: string): Promise<Setlist> {
    try {
      const updateData: Partial<Database['public']['Tables']['setlists']['Update']> = {}
      
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.isPublic !== undefined) updateData.is_public = data.isPublic

      const { data: setlistData, error } = await supabase
        .from('setlists')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          setlist_items (
            *,
            arrangements (*)
          )
        `)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError(`Setlist with id ${id}`)
        }
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      const setlist = mapSupabaseSetlistToSetlist(setlistData, setlistData.setlist_items || [])
      
      // Update cache
      this.cache.set(id, { data: setlist, timestamp: Date.now() })
      
      return setlist
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to update setlist')
    }
  }

  async reorderArrangements(
    setlistId: string, 
    arrangements: SetlistArrangement[], 
    token: string
  ): Promise<Setlist> {
    try {
      // Clear existing setlist items and recreate with new positions
      const { error: deleteError } = await supabase
        .from('setlist_items')
        .delete()
        .eq('setlist_id', setlistId)

      if (deleteError) {
        throw new APIError(deleteError.message, 400, 'SUPABASE_ERROR')
      }

      // Insert reordered items
      if (arrangements.length > 0) {
        const setlistItems = arrangements.map((arr, index) => ({
          setlist_id: setlistId,
          arrangement_id: arr.arrangementId,
          position: index,
          notes: arr.notes || null,
          transpose_steps: arr.transposeSteps || 0
        }))

        const { error: insertError } = await supabase
          .from('setlist_items')
          .insert(setlistItems)

        if (insertError) {
          throw new APIError(insertError.message, 400, 'SUPABASE_ERROR')
        }
      }

      // Return updated setlist
      return this.getSetlist(setlistId, token)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to reorder arrangements')
    }
  }

  async addArrangement(
    setlistId: string,
    arrangementId: string,
    options: Partial<SetlistArrangement>,
    token: string
  ): Promise<Setlist> {
    try {
      // Get next position
      const { data: existingItems } = await supabase
        .from('setlist_items')
        .select('position')
        .eq('setlist_id', setlistId)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = (existingItems?.[0]?.position || -1) + 1

      const { error } = await supabase
        .from('setlist_items')
        .insert({
          setlist_id: setlistId,
          arrangement_id: arrangementId,
          position: options.position ?? nextPosition,
          notes: options.notes || null,
          transpose_steps: options.transposeSteps || 0
        })

      if (error) {
        throw new APIError(error.message, 400, 'SUPABASE_ERROR')
      }

      // Return updated setlist
      return this.getSetlist(setlistId, token)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to add arrangement to setlist')
    }
  }

  async likeSetlist(id: string, token: string): Promise<{ likes: number; liked: boolean }> {
    try {
      // For now, return mock data since likes aren't in the current schema
      // This could be implemented with a separate likes table
      return { likes: 0, liked: false }
    } catch (error) {
      throw new NetworkError('Failed to like setlist')
    }
  }

  async duplicateSetlist(id: string, name: string, token: string): Promise<Setlist> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new APIError('Authentication required', 401, 'UNAUTHORIZED')
      }

      // Get original setlist
      const originalSetlist = await this.getSetlist(id, token)

      // Create new setlist
      const { data: newSetlistData, error: setlistError } = await supabase
        .from('setlists')
        .insert({
          name,
          description: originalSetlist.description || null,
          created_by: user.id,
          is_public: false // Duplicates are private by default
        })
        .select('*')
        .single()

      if (setlistError) {
        throw new APIError(setlistError.message, 400, 'SUPABASE_ERROR')
      }

      // Copy arrangements if any
      if (originalSetlist.arrangements.length > 0) {
        const setlistItems = originalSetlist.arrangements.map(arr => ({
          setlist_id: newSetlistData.id,
          arrangement_id: arr.arrangementId,
          position: arr.position,
          notes: arr.notes || null,
          transpose_steps: arr.transposeSteps || 0
        }))

        const { error: itemsError } = await supabase
          .from('setlist_items')
          .insert(setlistItems)

        if (itemsError) {
          throw new APIError(itemsError.message, 400, 'SUPABASE_ERROR')
        }
      }

      // Return new setlist
      return this.getSetlist(newSetlistData.id, token)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new NetworkError('Failed to duplicate setlist')
    }
  }

  clearCache() {
    this.cache.clear()
  }
}

export const setlistService = new SetlistService()