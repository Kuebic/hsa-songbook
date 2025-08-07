import type { Song, Arrangement, SongFilter } from '../types/song.types'

// Custom error classes for API operations
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

// API service for songs
const API_BASE = '/api/v1'

// Simple cache for deduplicating requests
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const requestCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds
const pendingRequests = new Map<string, Promise<unknown>>()

// Helper function for API calls with retry logic and caching
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  // Create cache key from endpoint and method
  const method = options.method || 'GET'
  const cacheKey = `${method}:${endpoint}`
  
  // Check cache for GET requests
  if (method === 'GET') {
    const cached = requestCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T
    }
    
    // Check if request is already pending
    const pending = pendingRequests.get(cacheKey)
    if (pending) {
      return pending as Promise<T>
    }
  }
  
  // Create the request promise
  const requestPromise = (async () => {
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
      const result = data.success ? (data.data || data.songs || data) : data
      
      // Cache successful GET requests
      if (method === 'GET') {
        requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
      }
      
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
  })()
  
  // Store pending request for deduplication
  if (method === 'GET') {
    pendingRequests.set(cacheKey, requestPromise)
    
    // Clean up pending request when done
    requestPromise.finally(() => {
      pendingRequests.delete(cacheKey)
    })
  }
  
  return requestPromise
}

// Function to clear the cache (useful for mutations)
function clearCache() {
  requestCache.clear()
  pendingRequests.clear()
}

export const songService = {
  async getAllSongs(filter?: SongFilter): Promise<Song[]> {
    const params = new URLSearchParams()
    
    if (filter) {
      if (filter.searchQuery) params.append('searchQuery', filter.searchQuery)
      if (filter.themes) filter.themes.forEach(theme => params.append('themes', theme))
      if (filter.key) params.append('key', filter.key)
      if (filter.difficulty) params.append('difficulty', filter.difficulty)
    }

    const queryString = params.toString()
    const endpoint = `/songs${queryString ? `?${queryString}` : ''}`
    
    const response = await fetchAPI<{ songs: Song[], pagination: Record<string, unknown> }>(endpoint)
    // Handle the response structure - API returns { success: true, songs: [...] }
    return Array.isArray(response) ? response : (response.songs || [])
  },

  async getSongById(id: string): Promise<Song> {
    return fetchAPI<Song>(`/songs/${id}`)
  },

  async getSongBySlug(slug: string): Promise<Song> {
    return fetchAPI<Song>(`/songs/slug/${slug}`)
  },

  async searchSongs(filter: SongFilter): Promise<Song[]> {
    return this.getAllSongs(filter)
  },

  async getArrangementsBySongId(songId: string): Promise<Arrangement[]> {
    const response = await fetchAPI<Arrangement[]>(`/arrangements/song/${songId}`)
    return Array.isArray(response) ? response : []
  },

  async createSong(songData: Partial<Song>, token: string): Promise<Song> {
    clearCache() // Clear cache after mutation
    return fetchAPI<Song>('/songs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(songData)
    })
  },

  async updateSong(id: string, songData: Partial<Song>, token: string, userId?: string): Promise<Song> {
    clearCache() // Clear cache after mutation
    return fetchAPI<Song>(`/songs/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(userId && { 'x-user-id': userId })
      },
      body: JSON.stringify(songData)
    })
  },

  async deleteSong(id: string, token: string): Promise<void> {
    clearCache() // Clear cache after mutation
    await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },

  async rateSong(id: string, rating: number, token: string): Promise<Song> {
    return fetchAPI<Song>(`/songs/${id}/rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rating })
    })
  }
}