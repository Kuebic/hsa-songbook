import { useState, useEffect, useCallback, useRef } from 'react';
import { EditorStorageService } from '../services/EditorStorageService';
import type { EditorCommand } from '../types/command.types';

interface DraftData {
  content: string;
  history: EditorCommand[];
  timestamp: number;
}

interface UseSessionRecoveryOptions {
  arrangementId: string;
  userId?: string;
  enabled?: boolean;
}

interface RecoveryState {
  isChecking: boolean;
  hasDraft: boolean;
  draftData: DraftData | null;
  error: Error | null;
}

export function useSessionRecovery({
  arrangementId,
  userId,
  enabled = true
}: UseSessionRecoveryOptions) {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isChecking: true,
    hasDraft: false,
    draftData: null,
    error: null
  });
  
  const storageService = useRef(new EditorStorageService());
  
  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) {
      setRecoveryState({
        isChecking: false,
        hasDraft: false,
        draftData: null,
        error: null
      });
      return;
    }
    
    const checkForDraft = async () => {
      setRecoveryState(prev => ({ ...prev, isChecking: true, error: null }));
      
      try {
        // Initialize storage service
        await storageService.current.initialize();
        
        // Check if draft exists
        const hasDraft = await storageService.current.hasDraft(arrangementId, userId);
        
        if (hasDraft) {
          // Load draft data
          const draftData = await storageService.current.loadDraftFromSession(arrangementId, userId);
          
          if (draftData) {
            setRecoveryState({
              isChecking: false,
              hasDraft: true,
              draftData: {
                content: draftData.content,
                history: draftData.history,
                timestamp: draftData.timestamp
              },
              error: null
            });
            return;
          }
        }
        
        // No draft found
        setRecoveryState({
          isChecking: false,
          hasDraft: false,
          draftData: null,
          error: null
        });
        
      } catch (error) {
        console.error('Failed to check for draft:', error);
        setRecoveryState({
          isChecking: false,
          hasDraft: false,
          draftData: null,
          error: error as Error
        });
      }
    };
    
    checkForDraft();
  }, [arrangementId, userId, enabled]);
  
  // Recover draft data
  const recoverDraft = useCallback((): DraftData | null => {
    return recoveryState.draftData;
  }, [recoveryState.draftData]);
  
  // Discard draft
  const discardDraft = useCallback(async (): Promise<void> => {
    if (!enabled) return;
    
    try {
      await storageService.current.deleteDraft(arrangementId, userId);
      setRecoveryState({
        isChecking: false,
        hasDraft: false,
        draftData: null,
        error: null
      });
    } catch (error) {
      console.error('Failed to discard draft:', error);
      setRecoveryState(prev => ({ 
        ...prev, 
        error: error as Error 
      }));
      throw error;
    }
  }, [enabled, arrangementId, userId]);
  
  // Accept draft and clear recovery state
  const acceptDraft = useCallback(() => {
    setRecoveryState(prev => ({ 
      ...prev, 
      hasDraft: false,
      draftData: null 
    }));
  }, []);
  
  // Get formatted time for display
  const getDraftAge = useCallback((): string | null => {
    if (!recoveryState.draftData) return null;
    
    const now = Date.now();
    const draftTime = recoveryState.draftData.timestamp;
    const diffMs = now - draftTime;
    
    // Convert to human-readable format
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }, [recoveryState.draftData]);
  
  // Get draft content preview (first 100 characters)
  const getDraftPreview = useCallback((): string | null => {
    if (!recoveryState.draftData) return null;
    
    const content = recoveryState.draftData.content;
    if (content.length <= 100) {
      return content;
    }
    
    return content.substring(0, 97) + '...';
  }, [recoveryState.draftData]);
  
  // Manually refresh draft check
  const refreshDraftCheck = useCallback(async (): Promise<void> => {
    if (!enabled) return;
    
    setRecoveryState(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const hasDraft = await storageService.current.hasDraft(arrangementId, userId);
      
      if (hasDraft) {
        const draftData = await storageService.current.loadDraftFromSession(arrangementId, userId);
        
        if (draftData) {
          setRecoveryState({
            isChecking: false,
            hasDraft: true,
            draftData: {
              content: draftData.content,
              history: draftData.history,
              timestamp: draftData.timestamp
            },
            error: null
          });
          return;
        }
      }
      
      setRecoveryState({
        isChecking: false,
        hasDraft: false,
        draftData: null,
        error: null
      });
      
    } catch (error) {
      console.error('Failed to refresh draft check:', error);
      setRecoveryState(prev => ({ 
        ...prev, 
        isChecking: false,
        error: error as Error 
      }));
    }
  }, [enabled, arrangementId, userId]);
  
  return {
    // State
    isChecking: recoveryState.isChecking,
    hasDraft: recoveryState.hasDraft,
    draftData: recoveryState.draftData,
    error: recoveryState.error,
    
    // Actions
    recoverDraft,
    discardDraft,
    acceptDraft,
    refreshDraftCheck,
    
    // Utils
    getDraftAge,
    getDraftPreview,
    
    // Raw data for advanced usage
    rawDraftData: recoveryState.draftData
  };
}