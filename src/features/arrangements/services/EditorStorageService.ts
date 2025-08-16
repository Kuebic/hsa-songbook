import * as LZString from 'lz-string';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { EditorCommand } from '../types/command.types';

// IndexedDB schema
interface EditorDBSchema extends DBSchema {
  drafts: {
    key: string;
    value: {
      arrangementId: string;
      content: string;
      timestamp: number;
      userId: string;
      version: number;
    };
    indexes: { 
      'by-timestamp': number; 
      'by-user': string;
      'by-arrangement': string;
    };
  };
  history: {
    key: string;
    value: {
      arrangementId: string;
      data: string; // Compressed command history
      timestamp: number;
      userId: string;
    };
    indexes: { 
      'by-arrangement': string;
      'by-timestamp': number;
    };
  };
}

// Draft data structure
interface DraftData {
  content: string;
  history: EditorCommand[];
  timestamp: number;
  version: number;
}

// Storage statistics
interface StorageStats {
  sessionStorageUsed: number;
  sessionStorageTotal: number;
  indexedDBUsed?: number;
  indexedDBQuota?: number;
}

export class EditorStorageService {
  private db: IDBPDatabase<EditorDBSchema> | null = null;
  private readonly DB_NAME = 'chord-editor-db';
  private readonly DB_VERSION = 1;
  private readonly DRAFT_VERSION = 1;
  private readonly MAX_SESSION_SIZE = 4 * 1024 * 1024; // 4MB safety limit
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  /**
   * Initialize the storage service
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB<EditorDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Create drafts store
          if (!db.objectStoreNames.contains('drafts')) {
            const draftStore = db.createObjectStore('drafts', {
              keyPath: 'arrangementId'
            });
            draftStore.createIndex('by-timestamp', 'timestamp');
            draftStore.createIndex('by-user', 'userId');
            draftStore.createIndex('by-arrangement', 'arrangementId');
          }
          
          // Create history store
          if (!db.objectStoreNames.contains('history')) {
            const historyStore = db.createObjectStore('history', {
              keyPath: 'arrangementId'
            });
            historyStore.createIndex('by-arrangement', 'arrangementId');
            historyStore.createIndex('by-timestamp', 'timestamp');
          }
        }
      });
      
      // Schedule periodic cleanup
      this.scheduleCleanup();
    } catch (error) {
      console.warn('Failed to initialize IndexedDB:', error);
      // Service will fall back to sessionStorage only
    }
  }
  
  /**
   * Save draft to session storage with fallback to IndexedDB
   */
  async saveDraftToSession(
    arrangementId: string, 
    content: string, 
    history: EditorCommand[] = [],
    userId?: string
  ): Promise<void> {
    const key = `chord-editor-session-${arrangementId}`;
    
    try {
      const data: DraftData = {
        content,
        history: history.slice(-100), // Keep only last 100 commands
        timestamp: Date.now(),
        version: this.DRAFT_VERSION
      };
      
      // Compress large history arrays
      let serializedData: string;
      if (history.length > 10) {
        const compressedHistory = LZString.compress(JSON.stringify(data.history));
        serializedData = JSON.stringify({
          ...data,
          history: undefined,
          compressedHistory
        });
      } else {
        serializedData = JSON.stringify(data);
      }
      
      // Check size before saving
      if (serializedData.length > this.MAX_SESSION_SIZE) {
        throw new Error('Data too large for session storage');
      }
      
      sessionStorage.setItem(key, serializedData);
    } catch (error) {
      console.warn('Session storage save failed:', error);
      
      // Fallback to IndexedDB for large content
      if (this.db && userId) {
        await this.saveLargeDraftToIndexedDB(arrangementId, content, history, userId);
      } else {
        // Last resort: clear old session drafts and retry
        this.clearOldSessionDrafts();
        try {
          // Retry with compressed content only (no history)
          const minimalData = {
            content,
            timestamp: Date.now(),
            version: this.DRAFT_VERSION
          };
          sessionStorage.setItem(key, JSON.stringify(minimalData));
        } catch (retryError) {
          console.error('Failed to save draft even after cleanup:', retryError);
          throw new Error('Unable to save draft - storage quota exceeded');
        }
      }
    }
  }
  
  /**
   * Load draft from session storage with fallback to IndexedDB
   */
  async loadDraftFromSession(arrangementId: string, userId?: string): Promise<DraftData | null> {
    const key = `chord-editor-session-${arrangementId}`;
    
    try {
      // Try session storage first
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        
        // Handle compressed history
        if (parsed.compressedHistory && !parsed.history) {
          const decompressed = LZString.decompress(parsed.compressedHistory);
          if (decompressed) {
            parsed.history = JSON.parse(decompressed);
          } else {
            parsed.history = [];
          }
          delete parsed.compressedHistory;
        }
        
        return {
          content: parsed.content || '',
          history: parsed.history || [],
          timestamp: parsed.timestamp || Date.now(),
          version: parsed.version || 1
        };
      }
    } catch (error) {
      console.warn('Failed to load from session storage:', error);
    }
    
    // Fallback to IndexedDB
    if (this.db && userId) {
      return await this.loadDraftFromIndexedDB(arrangementId, userId);
    }
    
