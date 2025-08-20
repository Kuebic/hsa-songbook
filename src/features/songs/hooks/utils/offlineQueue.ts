import type { SongFormData } from '../../validation/schemas/songFormSchema'

export type QueuedAction = 
  | { id: string; type: 'create'; data: { formData: SongFormData; token: string }; timestamp: number; retries: number; maxRetries: number }
  | { id: string; type: 'update'; data: { id: string; formData: Partial<SongFormData>; token: string; userId?: string }; timestamp: number; retries: number; maxRetries: number }
  | { id: string; type: 'delete'; data: { id: string; token: string }; timestamp: number; retries: number; maxRetries: number }
  | { id: string; type: 'rate'; data: { id: string; rating: number; token: string }; timestamp: number; retries: number; maxRetries: number }

export interface OfflineQueueOptions {
  storageKey?: string
  maxRetries?: number
  retryDelay?: number
  onSync?: (action: QueuedAction) => void
  onError?: (action: QueuedAction, error: Error) => void
}

export class OfflineQueue {
  private queue: Map<string, QueuedAction> = new Map()
  private storageKey: string
  private maxRetries: number
  private retryDelay: number
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private onSync?: (action: QueuedAction) => void
  private onError?: (action: QueuedAction, error: Error) => void
  
  constructor(options: OfflineQueueOptions = {}) {
    this.storageKey = options.storageKey || 'songOfflineQueue'
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.onSync = options.onSync
    this.onError = options.onError
    
    this.loadQueue()
    this.setupEventListeners()
    
    // Try to sync on initialization if online
    if (this.isOnline) {
      this.processQueue()
    }
  }
  
  private loadQueue() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        const items = JSON.parse(saved) as QueuedAction[]
        items.forEach(item => {
          this.queue.set(item.id, item)
        })
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
    }
  }
  
  private saveQueue() {
    try {
      const items = Array.from(this.queue.values())
      localStorage.setItem(this.storageKey, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }
  
  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    
    // Also listen for visibility change to sync when tab becomes visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }
  
  private handleOnline = () => {
    this.isOnline = true
    console.log('Network connection restored, processing offline queue...')
    this.processQueue()
  }
  
  private handleOffline = () => {
    this.isOnline = false
    console.log('Network connection lost, queuing actions...')
  }
  
  add(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'maxRetries'>): string {
    const id = `${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const queuedAction: QueuedAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.maxRetries
    }
    
    this.queue.set(id, queuedAction)
    this.saveQueue()
    
    // Try to process immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processQueue()
    }
    
    return id
  }
  
  remove(id: string) {
    this.queue.delete(id)
    this.saveQueue()
  }
  
  async processQueue() {
    if (!this.isOnline || this.syncInProgress || this.queue.size === 0) {
      return
    }
    
    this.syncInProgress = true
    
    // Sort by timestamp to process in order
    const sortedActions = Array.from(this.queue.values())
      .sort((a, b) => a.timestamp - b.timestamp)
    
    for (const action of sortedActions) {
      try {
        await this.processAction(action)
        this.remove(action.id)
        this.onSync?.(action)
      } catch (error) {
        console.error(`Failed to process action ${action.id}:`, error)
        
        action.retries++
        
        if (action.retries >= action.maxRetries) {
          console.error(`Max retries reached for action ${action.id}, removing from queue`)
          this.remove(action.id)
          this.onError?.(action, error as Error)
        } else {
          // Update retry count and wait before next attempt
          this.queue.set(action.id, action)
          this.saveQueue()
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * action.retries))
        }
      }
    }
    
    this.syncInProgress = false
  }
  
  private async processAction(action: QueuedAction): Promise<void> {
    // Import dynamically to avoid circular dependencies
    const { songService } = await import('@features/songs/services/songService')
    
    switch (action.type) {
      case 'create':
        await songService.createSong(action.data.formData, action.data.token)
        break
      case 'update':
        await songService.updateSong(action.data.id, action.data.formData, action.data.token, action.data.userId)
        break
      case 'delete':
        await songService.deleteSong(action.data.id, action.data.token)
        break
      case 'rate':
        await songService.rateSong(action.data.id, action.data.rating, action.data.token)
        break
      default:
        throw new Error(`Unknown action type: ${(action as { type: string }).type}`)
    }
  }
  
  getQueueSize(): number {
    return this.queue.size
  }
  
  getQueuedActions(): QueuedAction[] {
    return Array.from(this.queue.values())
  }
  
  clearQueue() {
    this.queue.clear()
    this.saveQueue()
  }
  
  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    
    // Also remove visibility change listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    
    this.clearQueue()
  }
  
  private handleVisibilityChange = () => {
    if (!document.hidden && this.isOnline) {
      this.processQueue()
    }
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue({
  onSync: (action) => {
    console.log('Synced offline action:', action.type, action.id)
  },
  onError: (action, error) => {
    console.error('Failed to sync action:', action.type, error)
    // Could show user notification here
  }
})