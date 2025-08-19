/**
 * @file useAutoSave.integration.test.ts
 * @description Integration tests for ChordPro editor save functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutoSave } from '../useAutoSave';
import { arrangementService } from '@features/songs/services/arrangementService';
import { useAuth } from '@features/auth/hooks/useAuth';
import type { EditorCommand } from '../../types/command.types';

// Mock dependencies
vi.mock('@features/songs/services/arrangementService');
vi.mock('@features/auth/hooks/useAuth');
vi.mock('lodash-es', () => ({
  debounce: (fn: Function) => {
    const debounced = (...args: any[]) => fn(...args);
    debounced.cancel = vi.fn();
    debounced.flush = vi.fn(() => fn());
    return debounced;
  },
  throttle: (fn: Function) => {
    const throttled = (...args: any[]) => fn(...args);
    throttled.cancel = vi.fn();
    throttled.flush = vi.fn(() => fn());
    return throttled;
  }
}));

// Mock EditorStorageService to avoid IndexedDB issues
vi.mock('../../services/EditorStorageService', () => ({
  EditorStorageService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    saveDraftToSession: vi.fn().mockResolvedValue(undefined),
    deleteDraft: vi.fn().mockResolvedValue(undefined),
    getStorageStats: vi.fn().mockResolvedValue({ used: 0, total: 0 })
  }))
}));

describe('ChordPro Editor Save Functionality', () => {
  const mockArrangementId = 'test-arrangement-123';
  const mockUserId = 'user-456';
  const mockToken = 'auth-token-789';
  const mockContent = '{title: Test Song}\n{key: C}\n[C]This is a [G]test song';
  const mockHistory: EditorCommand[] = [];

  beforeEach(() => {
    // Setup auth mock
    vi.mocked(useAuth).mockReturnValue({
      getToken: vi.fn().mockResolvedValue(mockToken),
      userId: mockUserId,
      isSignedIn: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      loading: false,
      error: null
    });

    // Setup arrangement service mock
    vi.mocked(arrangementService.updateArrangement).mockResolvedValue({
      id: mockArrangementId,
      name: 'Test Arrangement',
      slug: 'test-arrangement',
      chordProText: mockContent,
      createdBy: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Auto-Save to MongoDB', () => {
    it('should save to MongoDB after 10+ seconds when content changes', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          history: mockHistory,
          isDirty: true,
          userId: mockUserId,
          enabled: true,
          debounceMs: 100, // Fast for testing
          throttleMs: 200
        })
      );

      // Wait for debounced save
      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalled();
      }, { timeout: 300 });

      // Verify MongoDB save was attempted
      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalledWith(
          mockArrangementId,
          { chordProText: mockContent },
          mockToken,
          mockUserId
        );
      }, { timeout: 500 });

      // Check save state
      expect(result.current.lastSaved).toBeTruthy();
      expect(result.current.saveError).toBeNull();
    });

    it('should not save to MongoDB for new arrangements', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          arrangementId: 'new-arrangement',
          content: mockContent,
          history: mockHistory,
          isDirty: true,
          userId: mockUserId,
          enabled: true,
          debounceMs: 100
        })
      );

      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalled();
      }, { timeout: 300 });

      // MongoDB save should NOT be called for new arrangements
      expect(arrangementService.updateArrangement).not.toHaveBeenCalled();
    });

    it('should handle backend save failures gracefully', async () => {
      // Mock backend failure
      vi.mocked(arrangementService.updateArrangement).mockRejectedValue(
        new Error('Network error')
      );

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useAutoSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          history: mockHistory,
          isDirty: true,
          userId: mockUserId,
          enabled: true,
          debounceMs: 100
        })
      );

      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalled();
      }, { timeout: 300 });

      // Should log warning but not throw
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Backend auto-save failed'),
        expect.any(Error)
      );

      // Local save should still succeed
      expect(result.current.lastSaved).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it('should throttle backend saves to every 10 seconds minimum', async () => {
      const { rerender } = renderHook(
        ({ content }) =>
          useAutoSave({
            arrangementId: mockArrangementId,
            content,
            history: mockHistory,
            isDirty: true,
            userId: mockUserId,
            enabled: true,
            debounceMs: 50,
            throttleMs: 100
          }),
        { initialProps: { content: mockContent } }
      );

      // First save
      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });

      // Clear mock to track new calls
      vi.mocked(arrangementService.updateArrangement).mockClear();

      // Update content immediately
      rerender({ content: mockContent + '\n[Am]New line' });

      // Should NOT save to MongoDB immediately (within 10 seconds)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(arrangementService.updateArrangement).not.toHaveBeenCalled();
    });
  });

  describe('Force Save Functionality', () => {
    it('should force save immediately when requested', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          history: mockHistory,
          isDirty: true,
          userId: mockUserId,
          enabled: true
        })
      );

      // Force save
      await act(async () => {
        await result.current.forceAutoSave();
      });

      expect(arrangementService.updateArrangement).toHaveBeenCalledWith(
        mockArrangementId,
        { chordProText: mockContent },
        mockToken,
        mockUserId
      );
    });
  });

  describe('Page Visibility Save', () => {
    it('should save when page becomes hidden', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          history: mockHistory,
          isDirty: true,
          userId: mockUserId,
          enabled: true
        })
      );

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true
      });

      const event = new Event('visibilitychange');
      document.dispatchEvent(event);

      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalled();
      });
    });
  });

  describe('Save State Indicators', () => {
    it('should indicate saving state correctly', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          history: mockHistory,
          isDirty: true,
          userId: mockUserId,
          enabled: true,
          debounceMs: 50
        })
      );

      // Initially not saving
      expect(result.current.isAutoSaving).toBe(false);

      // Wait for save to start
      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalled();
      });

      // After save completes
      await waitFor(() => {
        expect(result.current.isAutoSaving).toBe(false);
        expect(result.current.lastSaved).toBeTruthy();
      });
    });

    it('should not save when content has not changed', async () => {
      const { rerender } = renderHook(
        ({ isDirty }) =>
          useAutoSave({
            arrangementId: mockArrangementId,
            content: mockContent,
            history: mockHistory,
            isDirty,
            userId: mockUserId,
            enabled: true,
            debounceMs: 50
          }),
        { initialProps: { isDirty: false } }
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not save when not dirty
      expect(arrangementService.updateArrangement).not.toHaveBeenCalled();

      // Mark as dirty
      rerender({ isDirty: true });

      // Now should save
      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Handling', () => {
    it('should not save to backend without authentication', async () => {
      // Mock no auth
      vi.mocked(useAuth).mockReturnValue({
        getToken: vi.fn().mockResolvedValue(null),
        userId: null,
        isSignedIn: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
        loading: false,
        error: null
      });

      renderHook(() =>
        useAutoSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          history: mockHistory,
          isDirty: true,
          enabled: true,
          debounceMs: 50
        })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should save locally but not to backend
      expect(sessionStorage.setItem).toHaveBeenCalled();
      expect(arrangementService.updateArrangement).not.toHaveBeenCalled();
    });
  });

  describe('Clear Drafts', () => {
    it('should clear drafts when requested', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          history: mockHistory,
          isDirty: false,
          userId: mockUserId,
          enabled: true
        })
      );

      await act(async () => {
        await result.current.clearDrafts();
      });

      // Check that lastSaved is cleared
      expect(result.current.lastSaved).toBeNull();
    });
  });
});