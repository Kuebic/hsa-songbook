import type { 
  Review, 
  ReviewFormData, 
  ReviewStats, 
  ReviewFilter, 
  ReviewResponse 
} from '../types/review.types'

// Use existing error classes from songService
export { APIError, NetworkError, NotFoundError } from './songService'

// API service for reviews
const API_BASE = '/api/v1'

// Simple cache for deduplicating requests
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const reviewCache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 30000 // 30 seconds
const pendingReviewRequests = new Map<string, Promise<unknown>>()

// Helper function for API calls with retry logic and caching
async function fetchReviewAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  // Create cache key from endpoint and method
  const method = options.method || 'GET'
  const cacheKey = `${method}:${endpoint}`
  
  // Check cache for GET requests
  if (method === 'GET') {
    const cached = reviewCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T
    }
    
    // Check if request is already pending
    const pending = pendingReviewRequests.get(cacheKey)
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
          throw new Error(error.message || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const result = data.success ? (data.data || data) : data
        
        // Cache successful GET requests
        if (method === 'GET') {
          reviewCache.set(cacheKey, {
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
    pendingReviewRequests.set(cacheKey, requestPromise)
    
    // Clean up pending request when done
    requestPromise.finally(() => {
      pendingReviewRequests.delete(cacheKey)
    })
  }
  
  return requestPromise
}

// Function to clear the cache (useful for mutations)
function clearReviewCache() {
  reviewCache.clear()
  pendingReviewRequests.clear()
}

export const reviewService = {
  async createReview(
    songId: string, 
    reviewData: ReviewFormData, 
    token: string,
    userId: string,
    userName?: string,
    arrangementId?: string
  ): Promise<Review> {
    clearReviewCache()
    return fetchReviewAPI<Review>(`/reviews/songs/${songId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        ...(userName && { 'x-user-name': userName })
      },
      body: JSON.stringify({
        rating: reviewData.rating,
        comment: reviewData.comment,
        arrangementId
      })
    })
  },

  async getReviews(songId: string, filter?: ReviewFilter): Promise<ReviewResponse> {
    const params = new URLSearchParams()
    
    if (filter) {
      if (filter.arrangementId) params.append('arrangementId', filter.arrangementId)
      if (filter.page) params.append('page', filter.page.toString())
      if (filter.limit) params.append('limit', filter.limit.toString())
      if (filter.sortBy) params.append('sortBy', filter.sortBy)
      if (filter.sortOrder) params.append('sortOrder', filter.sortOrder)
      if (filter.rating) params.append('rating', filter.rating.toString())
    }

    const queryString = params.toString()
    const endpoint = `/reviews/songs/${songId}${queryString ? `?${queryString}` : ''}`
    
    const data = await fetchReviewAPI<{
      reviews?: Review[]
      data?: Review[]
      meta?: {
        total: number
        page: number
        pages: number
      }
    }>(endpoint)
    
    // Handle different response structures
    const reviews = data.reviews || data.data || []
    const meta = data.meta || { total: reviews.length, page: 1, pages: 1 }
    
    return {
      reviews,
      total: meta.total,
      page: meta.page,
      pages: meta.pages
    }
  },

  async getUserReview(
    songId: string, 
    token: string,
    userId: string,
    arrangementId?: string
  ): Promise<Review | null> {
    const params = new URLSearchParams()
    if (arrangementId) params.append('arrangementId', arrangementId)
    
    const queryString = params.toString()
    const endpoint = `/reviews/songs/${songId}/user${queryString ? `?${queryString}` : ''}`
    
    try {
      const review = await fetchReviewAPI<Review>(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      })
      return review
    } catch (error) {
      // Return null if no review found (404)
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  },

  async updateReview(
    reviewId: string,
    reviewData: ReviewFormData,
    token: string,
    userId: string
  ): Promise<Review> {
    clearReviewCache()
    return fetchReviewAPI<Review>(`/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      },
      body: JSON.stringify({
        rating: reviewData.rating,
        comment: reviewData.comment
      })
    })
  },

  async deleteReview(reviewId: string, token: string, userId: string): Promise<void> {
    clearReviewCache()
    await fetchReviewAPI<void>(`/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    })
  },

  async markHelpful(reviewId: string, helpful: boolean): Promise<Review> {
    clearReviewCache()
    return fetchReviewAPI<Review>(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful })
    })
  },

  async getReviewStats(songId: string): Promise<ReviewStats> {
    return fetchReviewAPI<ReviewStats>(`/reviews/songs/${songId}/stats`)
  },

  async getUserReviews(
    userId: string,
    token: string,
    filter?: Omit<ReviewFilter, 'songId'>
  ): Promise<ReviewResponse> {
    const params = new URLSearchParams()
    
    if (filter) {
      if (filter.page) params.append('page', filter.page.toString())
      if (filter.limit) params.append('limit', filter.limit.toString())
      if (filter.sortBy) params.append('sortBy', filter.sortBy)
      if (filter.sortOrder) params.append('sortOrder', filter.sortOrder)
    }

    const queryString = params.toString()
    const endpoint = `/reviews/users/${userId}${queryString ? `?${queryString}` : ''}`
    
    const data = await fetchReviewAPI<{
      reviews?: Review[]
      data?: Review[]
      meta?: {
        total: number
        page: number
        pages: number
      }
    }>(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      }
    })
    
    const reviews = data.reviews || data.data || []
    const meta = data.meta || { total: reviews.length, page: 1, pages: 1 }
    
    return {
      reviews,
      total: meta.total,
      page: meta.page,
      pages: meta.pages
    }
  },

  // Admin methods
  async getFlaggedReviews(token: string, userId: string): Promise<Review[]> {
    return fetchReviewAPI<Review[]>('/reviews/admin/flagged', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'x-user-role': 'ADMIN'
      }
    })
  },

  async deleteReviewAsAdmin(
    reviewId: string, 
    token: string, 
    userId: string
  ): Promise<void> {
    clearReviewCache()
    await fetchReviewAPI<void>(`/reviews/admin/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId,
        'x-user-role': 'ADMIN'
      }
    })
  }
}