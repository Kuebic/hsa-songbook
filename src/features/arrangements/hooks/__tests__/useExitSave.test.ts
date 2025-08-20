/**
 * @file useExitSave.test.ts
 * @description Tests for exit save functionality (unmount, page unload, etc.)
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useExitSave } from '../useExitSave';
import { arrangementService } from '@features/songs/services/arrangementService';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useNotification } from '@shared/components/notifications/useNotification';

// Mock dependencies with factory functions
vi.mock('@features/songs/services/arrangementService', () => ({
  arrangementService: {
    updateArrangement: vi.fn()
  }
}))
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))
vi.mock('@shared/components/notifications/useNotification', () => ({
  useNotification: vi.fn()
}))

describe('useExitSave - Exit Save Functionality', () => {
  const mockArrangementId = 'test-arrangement-123';
  const mockUserId = 'user-456';
  const mockToken = 'auth-token-789';
  const mockContent = '{title: Test Song}\n[C]Test content';
  
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  let mockGetToken: any
  let mockUpdateArrangement: any
  let mockAddNotification: any
  
  beforeEach(async () => {
    const { useAuth } = await import('@features/auth/hooks/useAuth')
    const { arrangementService } = await import('@features/songs/services/arrangementService')
    const { useNotification } = await import('@shared/components/notifications/useNotification')
    
    mockGetToken = vi.fn().mockResolvedValue(mockToken)
    mockUpdateArrangement = vi.fn()
    mockAddNotification = vi.fn()
    
    // Setup auth mock
    vi.mocked(useAuth).mockReturnValue({
      getToken: mockGetToken,
      userId: mockUserId,
      isSignedIn: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      loading: false,
      error: null
    });

    // Setup notification mock
    vi.mocked(useNotification).mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: vi.fn(),
      notifications: []
    });

    // Setup arrangement service mock
    arrangementService.updateArrangement = mockUpdateArrangement
    mockUpdateArrangement.mockResolvedValue({
      id: mockArrangementId,
      name: 'Test Arrangement',
      slug: 'test-arrangement',
      chordProText: mockContent,
      createdBy: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Spy on window event listeners
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    // Mock navigator.sendBeacon
    Object.defineProperty(navigator, 'sendBeacon', {
      writable: true,
      value: vi.fn().mockReturnValue(true)
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('Component Unmount Save', () => {
    it('should save on component unmount when dirty', async () => {
      const { unmount } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Unmount the component
      unmount();

      // Should attempt to save
      expect(mockUpdateArrangement).toHaveBeenCalledWith(
        mockArrangementId,
        { chordProText: mockContent },
        mockToken,
        mockUserId
      );
    });

    it('should not save on unmount when not dirty', () => {
      const { unmount } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: false,
          enabled: true
        })
      );

      unmount();

      // Should not save when not dirty
      expect(mockUpdateArrangement).not.toHaveBeenCalled();
    });

    it('should not save on unmount when disabled', () => {
      const { unmount } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: false
        })
      );

      unmount();

      // Should not save when disabled
      expect(mockUpdateArrangement).not.toHaveBeenCalled();
    });
  });

  describe('Page Unload Save', () => {
    it('should set up beforeunload handler', () => {
      renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'pagehide',
        expect.any(Function)
      );
    });

    it('should prevent unload and save when dirty', async () => {
      renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Create and dispatch beforeunload event
      const event = new Event('beforeunload') as BeforeUnloadEvent;
      Object.defineProperty(event, 'preventDefault', {
        value: vi.fn(),
        writable: true
      });
      Object.defineProperty(event, 'returnValue', {
        value: '',
        writable: true
      });

      window.dispatchEvent(event);

      // Should prevent default (show confirmation)
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.returnValue).toBe('You have unsaved changes. Are you sure you want to leave?');

      // Should attempt to save
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockUpdateArrangement).toHaveBeenCalled();
    });

    it('should handle pagehide event for mobile browsers', async () => {
      renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Dispatch pagehide event
      const event = new Event('pagehide');
      window.dispatchEvent(event);

      // Should use sendBeacon if available
      expect(navigator.sendBeacon).toHaveBeenCalled();
    });

    it('should fallback to regular save if sendBeacon fails', async () => {
      // Mock sendBeacon failure
      vi.mocked(navigator.sendBeacon).mockReturnValue(false);

      renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Dispatch pagehide event
      const event = new Event('pagehide');
      window.dispatchEvent(event);

      // Should fallback to regular save
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockUpdateArrangement).toHaveBeenCalled();
    });
  });

  describe('Manual Save', () => {
    it('should provide saveNow function for manual saves', async () => {
      const { result } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Call manual save
      await act(async () => {
        await result.current.saveNow();
      });

      expect(mockUpdateArrangement).toHaveBeenCalledWith(
        mockArrangementId,
        { chordProText: mockContent },
        mockToken,
        mockUserId
      );
    });

    it('should indicate needsSave correctly', () => {
      const { result, rerender } = renderHook(
        ({ isDirty }) =>
          useExitSave({
            arrangementId: mockArrangementId,
            content: mockContent,
            isDirty,
            enabled: true
          }),
        { initialProps: { isDirty: false } }
      );

      // Initially no need to save
      expect(result.current.needsSave).toBe(false);

      // Mark as dirty
      rerender({ isDirty: true });

      // Now needs save
      expect(result.current.needsSave).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors and show notification', async () => {
      const mockError = new Error('Network error');
      mockUpdateArrangement.mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Try to save
      await act(async () => {
        try {
          await result.current.saveNow();
        } catch (_e) {
          // Expected to throw
        }
      });

      // Should show error notification
      expect(useNotification().addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Save Failed',
        message: expect.stringContaining('Unable to save to server')
      });

      // Should have error in state
      expect(result.current.lastSaveError).toEqual(mockError);
    });

    it('should not save without authentication', async () => {
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

      const { result } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Try to save
      await act(async () => {
        try {
          await result.current.saveNow();
        } catch (_e) {
          // Expected to throw
        }
      });

      // Should not call arrangement service
      expect(mockUpdateArrangement).not.toHaveBeenCalled();
    });
  });

  describe('Success Callbacks', () => {
    it('should call onSaveSuccess when save succeeds', async () => {
      const onSaveSuccess = vi.fn();
      const onSaveError = vi.fn();

      const { result } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true,
          onSaveSuccess,
          onSaveError
        })
      );

      await act(async () => {
        await result.current.saveNow();
      });

      expect(onSaveSuccess).toHaveBeenCalled();
      expect(onSaveError).not.toHaveBeenCalled();
    });

    it('should call onSaveError when save fails', async () => {
      const mockError = new Error('Save failed');
      mockUpdateArrangement.mockRejectedValue(mockError);

      const onSaveSuccess = vi.fn();
      const onSaveError = vi.fn();

      const { result } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true,
          onSaveSuccess,
          onSaveError
        })
      );

      await act(async () => {
        try {
          await result.current.saveNow();
        } catch (_e) {
          // Expected
        }
      });

      expect(onSaveError).toHaveBeenCalledWith(mockError);
      expect(onSaveSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Save State Management', () => {
    it('should track saving state', async () => {
      // Make save take some time
      mockUpdateArrangement.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: mockArrangementId,
          name: 'Test',
          slug: 'test',
          chordProText: mockContent,
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        }), 100))
      );

      const { result } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: true,
          enabled: true
        })
      );

      // Initially not saving
      expect(result.current.isSaving).toBe(false);

      // Start save
      const savePromise = act(async () => {
        await result.current.saveNow();
      });

      // Should be saving
      expect(result.current.isSaving).toBe(true);

      // Wait for save to complete
      await savePromise;

      // Should no longer be saving
      expect(result.current.isSaving).toBe(false);
    });

    it('should clear error state', () => {
      const { result } = renderHook(() =>
        useExitSave({
          arrangementId: mockArrangementId,
          content: mockContent,
          isDirty: false,
          enabled: true
        })
      );

      // Set an error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.lastSaveError).toBeNull();
    });
  });
});