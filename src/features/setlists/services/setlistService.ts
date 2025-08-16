import type { Setlist, SetlistArrangement, CreateSetlistRequest, SetlistFilters, Page } from '../types/setlist.types'

// Custom error classes for API operations (copied from existing pattern)
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

// API service for setlists
const API_BASE = '/api/v1'

// Note: CacheEntry interface is available for future use if needed

// Helper function for API calls with retry logic and caching
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }))
        
        if (response.status === 404) {
          throw new NotFoundError(endpoint)
        }
        
        throw new APIError(
          error.message || `HTTP error! status: ${response.status}`,
          response.status,
          error.code
        )
      }

      const data = await response.json()
      const result = data.success ? (data.data || data.setlists || data) : data
      
      return result
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on 4xx errors (client errors)
      if (error instanceof APIError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error
      }
      
      // Network error - retry with exponential backoff
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }
  
  throw lastError || new NetworkError()
}

class SetlistService {
  private cache = new Map<string, { data: Setlist; timestamp: number }>()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  async getSetlists(filters?: SetlistFilters): Promise<Page<Setlist>> {
    const params = new URLSearchParams()
    if (filters?.userId) params.append('userId', filters.userId)
    if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic))
    if (filters?.searchQuery) params.append('searchQuery', filters.searchQuery)
    if (filters?.page !== undefined) params.append('page', String(filters.page))
    if (filters?.size !== undefined) params.append('size', String(filters.size))
    
    return fetchAPI<Page<Setlist>>(`/setlists?${params.toString()}`)
  }

  async getSetlist(id: string, token?: string): Promise<Setlist> {
    // Check cache first
    const cached = this.cache.get(id)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const setlist = await fetchAPI<Setlist>(`/setlists/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    
    // Cache the result
    this.cache.set(id, { data: setlist, timestamp: Date.now() })
    return setlist
  }

  async getPublicSetlist(shareId: string): Promise<Setlist> {
    return fetchAPI<Setlist>(`/setlists/public/${shareId}`)
  }

  async createSetlist(data: CreateSetlistRequest, token: string): Promise<Setlist> {
    const setlist = await fetchAPI<Setlist>(`/setlists`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    // Invalidate list cache
    this.cache.clear()
    return setlist
  }

  async updateSetlist(id: string, data: Partial<Setlist>, token: string): Promise<Setlist> {
    const setlist = await fetchAPI<Setlist>(`/setlists/${id}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    // Update cache
    this.cache.set(id, { data: setlist, timestamp: Date.now() })
    return setlist
  }

  async reorderArrangements(
    setlistId: string, 
    arrangements: SetlistArrangement[], 
    token: string
  ): Promise<Setlist> {
    return this.updateSetlist(setlistId, { arrangements }, token)
  }

  async addArrangement(
    setlistId: string,
    arrangementId: string,
    options: Partial<SetlistArrangement>,
    token: string
  ): Promise<Setlist> {
    return fetchAPI<Setlist>(`/setlists/${setlistId}/arrangements`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ arrangementId, ...options })
    })
  }

  async likeSetlist(id: string, token: string): Promise<{ likes: number; liked: boolean }> {
    return fetchAPI(`/setlists/${id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async duplicateSetlist(id: string, name: string, token: string): Promise<Setlist> {
    return fetchAPI<Setlist>(`/setlists/${id}/duplicate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
  }

  clearCache() {
    this.cache.clear()
  }
}

export const setlistService = new SetlistService()