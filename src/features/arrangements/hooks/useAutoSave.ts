import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { throttle, debounce } from 'lodash-es';
import { EditorStorageService } from '../services/EditorStorageService';
import { arrangementService } from '@features/songs/services/arrangementService';
import { useAuth } from '@features/auth/hooks/useAuth';
import { arrangementExistenceStore } from '../stores/arrangementExistenceStore';

interface UseAutoSaveOptions {
  arrangementId: string;
  content: string;
  isDirty: boolean;
  userId?: string;
  enabled?: boolean;
  debounceMs?: number;
  throttleMs?: number;
}

interface AutoSaveState {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  saveError: Error | null;
}

export function useAutoSave({
  arrangementId,
  content,
  isDirty,
  userId,
  enabled = true,
  debounceMs = 2000, // 2 seconds after typing stops
  throttleMs = 30000 // 30 seconds maximum interval
}: UseAutoSaveOptions) {
  const storageService = useRef<EditorStorageService>(new EditorStorageService());
  const { getToken } = useAuth();
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isAutoSaving: false,
    lastSaved: null,
    saveError: null
  });
  
  const saveInProgress = useRef(false);
  const lastContentRef = useRef(content);
  const lastBackendSaveRef = useRef<Date | null>(null);
  
  // Initialize storage service
  useEffect(() => {
    if (enabled) {
      storageService.current.initialize().catch(error => {
        console.warn('Failed to initialize storage service:', error);
        setAutoSaveState(prev => ({ ...prev, saveError: error }));
      });
    }
  }, [enabled]);
  
  // Reset arrangement existence when arrangement ID changes
  useEffect(() => {
    // Don't reset if it's a temporary ID
    if (arrangementId && !arrangementId.startsWith('new-')) {
      arrangementExistenceStore.reset(arrangementId);
    }
  }, [arrangementId]);
  
  // Perform save operation (both local and backend)
  const performSave = useCallback(async (
    saveContent: string, 
    force = false
  ): Promise<void> => {
    if (!enabled || saveInProgress.current) return;
    
    // Skip if content hasn't changed (unless forced)
    if (!force && saveContent === lastContentRef.current) {
      return;
    }
    
    saveInProgress.current = true;
    setAutoSaveState(prev => ({ 
      ...prev, 
      isAutoSaving: true, 
      saveError: null 
    }));
    
    try {
      // Save to session storage first (fast, local backup)
      await storageService.current.saveDraftToSession(
        arrangementId,
        saveContent,
        userId
      );
      
      // Save to Supabase backend periodically (every 10 seconds minimum)
      const now = new Date();
      const timeSinceLastBackendSave = lastBackendSaveRef.current 
        ? now.getTime() - lastBackendSaveRef.current.getTime()
        : Infinity;
      
      if (force || timeSinceLastBackendSave > 10000) { // 10 seconds minimum between backend saves
        try {
          const token = await getToken();
          // Only save to backend if we have auth and a real arrangement ID (not a temporary one)
          const isRealArrangement = arrangementId && 
                                   !arrangementId.startsWith('new-') && 
                                   arrangementId !== 'new-arrangement';
          
          if (token && userId && isRealArrangement && arrangementExistenceStore.exists(arrangementId)) {
            // First check if the arrangement exists before trying to update
            try {
              await arrangementService.updateArrangement(
                arrangementId,
                { chordData: saveContent }
              );
              lastBackendSaveRef.current = now;
            } catch (updateError: any) {
              // If it's a not found error, skip backend saves for this arrangement
              if (updateError?.message?.includes('not found') || updateError?.code === 'PGRST116') {
                console.log('Arrangement not found in database, marking as non-existent:', arrangementId);
                arrangementExistenceStore.markAsNonExistent(arrangementId); // Don't try again
              } else {
                // Re-throw other errors
                throw updateError;
              }
            }
          }
        } catch (backendError) {
          // Don't fail the whole save if backend fails - local is saved
          console.warn('Backend auto-save failed (local save succeeded):', backendError);
        }
      }
      
      lastContentRef.current = saveContent;
      
      setAutoSaveState(prev => ({
        ...prev,
        isAutoSaving: false,
        lastSaved: new Date(),
        saveError: null
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveState(prev => ({
        ...prev,
        isAutoSaving: false,
        saveError: error as Error
      }));
    } finally {
      saveInProgress.current = false;
    }
  }, [enabled, arrangementId, userId, getToken]);
  
  // Debounced save (wait for typing pause)
  const debouncedSave = useMemo(
    () => debounce(
      (saveContent: string) => {
        if (isDirty) {
          performSave(saveContent).catch(console.error);
        }
      },
      debounceMs
    ),
    [performSave, isDirty, debounceMs]
  );
  
  // Throttled save (regular intervals)
  const throttledSave = useMemo(
    () => throttle(
      (saveContent: string) => {
        if (isDirty) {
          performSave(saveContent).catch(console.error);
        }
      },
      throttleMs,
      { leading: false, trailing: true }
    ),
    [performSave, isDirty, throttleMs]
  );
  
  // Force save function
  const forceAutoSave = useCallback(async (): Promise<void> => {
    if (enabled && isDirty) {
      debouncedSave.cancel();
      throttledSave.cancel();
      await performSave(content, true);
    }
  }, [enabled, isDirty, content, performSave, debouncedSave, throttledSave]);
  
  // Trigger saves on content change
  useEffect(() => {
    if (enabled && isDirty) {
      debouncedSave(content);
      throttledSave(content);
    }
    
    return () => {
      debouncedSave.cancel();
      throttledSave.cancel();
    };
  }, [content, isDirty, enabled, debouncedSave, throttledSave]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      throttledSave.cancel();
    };
  }, [debouncedSave, throttledSave]);
  
  // Handle page visibility change (save when page becomes hidden)
  useEffect(() => {
    if (!enabled) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && isDirty) {
        // Page is becoming hidden, force save
        forceAutoSave().catch(console.error);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, isDirty, forceAutoSave]);
  
  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    return await storageService.current.getStorageStats();
  }, []);
  
  // Clear saved drafts
  const clearDrafts = useCallback(async (): Promise<void> => {
    if (enabled && userId) {
      await storageService.current.deleteDraft(arrangementId, userId);
      setAutoSaveState(prev => ({ ...prev, lastSaved: null }));
    }
  }, [enabled, arrangementId, userId]);
  
  return {
    // State
    isAutoSaving: autoSaveState.isAutoSaving,
    lastSaved: autoSaveState.lastSaved,
    saveError: autoSaveState.saveError,
    
    // Actions
    forceAutoSave,
    clearDrafts,
    getStorageStats,
    
    // Utils
    flush: () => {
      debouncedSave.flush();
      throttledSave.flush();
    },
    cancel: () => {
      debouncedSave.cancel();
      throttledSave.cancel();
    }
  };
}