import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { throttle, debounce } from 'lodash-es';
import { EditorStorageService } from '../services/EditorStorageService';
import { arrangementService } from '@features/songs/services/arrangementService';
import { useAuth } from '@features/auth/hooks/useAuth';
import type { EditorCommand } from '../types/command.types';

interface UseAutoSaveOptions {
  arrangementId: string;
  content: string;
  history: EditorCommand[];
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
  history,
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
  const lastHistoryRef = useRef(history);
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
  
  // Perform save operation (both local and backend)
  const performSave = useCallback(async (
    saveContent: string, 
    saveHistory: EditorCommand[], 
    force = false
  ): Promise<void> => {
    if (!enabled || saveInProgress.current) return;
    
    // Skip if content hasn't changed (unless forced)
    if (!force && saveContent === lastContentRef.current && saveHistory === lastHistoryRef.current) {
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
        saveHistory,
        userId
      );
      
      // Save to MongoDB backend periodically (every 10 seconds minimum)
      const now = new Date();
      const timeSinceLastBackendSave = lastBackendSaveRef.current 
        ? now.getTime() - lastBackendSaveRef.current.getTime()
        : Infinity;
      
      if (force || timeSinceLastBackendSave > 10000) { // 10 seconds minimum between backend saves
        try {
          const token = await getToken();
          if (token && userId && arrangementId !== 'new-arrangement') {
            // Only save to backend if we have auth and a real arrangement ID
            await arrangementService.updateArrangement(
              arrangementId,
              { chordProText: saveContent },
              token,
              userId
            );
            lastBackendSaveRef.current = now;
          }
        } catch (backendError) {
          // Don't fail the whole save if backend fails - local is saved
          console.warn('Backend auto-save failed (local save succeeded):', backendError);
        }
      }
      
      lastContentRef.current = saveContent;
      lastHistoryRef.current = saveHistory;
      
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
      (saveContent: string, saveHistory: EditorCommand[]) => {
        if (isDirty) {
          performSave(saveContent, saveHistory).catch(console.error);
        }
      },
      debounceMs
    ),
    [performSave, isDirty, debounceMs]
  );
  
  // Throttled save (regular intervals)
  const throttledSave = useMemo(
    () => throttle(
      (saveContent: string, saveHistory: EditorCommand[]) => {
        if (isDirty) {
          performSave(saveContent, saveHistory).catch(console.error);
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
      await performSave(content, history, true);
    }
  }, [enabled, isDirty, content, history, performSave, debouncedSave, throttledSave]);
  
  // Trigger saves on content/history change
  useEffect(() => {
    if (enabled && isDirty) {
      debouncedSave(content, history);
      throttledSave(content, history);
    }
    
    return () => {
      debouncedSave.cancel();
      throttledSave.cancel();
    };
  }, [content, history, isDirty, enabled, debouncedSave, throttledSave]);
  
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