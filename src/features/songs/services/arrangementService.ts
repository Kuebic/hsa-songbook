import type { Arrangement } from '../types/song.types'
import type { ArrangementFormData } from '../validation/schemas/arrangementSchema'

// Use existing error classes from songService
export { APIError, NetworkError, NotFoundError } from './songService'

// API service for arrangements
const API_BASE = '/api/v1'

// Simple cache for deduplicating requests
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const arrangementCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds
const pendingArrangementRequests = new Map<string, Promise<unknown>>()

// Helper function for API calls with retry logic and caching
async function fetchArrangementAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  // Create cache key from endpoint and method
  const method = options.method || 'GET'
  const cacheKey = `${method}:${endpoint}`
  
  // Check cache for GET requests
  if (method === 'GET') {
    const cached = arrangementCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T
    }
    
    // Check if request is already pending
    const pending = pendingArrangementRequests.get(cacheKey)
    if (pending) {
      return pending as Promise<T>
    }
  }
  
  // Create the request promise
  const requestPromise = (async () => {
    let lastError: Error | undefined
    let response: Response | undefined
    
    for (let i = 0; i < retries; i++) {
      try {
        response = await fetch(`${API_BASE}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Network error' }))
          console.error('🚨 Server Error Response:', error)
          console.error('🚨 Response status:', response.status)
          console.error('🚨 Response headers:', Object.fromEntries(response.headers.entries()))
          throw new Error(error.message || error.errors?.[0]?.message || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const result = data.success ? (data.data || data) : data
        
        // Cache successful GET requests
        if (method === 'GET') {
          arrangementCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          })
        }
        
        return result
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on 4xx errors (client errors)
        if (response && response.status >= 400 && response.status < 500) {
          throw error
        }
        
        // Network error - retry with exponential backoff
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
      }
    }
    
    throw lastError || new Error('Network request failed')
  })()
  
  // Store pending request for deduplication
  if (method === 'GET') {
    pendingArrangementRequests.set(cacheKey, requestPromise)
    
    // Clean up pending request when done
    requestPromise.finally(() => {
      pendingArrangementRequests.delete(cacheKey)
    })
  }
  
  return requestPromise
}

// Function to clear the cache (useful for mutations)
function clearArrangementCache() {
  arrangementCache.clear()
  pendingArrangementRequests.clear()
}

export const arrangementService = {
  async getAllArrangements(filter?: {
    songId?: string
    key?: string
    difficulty?: string
    page?: number
    limit?: number
  }): Promise<{ arrangements: Arrangement[], total: number, page: number, pages: number }> {
    const params = new URLSearchParams()
    
    if (filter) {
      if (filter.songId) params.append('songId', filter.songId)
      if (filter.key) params.append('key', filter.key)
      if (filter.difficulty) params.append('difficulty', filter.difficulty)
      if (filter.page) params.append('page', filter.page.toString())
      if (filter.limit) params.append('limit', filter.limit.toString())
    }

    const queryString = params.toString()
    const endpoint = `/arrangements${queryString ? `?${queryString}` : ''}`
    
    const data = await fetchArrangementAPI<{
      arrangements?: Arrangement[]
      data?: Arrangement[]
      total?: number
      pagination?: {
        total: number
        page: number
        pages: number
      }
    }>(endpoint)
    
    // Handle different response structures
    const arrangements = data.arrangements || data.data || []
    const pagination = data.pagination || { total: arrangements.length, page: 1, pages: 1 }
    
    return {
      arrangements,
      total: data.total || pagination.total,
      page: pagination.page,
      pages: pagination.pages
    }
  },

  async getArrangementById(id: string, includeChordData = true): Promise<Arrangement> {
    const params = new URLSearchParams()
    if (!includeChordData) params.append('includeChordData', 'false')
    
    const queryString = params.toString()
    const endpoint = `/arrangements/${id}${queryString ? `?${queryString}` : ''}`
    
    return fetchArrangementAPI<Arrangement>(endpoint)
  },

  async getArrangementBySlug(slug: string, includeChordData = true): Promise<Arrangement> {
    const params = new URLSearchParams()
    if (!includeChordData) params.append('includeChordData', 'false')
    
    const queryString = params.toString()
    const endpoint = `/arrangements/slug/${slug}${queryString ? `?${queryString}` : ''}`
    
    return fetchArrangementAPI<Arrangement>(endpoint)
  },

  async getArrangementsBySong(songId: string): Promise<Arrangement[]> {
    const data = await fetchArrangementAPI<Arrangement[]>(`/arrangements/song/${songId}`)
    return Array.isArray(data) ? data : []
  },

  async createArrangement(
    arrangementData: ArrangementFormData,
    token: string,
    userId: string
  ): Promise<Arrangement> {
    console.log('🔍 Creating arrangement with data:', arrangementData)
    console.log('🔍 Arrangement data JSON:', JSON.stringify(arrangementData, null, 2))
    console.log('🔍 Data being sent to server:', {
      url: '/api/v1/arrangements',
      headers: {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      },
      bodySize: JSON.stringify(arrangementData).length
    })
    
    clearArrangementCache()
    return fetchArrangementAPI<Arrangement>('/arrangements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify(arrangementData)
    })
  },

  async updateArrangement(
    id: string,
    arrangementData: Partial<ArrangementFormData>,
    token: string,
    userId: string
  ): Promise<Arrangement> {
    clearArrangementCache()
    return fetchArrangementAPI<Arrangement>(`/arrangements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify(arrangementData)
    })
  },

  async deleteArrangement(id: string, token: string, userId: string): Promise<void> {
    clearArrangementCache()
    await fetchArrangementAPI<void>(`/arrangements/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    })
  },

  async rateArrangement(id: string, rating: number, token: string, userId: string): Promise<Arrangement> {
    clearArrangementCache()
    return fetchArrangementAPI<Arrangement>(`/arrangements/${id}/rate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify({ rating })
    })
  }
}