    return null;
  }
  
  /**
   * Check if draft exists
   */
  async hasDraft(arrangementId: string, userId?: string): Promise<boolean> {
    const key = `chord-editor-session-${arrangementId}`;
    
    // Check session storage first
    if (sessionStorage.getItem(key)) {
      return true;
    }
    
    // Check IndexedDB
    if (this.db && userId) {
      try {
        const draft = await this.db.get('drafts', arrangementId);
        return draft?.userId === userId;
      } catch (error) {
        console.warn('Failed to check IndexedDB for draft:', error);
      }
    }
    
    return false;
  }
  
  /**
   * Delete draft from all storage tiers
   */
  async deleteDraft(arrangementId: string, userId?: string): Promise<void> {
    const key = `chord-editor-session-${arrangementId}`;
    
    // Remove from session storage
    sessionStorage.removeItem(key);
    
    // Remove from IndexedDB
    if (this.db && userId) {
      try {
        await this.db.delete('drafts', arrangementId);
        await this.db.delete('history', arrangementId);
      } catch (error) {
        console.warn('Failed to delete from IndexedDB:', error);
      }
    }
  }
  
  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const stats: StorageStats = {
      sessionStorageUsed: 0,
      sessionStorageTotal: 5 * 1024 * 1024 // Typical 5MB limit
    };
    
    // Calculate session storage usage
    try {
      let sessionUsed = 0;
      for (const key in sessionStorage) {
        if (key.startsWith('chord-editor-')) {
          sessionUsed += sessionStorage.getItem(key)?.length || 0;
        }
      }
      stats.sessionStorageUsed = sessionUsed;
    } catch (_error) {
      // Ignore errors calculating storage
    }
    
    // Get IndexedDB quota if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        stats.indexedDBUsed = estimate.usage;
        stats.indexedDBQuota = estimate.quota;
      } catch (_error) {
        // Ignore quota errors
      }
    }
    
    return stats;
  }
  
  /**
   * Save large draft to IndexedDB
   */
  private async saveLargeDraftToIndexedDB(
    arrangementId: string,
    content: string,
    history: EditorCommand[],
    userId: string
  ): Promise<void> {
    if (!this.db) return;
    
    try {
      const tx = this.db.transaction(['drafts', 'history'], 'readwrite');
      
      // Save draft content
      await tx.objectStore('drafts').put({
        arrangementId,
        content,
        timestamp: Date.now(),
        userId,
        version: this.DRAFT_VERSION
      });
      
      // Save compressed history separately
      if (history.length > 0) {
        const compressedHistory = LZString.compress(JSON.stringify(history.slice(-100)));
        await tx.objectStore('history').put({
          arrangementId,
          data: compressedHistory,
          timestamp: Date.now(),
          userId
        });
      }
      
      await tx.done;
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
      throw error;
    }
  }
  
  /**
   * Load draft from IndexedDB
   */
  private async loadDraftFromIndexedDB(arrangementId: string, userId: string): Promise<DraftData | null> {
    if (!this.db) return null;
    
    try {
      const [draft, history] = await Promise.all([
        this.db.get('drafts', arrangementId),
        this.db.get('history', arrangementId)
      ]);
      
      if (!draft || draft.userId !== userId) {
        return null;
      }
      
      let historyData: EditorCommand[] = [];
      if (history && history.userId === userId) {
        try {
          const decompressed = LZString.decompress(history.data);
          if (decompressed) {
            historyData = JSON.parse(decompressed);
          }
        } catch (error) {
          console.warn('Failed to decompress history:', error);
        }
      }
      
      return {
        content: draft.content,
        history: historyData,
        timestamp: draft.timestamp,
        version: draft.version
      };
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      return null;
    }
  }
  
  /**
   * Clear old session storage drafts
   */
  private clearOldSessionDrafts(): void {
    const keys = Object.keys(sessionStorage);
    const draftKeys = keys.filter(key => key.startsWith('chord-editor-session-'));
    
    // Parse timestamps and sort by age
    const draftsWithAge = draftKeys.map(key => {
      try {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}');
        return { key, timestamp: data.timestamp || 0 };
      } catch {
        return { key, timestamp: 0 };
      }
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest drafts (keep newest 5)
    const toRemove = draftsWithAge.slice(0, -5);
    toRemove.forEach(({ key }) => sessionStorage.removeItem(key));
  }
  
  /**
   * Schedule periodic cleanup of old drafts
   */
  private scheduleCleanup(): void {
    setInterval(() => {
      this.cleanupOldDrafts().catch(console.error);
    }, this.CLEANUP_INTERVAL);
  }
  
  /**
   * Clean up old drafts from all storage tiers
   */
  private async cleanupOldDrafts(): Promise<void> {
    const cutoff = Date.now() - this.MAX_DRAFT_AGE;
    
    // Clean session storage
    this.clearOldSessionDrafts();
    
    // Clean IndexedDB
    if (this.db) {
      try {
        const tx = this.db.transaction(['drafts', 'history'], 'readwrite');
        
        // Clean old drafts
        const draftIndex = tx.objectStore('drafts').index('by-timestamp');
        const draftCursor = await draftIndex.openCursor(IDBKeyRange.upperBound(cutoff));
        
        if (draftCursor) {
          await draftCursor.delete();
          await draftCursor.continue();
        }
        
        // Clean old history
        const historyIndex = tx.objectStore('history').index('by-timestamp');
        const historyCursor = await historyIndex.openCursor(IDBKeyRange.upperBound(cutoff));
        
        if (historyCursor) {
          await historyCursor.delete();
          await historyCursor.continue();
        }
        
        await tx.done;
      } catch (error) {
        console.warn('Failed to cleanup IndexedDB:', error);
      }
    }
  }
}