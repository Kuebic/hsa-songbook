/**
 * @file ChordProEditor.save.test.tsx
 * @description Tests for ChordPro editor save functionality (button and Ctrl+S)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChordProEditor } from '../index';
import { useAuth } from '@features/auth/hooks/useAuth';
import { arrangementService } from '@features/songs/services/arrangementService';

// Mock dependencies
vi.mock('@features/auth/hooks/useAuth');
vi.mock('@features/songs/services/arrangementService');
vi.mock('@shared/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() })
}));

// Mock the hooks that are complex
vi.mock('../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop'
  })
}));

vi.mock('../hooks/useVirtualKeyboard', () => ({
  useVirtualKeyboard: () => ({ isKeyboardVisible: false })
}));

vi.mock('../hooks/useMobileAutocomplete', () => ({
  useMobileAutocomplete: () => ({
    items: [],
    selectedIndex: -1,
    anchorEl: null,
    isOpen: false,
    isSearching: false,
    handleInput: vi.fn(),
    handleKeyDown: vi.fn(() => false),
    handleItemSelect: vi.fn(),
    closeAutocomplete: vi.fn()
  })
}));

vi.mock('../hooks/useBracketCompletion', () => ({
  useBracketCompletion: () => ({
    handleKeyDown: vi.fn(() => false),
    handleBeforeInput: vi.fn(() => false)
  })
}));

vi.mock('../../hooks/useUnifiedChordRenderer', () => ({
  useUnifiedChordRenderer: () => ({
    renderChordSheet: vi.fn((content) => `<div>${content}</div>`),
    preferences: {
      fontSize: 16,
      fontFamily: 'Arial',
      theme: 'light',
      chordColor: '#000',
      lyricColor: '#333',
      lineHeight: 1.5
    },
    updatePreferences: vi.fn(),
    resetPreferences: vi.fn()
  })
}));

describe('ChordProEditor Save Functionality', () => {
  const mockArrangementId = 'test-123';
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockInitialContent = '{title: Test Song}\n[C]This is a test';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup auth mock
    vi.mocked(useAuth).mockReturnValue({
      getToken: vi.fn().mockResolvedValue('mock-token'),
      userId: 'user-123',
      isSignedIn: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      loading: false,
      error: null
    });

    // Setup arrangement service mock
    vi.mocked(arrangementService.updateArrangement).mockResolvedValue({
      id: mockArrangementId,
      name: 'Test',
      slug: 'test',
      chordProText: mockInitialContent,
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  describe('Save Button', () => {
    it('should render save button', () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeInTheDocument();
    });

    it('should disable save button when no changes', () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveAttribute('title', 'No changes to save');
    });

    it('should enable save button when content changes', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');
      const saveButton = screen.getByRole('button', { name: /save/i });

      // Type new content
      await userEvent.type(textarea, '\n[G]New line');

      // Save button should be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
        expect(saveButton).toHaveAttribute('title', 'Save changes (Ctrl+S)');
      });
    });

    it('should save to MongoDB when save button clicked', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');
      const saveButton = screen.getByRole('button', { name: /save/i });

      // Make changes
      await userEvent.type(textarea, '\n[G]New content');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      // Click save
      await userEvent.click(saveButton);

      // Should call MongoDB save
      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalled();
      });

      // Should call onSave callback
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should show visual feedback during save', async () => {
      // Make the save take some time
      vi.mocked(arrangementService.updateArrangement).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: mockArrangementId,
          name: 'Test',
          slug: 'test',
          chordProText: mockInitialContent,
          createdBy: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }), 100))
      );

      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');
      const saveButton = screen.getByRole('button', { name: /save/i });

      // Make changes
      await userEvent.type(textarea, '\nNew content');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      // Click save
      await userEvent.click(saveButton);

      // Check for saving indicator
      const savingIndicator = await screen.findByText(/saving/i);
      expect(savingIndicator).toBeInTheDocument();

      // Wait for save to complete
      await waitFor(() => {
        expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
      }, { timeout: 200 });

      // Should show saved message
      const savedIndicator = screen.getByText(/saved/i);
      expect(savedIndicator).toBeInTheDocument();
    });
  });

  describe('Ctrl+S Keyboard Shortcut', () => {
    it('should save when Ctrl+S is pressed', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Make changes
      await userEvent.type(textarea, '\n[Am]Another line');

      // Press Ctrl+S
      fireEvent.keyDown(textarea, {
        key: 's',
        code: 'KeyS',
        ctrlKey: true
      });

      // Should save to MongoDB
      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalled();
      });

      // Should call onSave callback
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should save when Cmd+S is pressed (Mac)', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Make changes
      await userEvent.type(textarea, '\n[Am]Another line');

      // Press Cmd+S
      fireEvent.keyDown(textarea, {
        key: 's',
        code: 'KeyS',
        metaKey: true
      });

      // Should save to MongoDB
      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalled();
      });

      // Should call onSave callback
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should not save when no changes with Ctrl+S', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Press Ctrl+S without changes
      fireEvent.keyDown(textarea, {
        key: 's',
        code: 'KeyS',
        ctrlKey: true
      });

      // Should still call onSave but not MongoDB
      expect(mockOnSave).toHaveBeenCalled();
      expect(arrangementService.updateArrangement).not.toHaveBeenCalled();
    });
  });

  describe('Back Button', () => {
    it('should render back button when onCancel provided', () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onCancel={mockOnCancel}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should call onCancel when back button clicked', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onCancel={mockOnCancel}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      await userEvent.click(backButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Auto-Save Integration', () => {
    it('should auto-save after typing stops', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Type content
      await userEvent.type(textarea, '\n[F]Auto save test');

      // Wait for auto-save (debounced)
      await waitFor(() => {
        expect(arrangementService.updateArrangement).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show auto-save indicator', async () => {
      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Type content
      await userEvent.type(textarea, '\n[F]Auto save test');

      // Should show saving indicator
      const savingIndicator = await screen.findByText(/saving/i);
      expect(savingIndicator).toBeInTheDocument();

      // Should show saved time after completion
      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle save errors gracefully', async () => {
      // Mock save failure
      vi.mocked(arrangementService.updateArrangement).mockRejectedValue(
        new Error('Network error')
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ChordProEditor
          arrangementId={mockArrangementId}
          initialContent={mockInitialContent}
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');
      const saveButton = screen.getByRole('button', { name: /save/i });

      // Make changes
      await userEvent.type(textarea, '\nNew content');

      // Wait for button to be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      // Click save
      await userEvent.click(saveButton);

      // Should log error
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Save failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should not save new arrangements to MongoDB', async () => {
      render(
        <ChordProEditor
          arrangementId="new-arrangement"
          initialContent=""
          onSave={mockOnSave}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Type content
      await userEvent.type(textarea, '{title: New Song}\n[C]New song content');

      // Wait a bit for auto-save
      await waitFor(() => {
        // Should not call MongoDB for new arrangements
        expect(arrangementService.updateArrangement).not.toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });
});