import { supabase } from '../../../lib/supabase'

// Draft data structure
interface DraftData {
  content: string;
  timestamp: number;
  version: number;
}

// Storage statistics
interface StorageStats {
  sessionStorageUsed: number;
  sessionStorageTotal: number;
  supabaseDrafts?: number;
}

export class EditorStorageService {
  private readonly DRAFT_VERSION = 1;
  private readonly MAX_SESSION_SIZE = 4 * 1024 * 1024; // 4MB safety limit
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  /**
   * Initialize the storage service (Supabase doesn't need explicit initialization)
   */
  async initialize(): Promise<void> {
    try {
      // Check if user is authenticated for Supabase operations
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('EditorStorageService initialized with Supabase backend')
      } else {
        console.log('EditorStorageService initialized (session storage only)')
      }
      
      // Schedule periodic cleanup
      this.scheduleCleanup();
    } catch (error) {
      console.warn('Failed to initialize Supabase auth check:', error);
      // Service will fall back to sessionStorage only
    }
  }
  
  /**
   * Save draft to session storage with fallback to Supabase
   */
  async saveDraftToSession(
    arrangementId: string, 
    content: string, 
    userId?: string
  ): Promise<void> {
    const key = `chord-editor-session-${arrangementId}`;
    
    try {
      const data: DraftData = {
        content,
        timestamp: Date.now(),
        version: this.DRAFT_VERSION
      };
      
      const serializedData = JSON.stringify(data);
      
      // Check size before saving
      if (serializedData.length > this.MAX_SESSION_SIZE) {
        throw new Error('Data too large for session storage');
      }
      
      sessionStorage.setItem(key, serializedData);
    } catch (error) {
      console.warn('Session storage save failed:', error);
      
      // Fallback to Supabase for large content or when session storage is full
      if (userId) {
        await this.saveDraftToSupabase(arrangementId, content, userId);
      } else {
        // Last resort: clear old session drafts and retry
        this.clearOldSessionDrafts();
        try {
          // Retry with minimal data
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
   * Load draft from session storage with fallback to Supabase
   */
  async loadDraftFromSession(arrangementId: string, userId?: string): Promise<DraftData | null> {
    const key = `chord-editor-session-${arrangementId}`;
    
    try {
      // Try session storage first
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        
        return {
          content: parsed.content || '',
          timestamp: parsed.timestamp || Date.now(),
          version: parsed.version || 1
        };
      }
    } catch (error) {
      console.warn('Failed to load from session storage:', error);
    }
    
    // Fallback to Supabase
    if (userId) {
      return await this.loadDraftFromSupabase(arrangementId, userId);
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
    
    // Check Supabase
    if (userId) {
      try {
        const draft = await this.loadDraftFromSupabase(arrangementId, userId);
        return draft !== null;
      } catch (error) {
        console.warn('Failed to check Supabase for draft:', error);
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
    
    // Remove from Supabase
    if (userId) {
      await this.deleteDraftFromSupabase(arrangementId, userId);
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
    
    // Get Supabase draft count if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from('arrangements')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
        stats.supabaseDrafts = count || 0;
      }
    } catch (_error) {
      // Ignore Supabase errors
    }
    
    return stats;
  }
  
  /**
   * Save draft to Supabase (for large content or cloud sync)
   */
  private async saveDraftToSupabase(
    arrangementId: string,
    content: string,
    userId: string
  ): Promise<void> {
    try {
      // Store as chord_data in the arrangements table - no compression needed, PostgreSQL TOAST handles it
      const { error } = await supabase
        .from('arrangements')
        .update({ 
          chord_data: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', arrangementId)
        .eq('created_by', userId);
      
      if (error) {
        console.error('Failed to save draft to Supabase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save to Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Load draft from Supabase
   */
  private async loadDraftFromSupabase(arrangementId: string, userId: string): Promise<DraftData | null> {
    try {
      const { data, error } = await supabase
        .from('arrangements')
        .select('chord_data, updated_at')
        .eq('id', arrangementId)
        .eq('created_by', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }
      
      if (!data?.chord_data) {
        return null;
      }
      
      return {
        content: data.chord_data,
        timestamp: new Date(data.updated_at).getTime(),
        version: this.DRAFT_VERSION
      };
    } catch (error) {
      console.error('Failed to load from Supabase:', error);
      return null;
    }
  }
  
  /**
   * Delete draft from Supabase
   */
  private async deleteDraftFromSupabase(arrangementId: string, userId: string): Promise<void> {
    try {
      // We don't actually delete the arrangement, just clear the chord_data if it's empty
      // This preserves metadata while removing draft content
      const { error } = await supabase
        .from('arrangements')
        .update({ 
          chord_data: '',
          updated_at: new Date().toISOString()
        })
        .eq('id', arrangementId)
        .eq('created_by', userId);
      
      if (error) {
        console.warn('Failed to delete draft from Supabase:', error);
      }
    } catch (error) {
      console.warn('Failed to delete from Supabase:', error);
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
    // Clean session storage
    this.clearOldSessionDrafts();
    
    // Note: Supabase drafts are stored as arrangements and cleaned up via database policies
    // We don't need to manually clean them here as they're actual data
  }
}