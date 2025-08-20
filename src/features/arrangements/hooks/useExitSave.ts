import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useNotification } from '@shared/components/notifications/useNotification';
import { arrangementService } from '@features/songs/services/arrangementService';
import { EditorStorageService } from '../services/EditorStorageService';
import { arrangementExistenceStore } from '../stores/arrangementExistenceStore';

interface UseExitSaveOptions {
  arrangementId: string;
  content: string;
  isDirty: boolean;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

interface ExitSaveState {
  isSaving: boolean;
  lastSaveError: Error | null;
}

export function useExitSave({
  arrangementId,
  content,
  isDirty,
  enabled = true,
  onSaveSuccess,
  onSaveError
}: UseExitSaveOptions) {
  const { getToken, userId } = useAuth();
  const { addNotification } = useNotification();
  const [exitSaveState, setExitSaveState] = useState<ExitSaveState>({
    isSaving: false,
    lastSaveError: null
  });
  
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const storageService = useRef(new EditorStorageService());
  const hasTriedSaveRef = useRef(false);
  
  // Initialize storage service
  useEffect(() => {
    storageService.current.initialize().catch(console.error);
  }, []);
  
  // Perform exit save to Supabase
  const performExitSave = useCallback(async (): Promise<void> => {
    if (!enabled || !isDirty || savePromiseRef.current) {
      return;
    }
    
    // Prevent multiple simultaneous saves
    savePromiseRef.current = (async () => {
      setExitSaveState(prev => ({ ...prev, isSaving: true, lastSaveError: null }));
      
      try {
        const token = await getToken();
        if (!token || !userId) {
          throw new Error('Authentication required for saving');
        }
        
        // Check if this is a real arrangement ID (not a temporary one)
        const isRealArrangement = arrangementId && 
                                 !arrangementId.startsWith('new-') && 
                                 arrangementId !== 'new-arrangement';
        
        if (isRealArrangement && arrangementExistenceStore.exists(arrangementId)) {
          // Try to save to Supabase
          try {
            await arrangementService.updateArrangement(
              arrangementId,
              { chordData: content }
            );
            
            // Clear session draft after successful save
            try {
              await storageService.current.deleteDraft(arrangementId, userId);
            } catch (cleanupError) {
              console.warn('Failed to cleanup draft after save:', cleanupError);
              // Don't throw - the main save succeeded
            }
          } catch (updateError: any) {
            // If it's a not found error, mark it and treat it like a new arrangement
            if (updateError?.message?.includes('not found') || updateError?.code === 'PGRST116') {
              console.log('Arrangement not found in database, marking as non-existent:', arrangementId);
              arrangementExistenceStore.markAsNonExistent(arrangementId);
              // Don't throw - content is saved locally
            } else {
              // Re-throw other errors
              throw updateError;
            }
          }
        } else {
          // For new arrangements or non-existent ones, only save locally
          const reason = !isRealArrangement ? 'new arrangement' : 'non-existent arrangement';
          console.log(`Skipping backend save for ${reason}:`, arrangementId);
        }
        
        setExitSaveState(prev => ({ ...prev, isSaving: false, lastSaveError: null }));
        
        // Show success notification
        if (isRealArrangement) {
          addNotification({
            type: 'success',
            title: 'Saved',
            message: 'Changes saved successfully'
          });
        } else {
          addNotification({
            type: 'info',
            title: 'Draft Saved',
            message: 'Your changes are saved locally. Create the arrangement to save to the server.'
          });
        }
        
        onSaveSuccess?.();
        
      } catch (error) {
        const saveError = error as Error;
        setExitSaveState(prev => ({ ...prev, isSaving: false, lastSaveError: saveError }));
        
        console.error('Exit save failed:', saveError);
        
        // Show error notification but mention local backup
        addNotification({
          type: 'error',
          title: 'Save Failed',
          message: 'Unable to save to server. Your changes are saved locally and will be recovered when you return.'
        });
        
        onSaveError?.(saveError);
        throw saveError;
      } finally {
        savePromiseRef.current = null;
      }
    })();
    
    return savePromiseRef.current;
  }, [
    enabled, 
    isDirty, 
    arrangementId, 
    content, 
    getToken, 
    userId, 
    addNotification, 
    onSaveSuccess, 
    onSaveError
  ]);
  
  // Attempt to save using sendBeacon for better reliability on page unload
  const performExitSaveWithBeacon = useCallback(async (): Promise<void> => {
    if (!enabled || !isDirty || !navigator.sendBeacon) {
      throw new Error('Beacon not available');
    }
    
    try {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error('Authentication required');
      }
      
      const data = JSON.stringify({
        chordData: content
      });
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = `/api/v1/arrangements/${arrangementId}`;
      
      // Note: sendBeacon has limitations - can't set custom headers easily
      // This is a best-effort attempt; the regular save method is more reliable
      const success = navigator.sendBeacon(url, blob);
      
      if (!success) {
        throw new Error('Beacon failed to queue');
      }
    } catch (error) {
      console.warn('Beacon save failed:', error);
      throw error;
    }
  }, [enabled, isDirty, getToken, userId, content, arrangementId]);
  
  // Handle browser close/refresh
  useEffect(() => {
    if (!enabled) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !hasTriedSaveRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Attempt to save (may not complete due to browser limits)
        hasTriedSaveRef.current = true;
        performExitSave().catch(console.error);
      }
    };
    
    // Handle page hide (more reliable than beforeunload)
    const handlePageHide = () => {
      if (isDirty && !hasTriedSaveRef.current) {
        hasTriedSaveRef.current = true;
        // Use sendBeacon for more reliable saving on page hide
        performExitSaveWithBeacon().catch(() => {
          // Fallback to regular save
          performExitSave().catch(console.error);
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isDirty, enabled, performExitSave, performExitSaveWithBeacon]);
  
  // Handle component unmount
  useEffect(() => {
    return () => {
      if (enabled && isDirty && !hasTriedSaveRef.current) {
        hasTriedSaveRef.current = true;
        // Fire and forget - component is unmounting
        performExitSave().catch(console.error);
      }
    };
  }, [enabled, isDirty, performExitSave]);
  
  // Reset tried save flag when content becomes clean
  useEffect(() => {
    if (!isDirty) {
      hasTriedSaveRef.current = false;
    }
  }, [isDirty]);
  
  // Manual save function
  const saveNow = useCallback(async (): Promise<void> => {
    if (enabled && isDirty) {
      await performExitSave();
    }
  }, [enabled, isDirty, performExitSave]);
  
  // Check if save is needed
  const needsSave = enabled && isDirty && !exitSaveState.isSaving;
  
  return {
    // State
    isSaving: exitSaveState.isSaving,
    lastSaveError: exitSaveState.lastSaveError,
    needsSave,
    
    // Actions
    performExitSave,
    saveNow,
    
    // Utils
    clearError: () => setExitSaveState(prev => ({ ...prev, lastSaveError: null }))
  };
}