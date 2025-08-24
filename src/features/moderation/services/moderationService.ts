import { supabase } from '../../../lib/supabase'
import type { ModerationItem, ModerationAction, ContentReport, ModerationFilter, ModerationStats } from '../types/moderation.types'

// Simple cache for deduplicating requests
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
export function clearCache() {
  requestCache.clear()
}

export const moderationService = {
  async getQueue(filter?: ModerationFilter): Promise<ModerationItem[]> {
    try {
      // Check cache first
      const cacheKey = `getModerationQueue:${JSON.stringify(filter || {})}`
      const cachedResult = getCachedResult<ModerationItem[]>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      // Use the database function for efficient querying
      const { data, error } = await supabase
        .rpc('get_moderation_queue', {
          filter_status: filter?.status === 'all' ? undefined : filter?.status,
          filter_type: filter?.contentType === 'all' ? undefined : filter?.contentType
        })

      // If RPC function doesn't exist, fall back to direct queries
      if (error && (error.code === '42883' || error.message?.includes('function') || error.message?.includes('NetworkError'))) {
        console.warn('get_moderation_queue RPC not found, falling back to direct queries')
        return this.getQueueFallback(filter)
      }

      if (error) throw error

      // Map and enrich with full content data
      const items = await Promise.all(
        data.map(async (item) => {
          // Fetch full content based on type
          let title = item.title
          let content = {}
          
          if (item.content_type === 'song') {
            const { data: songData } = await supabase
              .from('songs')
              .select('*')
              .eq('id', item.content_id)
              .single()
            
            content = songData || {}
          } else {
            // For arrangements, fetch with the song data to get song name
            const { data: arrangementData } = await supabase
              .from('arrangements')
              .select('*, song:songs!arrangements_song_id_fkey(*)')
              .eq('id', item.content_id)
              .single()
            
            if (arrangementData) {
              content = arrangementData
              // Format title as "Song Name - Arrangement Name"
              if (arrangementData.song && arrangementData.song.title) {
                title = `${arrangementData.song.title} - ${arrangementData.name || item.title}`
              }
            }
          }

          return {
            id: item.id,
            contentId: item.content_id,
            contentType: item.content_type as 'song' | 'arrangement',
            title: title,
            creator: {
              id: item.creator_id,
              email: item.creator_email,
              name: null
            },
            status: item.status as 'pending' | 'approved' | 'rejected' | 'flagged',
            reportCount: item.report_count,
            createdAt: item.created_at,
            lastModifiedAt: item.last_modified,
            content: content
          } as ModerationItem
        })
      )

      // Apply client-side filters for more complex logic
      let filteredItems = items

      if (filter?.search) {
        const searchTerm = filter.search.toLowerCase()
        filteredItems = items.filter(item =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.creator.email.toLowerCase().includes(searchTerm)
        )
      }

      if (filter?.reportedOnly) {
        filteredItems = filteredItems.filter(item => item.reportCount > 0)
      }

      // Handle pagination
      if (filter?.page && filter?.limit) {
        const start = (filter.page - 1) * filter.limit
        const end = start + filter.limit
        filteredItems = filteredItems.slice(start, end)
      }

      // Cache the result
      setCachedResult(cacheKey, filteredItems)
      
      return filteredItems
    } catch (error) {
      console.error('Error fetching moderation queue:', error)
      throw error
    }
  },

  async moderateContent(action: ModerationAction): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authentication required')

      // Process each content item
      for (const contentId of action.contentIds) {
        // First check if it's a song
        const { data: songCheck, error: songError } = await supabase
          .from('songs')
          .select('id')
          .eq('id', contentId)
          .single()

        // If not found in songs or error, check arrangements
        let table = 'songs'
        let contentType = 'song'
        
        if (!songCheck || songError) {
          const { data: arrangementCheck, error: arrangementError } = await supabase
            .from('arrangements')
            .select('id')
            .eq('id', contentId)
            .single()
          
          if (arrangementCheck && !arrangementError) {
            table = 'arrangements'
            contentType = 'arrangement'
          } else {
            console.error(`Content ID ${contentId} not found in songs or arrangements`)
            continue // Skip this item if not found in either table
          }
        }

        // Get current status for logging
        const { data: currentItem } = await supabase
          .from(table as 'songs' | 'arrangements')
          .select('moderation_status')
          .eq('id', contentId)
          .single()

        const previousStatus = currentItem?.moderation_status

        // Update moderation status
        const newStatus = action.action === 'approve' ? 'approved' :
                         action.action === 'reject' ? 'rejected' :
                         action.action === 'flag' ? 'flagged' : 'pending'

        const { error: updateError } = await supabase
          .from(table as 'songs' | 'arrangements')
          .update({
            moderation_status: newStatus,
            moderated_by: user.id,
            moderated_at: new Date().toISOString(),
            moderation_note: action.note
          })
          .eq('id', contentId)

        if (updateError) throw updateError

        // Log the action
        const { error: logError } = await supabase
          .from('moderation_log')
          .insert({
            content_id: contentId,
            content_type: contentType,
            action: action.action,
            performed_by: user.id,
            previous_status: previousStatus,
            new_status: newStatus,
            note: action.note
          })

        if (logError) {
          console.error('Failed to log moderation action:', logError)
          // Don't throw here to allow the moderation to complete even if logging fails
          // but we should track this for monitoring
        }

        // Resolve related reports if approving/rejecting
        if (action.action === 'approve' || action.action === 'reject') {
          await supabase
            .from('content_reports')
            .update({
              status: 'resolved',
              resolved_by: user.id,
              resolved_at: new Date().toISOString(),
              resolution: `Content ${action.action}ed`
            })
            .eq('content_id', contentId)
            .eq('status', 'open')
        }
      }

      // Clear relevant caches
      clearCache()
    } catch (error) {
      console.error('Error moderating content:', error)
      throw error
    }
  },

  async submitReport(report: Omit<ContentReport, 'id' | 'createdAt' | 'status'>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authentication required')

      const { error } = await supabase
        .from('content_reports')
        .insert({
          content_id: report.contentId,
          content_type: report.contentType,
          reported_by: user.id,
          reason: report.reason,
          description: report.description
        })

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('You have already reported this content')
        }
        throw error
      }

      // Update content to flagged if multiple reports
      const { count } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', report.contentId)
        .eq('content_type', report.contentType)
        .eq('status', 'open')

      if (count && count >= 3) {
        // Auto-flag content with 3+ reports
        const table = report.contentType === 'song' ? 'songs' : 'arrangements'
        await supabase
          .from(table as 'songs' | 'arrangements')
          .update({ moderation_status: 'flagged' })
          .eq('id', report.contentId)
      }

      // Clear cache to reflect new report counts
      clearCache()
    } catch (error) {
      console.error('Error submitting report:', error)
      throw error
    }
  },

  async getReports(contentId?: string, contentType?: 'song' | 'arrangement'): Promise<ContentReport[]> {
    try {
      let query = supabase
        .from('content_reports')
        .select(`
          *,
          reported_by_user:users!content_reports_reported_by_fkey(email),
          resolved_by_user:users!content_reports_resolved_by_fkey(email)
        `)
        .order('created_at', { ascending: false })

      if (contentId && contentType) {
        query = query.eq('content_id', contentId).eq('content_type', contentType)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map(report => ({
        id: report.id,
        contentId: report.content_id,
        contentType: report.content_type as 'song' | 'arrangement',
        reportedBy: report.reported_by || '',
        reason: report.reason as 'inappropriate' | 'copyright' | 'spam' | 'incorrect' | 'other',
        description: report.description || undefined,
        createdAt: report.created_at || new Date().toISOString(),
        status: report.status as 'open' | 'reviewed' | 'resolved',
        resolvedBy: report.resolved_by || undefined,
        resolvedAt: report.resolved_at || undefined,
        resolution: report.resolution || undefined
      }))
    } catch (error) {
      console.error('Error fetching reports:', error)
      throw error
    }
  },

  async getStats(): Promise<ModerationStats> {
    try {
      const cacheKey = 'getModerationStats'
      const cachedResult = getCachedResult<ModerationStats>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      // Get basic counts
      const [pendingSongs, flaggedSongs, pendingArrangements, flaggedArrangements] = await Promise.all([
        supabase.from('songs').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
        supabase.from('songs').select('id', { count: 'exact', head: true }).eq('moderation_status', 'flagged'),
        supabase.from('arrangements').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
        supabase.from('arrangements').select('id', { count: 'exact', head: true }).eq('moderation_status', 'flagged')
      ])

      const pendingCount = (pendingSongs.count || 0) + (pendingArrangements.count || 0)
      const flaggedCount = (flaggedSongs.count || 0) + (flaggedArrangements.count || 0)

      // Get today's approvals and rejections
      const today = new Date().toISOString().split('T')[0]
      const { count: approvedToday } = await supabase
        .from('moderation_log')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'approve')
        .gte('performed_at', `${today}T00:00:00Z`)

      const { count: rejectedToday } = await supabase
        .from('moderation_log')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'reject')
        .gte('performed_at', `${today}T00:00:00Z`)

      const stats = {
        pendingCount,
        flaggedCount,
        approvedToday: approvedToday || 0,
        rejectedToday: rejectedToday || 0,
        averageReviewTime: 0, // TODO: Calculate from moderation_log
        topReporters: [] // TODO: Get from content_reports
      }

      setCachedResult(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('Error fetching moderation stats:', error)
      throw error
    }
  },

  async getQueueFallback(filter?: ModerationFilter): Promise<ModerationItem[]> {
    try {
      // Fetch songs and arrangements separately
      const [songsResult, arrangementsResult] = await Promise.all([
        // Fetch songs with their creators
        supabase
          .from('songs')
          .select(`
            *,
            creator:users!songs_created_by_fkey(id, email)
          `)
          .order('created_at', { ascending: false }),
        // Fetch arrangements with their songs and creators
        supabase
          .from('arrangements')
          .select(`
            *,
            song:songs!arrangements_song_id_fkey(*),
            creator:users!arrangements_created_by_fkey(id, email)
          `)
          .order('created_at', { ascending: false })
      ])

      if (songsResult.error) throw songsResult.error
      if (arrangementsResult.error) throw arrangementsResult.error

      // Get report counts
      const { data: reports } = await supabase
        .from('content_reports')
        .select('content_id, content_type')
        .eq('status', 'open')

      const reportCounts = new Map<string, number>()
      if (reports) {
        reports.forEach(report => {
          const count = reportCounts.get(report.content_id) || 0
          reportCounts.set(report.content_id, count + 1)
        })
      }

      // Process songs
      const songItems: ModerationItem[] = (songsResult.data || [])
        .filter(song => {
          if (filter?.contentType && filter.contentType !== 'all' && filter.contentType !== 'song') {
            return false
          }
          if (filter?.status && filter.status !== 'all' && song.moderation_status !== filter.status) {
            return false
          }
          return true
        })
        .map(song => ({
          id: song.id,
          contentId: song.id,
          contentType: 'song' as const,
          title: song.title,
          creator: {
            id: song.created_by || '',
            email: song.creator?.email || 'Unknown',
            name: null
          },
          status: (song.moderation_status || 'pending') as ModerationItem['status'],
          reportCount: reportCounts.get(song.id) || 0,
          createdAt: song.created_at || new Date().toISOString(),
          lastModifiedAt: song.updated_at || song.created_at || new Date().toISOString(),
          content: song
        }))

      // Process arrangements
      const arrangementItems: ModerationItem[] = (arrangementsResult.data || [])
        .filter(arrangement => {
          if (filter?.contentType && filter.contentType !== 'all' && filter.contentType !== 'arrangement') {
            return false
          }
          if (filter?.status && filter.status !== 'all' && arrangement.moderation_status !== filter.status) {
            return false
          }
          return true
        })
        .map(arrangement => {
          // Format title as "Song Name - Arrangement Name"
          let title = arrangement.name
          if (arrangement.song && arrangement.song.title) {
            title = `${arrangement.song.title} - ${arrangement.name}`
          }

          return {
            id: arrangement.id,
            contentId: arrangement.id,
            contentType: 'arrangement' as const,
            title: title,
            creator: {
              id: arrangement.created_by || '',
              email: arrangement.creator?.email || 'Unknown',
              name: null
            },
            status: (arrangement.moderation_status || 'pending') as ModerationItem['status'],
            reportCount: reportCounts.get(arrangement.id) || 0,
            createdAt: arrangement.created_at || new Date().toISOString(),
            lastModifiedAt: arrangement.updated_at || arrangement.created_at || new Date().toISOString(),
            content: arrangement
          }
        })

      // Combine and sort by created date
      let items = [...songItems, ...arrangementItems].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      // Apply search filter
      if (filter?.search) {
        const searchTerm = filter.search.toLowerCase()
        items = items.filter(item =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.creator.email.toLowerCase().includes(searchTerm)
        )
      }

      // Apply reported only filter
      if (filter?.reportedOnly) {
        items = items.filter(item => item.reportCount > 0)
      }

      // Apply pagination
      if (filter?.page && filter?.limit) {
        const start = (filter.page - 1) * filter.limit
        const end = start + filter.limit
        items = items.slice(start, end)
      }

      return items
    } catch (error) {
      console.error('Error in getQueueFallback:', error)
      throw error
    }
  }
}