import { supabase } from './supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Real-time event types
export type RealtimeEvent<T = Record<string, unknown>> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  table: string
}

// Real-time listener callback
export type RealtimeListener<T> = (event: RealtimeEvent<T>) => void

// Active subscriptions
const activeSubscriptions = new Map<string, RealtimeChannel>()

/**
 * Real-time service for collaborative editing
 */
export class RealtimeService {
  /**
   * Subscribe to changes on a specific table
   */
  static subscribe<T extends Record<string, unknown> = Record<string, unknown>>(
    table: keyof Database['public']['Tables'],
    listener: RealtimeListener<T>,
    filter?: { column: string; value: string }
  ): string {
    const subscriptionId = `${table as string}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const channel = supabase.channel(`realtime-${subscriptionId}`)
    
    // Build postgres changes subscription
    const postgresChanges = channel.on(
      'postgres_changes' as const,
      {
        event: '*',
        schema: 'public',
        table: table as string,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        listener({
          eventType: payload.eventType,
          new: (payload.new as T) || null,
          old: (payload.old as T) || null,
          table: table as string
        })
      }
    )
    
    // Subscribe to the channel
    postgresChanges.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to real-time updates for ${table}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Failed to subscribe to real-time updates for ${table}`)
      }
    })
    
    activeSubscriptions.set(subscriptionId, channel)
    return subscriptionId
  }
  
  /**
   * Subscribe to song changes
   */
  static subscribeSongs(listener: RealtimeListener<Database['public']['Tables']['songs']['Row']>): string {
    return this.subscribe('songs', listener)
  }
  
  /**
   * Subscribe to arrangement changes for a specific song
   */
  static subscribeArrangements(
    listener: RealtimeListener<Database['public']['Tables']['arrangements']['Row']>,
    songId?: string
  ): string {
    return this.subscribe(
      'arrangements', 
      listener, 
      songId ? { column: 'song_id', value: songId } : undefined
    )
  }
  
  /**
   * Subscribe to setlist changes
   */
  static subscribeSetlists(listener: RealtimeListener<Database['public']['Tables']['setlists']['Row']>): string {
    return this.subscribe('setlists', listener)
  }
  
  /**
   * Subscribe to setlist item changes for a specific setlist
   */
  static subscribeSetlistItems(
    setlistId: string,
    listener: RealtimeListener<Database['public']['Tables']['setlist_items']['Row']>
  ): string {
    return this.subscribe('setlist_items', listener, { column: 'setlist_id', value: setlistId })
  }
  
  /**
   * Subscribe to review changes for a specific song
   */
  static subscribeReviews(
    songId: string,
    listener: RealtimeListener<Database['public']['Tables']['reviews']['Row']>
  ): string {
    return this.subscribe('reviews', listener, { column: 'song_id', value: songId })
  }
  
  /**
   * Unsubscribe from real-time updates
   */
  static unsubscribe(subscriptionId: string): void {
    const channel = activeSubscriptions.get(subscriptionId)
    if (channel) {
      supabase.removeChannel(channel)
      activeSubscriptions.delete(subscriptionId)
      console.log(`🔌 Unsubscribed from real-time updates: ${subscriptionId}`)
    }
  }
  
  /**
   * Unsubscribe from all real-time updates
   */
  static unsubscribeAll(): void {
    for (const [_subscriptionId, channel] of activeSubscriptions) {
      supabase.removeChannel(channel)
    }
    activeSubscriptions.clear()
    console.log('🔌 Unsubscribed from all real-time updates')
  }
  
  /**
   * Get status of all active subscriptions
   */
  static getActiveSubscriptions(): string[] {
    return Array.from(activeSubscriptions.keys())
  }
  
  /**
   * Send a presence signal (for showing who's currently editing)
   */
  static async sendPresence(channel: string, payload: { user: string; action: string; [key: string]: unknown }): Promise<void> {
    const presenceChannel = supabase.channel(channel)
    
    await presenceChannel
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence synced')
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe()
    
    await presenceChannel.track(payload)
  }
  
  /**
   * Stop sending presence
   */
  static async stopPresence(channel: string): Promise<void> {
    const presenceChannel = supabase.channel(channel)
    await presenceChannel.untrack()
    supabase.removeChannel(presenceChannel)
  }
}

/**
 * React hook for real-time subscriptions
 */
import { useEffect, useRef } from 'react'

export function useRealtimeSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  table: keyof Database['public']['Tables'],
  listener: RealtimeListener<T>,
  filter?: { column: string; value: string },
  dependencies: React.DependencyList = []
) {
  const subscriptionIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    // Subscribe
    subscriptionIdRef.current = RealtimeService.subscribe(table, listener, filter)
    
    // Cleanup on unmount or dependency change
    return () => {
      if (subscriptionIdRef.current) {
        RealtimeService.unsubscribe(subscriptionIdRef.current)
        subscriptionIdRef.current = null
      }
    }
  }, [table, filter?.column, filter?.value, ...dependencies])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionIdRef.current) {
        RealtimeService.unsubscribe(subscriptionIdRef.current)
      }
    }
  }, [])
}

/**
 * React hook for song real-time updates
 */
export function useRealtimeSongs(listener: RealtimeListener<Database['public']['Tables']['songs']['Row']>) {
  useRealtimeSubscription('songs', listener)
}

/**
 * React hook for arrangement real-time updates
 */
export function useRealtimeArrangements(
  listener: RealtimeListener<Database['public']['Tables']['arrangements']['Row']>,
  songId?: string
) {
  useRealtimeSubscription(
    'arrangements', 
    listener,
    songId ? { column: 'song_id', value: songId } : undefined,
    [songId]
  )
}

/**
 * React hook for setlist real-time updates
 */
export function useRealtimeSetlists(listener: RealtimeListener<Database['public']['Tables']['setlists']['Row']>) {
  useRealtimeSubscription('setlists', listener)
}

/**
 * React hook for setlist items real-time updates
 */
export function useRealtimeSetlistItems(
  setlistId: string,
  listener: RealtimeListener<Database['public']['Tables']['setlist_items']['Row']>
) {
  useRealtimeSubscription(
    'setlist_items', 
    listener,
    { column: 'setlist_id', value: setlistId },
    [setlistId]
  )
}