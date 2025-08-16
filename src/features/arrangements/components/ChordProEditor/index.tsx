import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { PreviewPane } from './PreviewPane';
import { ChordProTextArea } from './ChordProTextArea';
import { MobileToggle } from './components/MobileToggle';
import { EditorSplitter } from './components/EditorSplitter';
import { AutoCompleteDropdown } from './components/AutoCompleteDropdown';
import { AlignmentDebugger } from './components/AlignmentDebugger';
import { TransposeBar } from './TransposeBar';
import { FontPreferences } from '../FontPreferences';
import { useEnhancedEditorState } from '../../hooks/useEnhancedEditorState';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useExitSave } from '../../hooks/useExitSave';
import { useSessionRecovery } from '../../hooks/useSessionRecovery';
import { RecoveryDialog } from './RecoveryDialog';
import { ReplaceTextCommand } from '../../commands/text/ReplaceTextCommand';
import { useAuth } from '@features/auth';
import { useTheme } from '@shared/contexts/ThemeContext';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';
import { useMobileAutocomplete } from './hooks/useMobileAutocomplete';
import { useBracketCompletion } from './hooks/useBracketCompletion';
import { useEditorTransposition } from './hooks/useEditorTransposition';
import { getBrowserSpecificStyles } from './utils/browserDetection';
import './styles/themes.css';
import './styles/editor.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/preview.css';
import './styles/alignment.css';
import './styles/autocomplete.css';
import '../../styles/transpose.css';

export interface ChordProEditorProps {
  arrangementId: string; // Required for undo-redo storage
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  height?: number | string;
  showPreview?: boolean;
  defaultPreviewVisible?: boolean;
  autoFocus?: boolean;
  enableChordCompletion?: boolean;
  enableTransposition?: boolean;
  className?: string;
}

export const ChordProEditor: React.FC<ChordProEditorProps> = ({
  arrangementId,
  initialContent = '',
  onChange,
  onSave,
  height = 600,
  showPreview = true,
  defaultPreviewVisible = true,
  autoFocus = false,
  enableTransposition = true,
  className = '',
}) => {
  // Remove the old textareaRef as we'll use the one from enhanced state
  const syntaxRef = useRef<HTMLDivElement | null>(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [previewVisible, setPreviewVisible] = useState(defaultPreviewVisible);
  
  // Debug mode - set to true to see red text overlay for alignment checking
  const [debugMode] = useState(false); // Set to true for debugging text alignment
  const [showAlignmentDebugger] = useState(false); // Set to true for alignment grid
  
  // Use global theme context and responsive layout
  const { theme: currentTheme } = useTheme();
  const layout = useResponsiveLayout();
  
  // Use text alignment hook for perfect sync
  // Note: alignment is now handled entirely through CSS
  
  // Use virtual keyboard detection for mobile
  const { isKeyboardVisible } = useVirtualKeyboard();
  
  // Log keyboard visibility for debugging
  useEffect(() => {
    if (isKeyboardVisible) {
      console.log('Virtual keyboard is visible');
    }
  }, [isKeyboardVisible]);

  // Apply browser-specific styles for perfect alignment
  useEffect(() => {
    const browserStyles = getBrowserSpecificStyles();
    
    // Apply to textarea
    if (textareaRef.current) {
      Object.assign(textareaRef.current.style, browserStyles);
    }
    
    // Apply to syntax highlighter
    if (syntaxRef.current) {
      const syntaxHighlighter = syntaxRef.current.querySelector('.syntax-highlighter') as HTMLElement;
      if (syntaxHighlighter) {
        Object.assign(syntaxHighlighter.style, browserStyles);
      }
    }
  }, []);
  
  // Get auth info for storage
  const { userId } = useAuth();
  
  // Enhanced editor state with undo/redo support
  const {
    content,
    isDirty,
    cursorPosition,
    // selectionRange, // Unused for now
    debouncedContent,
    canUndo,
    canRedo,
    executeCommand,
    undo,
    redo,
    updateContent,
    handleCursorPositionChange,
    handleSelectionRangeChange,
    textareaRef,
    getHistory,
    clearHistory
  } = useEnhancedEditorState({
    initialContent,
    arrangementId,
    onChange
  });

  // Auto-save functionality
  const {
    isAutoSaving,
    lastSaved,
    saveError: autoSaveError,
    // forceAutoSave, // Can be used for manual save triggers
    clearDrafts
  } = useAutoSave({
    arrangementId,
    content: debouncedContent,
    history: getHistory(),
    isDirty,
    userId: userId || undefined,
    enabled: true
  });
  
  // Exit save to MongoDB
  const {
    // isSaving: isExitSaving, // Can be used to show saving state
    needsSave,
    saveNow: saveToMongoDB
  } = useExitSave({
    arrangementId,
    content,
    isDirty,
    enabled: true,
    onSaveSuccess: () => {
      clearHistory();
      clearDrafts();
    }
  });
  
  // Session recovery
  const {
    isChecking: isCheckingRecovery,
    hasDraft,
    draftData,
    recoverDraft,
    discardDraft,
    getDraftAge,
    getDraftPreview
  } = useSessionRecovery({
    arrangementId,
    userId: userId || undefined,
    enabled: true
  });
  
  // Use transposition hook for editor
  const transposition = useEditorTransposition(content, onChange);
  
  // Update transposition when content changes externally
  useEffect(() => {
    transposition.updateOriginalContent(content);
  }, [content, transposition.updateOriginalContent]);

  // Use mobile autocomplete hook
  const autocomplete = useMobileAutocomplete(
    textareaRef,
    content,
    {
      enabled: true,
      maxSuggestions: layout.isMobile ? 10 : 20,
      debounceMs: 20, // Reduced for instant filtering
      onChange: (newContent, cursorPos) => {
        // Update content through React state
        updateContent(newContent);
        
        // Set cursor position after React updates
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(cursorPos, cursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      },
      onSelect: (item, _trigger, position) => {
        // Autocomplete will handle the insertion
        console.log('Selected:', item.label, 'at position:', position);
      }
    }
  );

  // Use smart bracket completion hook
  const bracketCompletion = useBracketCompletion(
    textareaRef,
    content,
    (newContent, cursorPos) => {
      // Update content through React state
      updateContent(newContent);
      
      // Set cursor position after React updates
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(cursorPos, cursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    },
    {
      enabled: true,
      autoCloseBrackets: true,
      autoDeletePairs: true,
      autoOvertype: true
    }
  );

  // Handle recovery dialog
  const handleRecoverDraft = useCallback(() => {
    const draft = recoverDraft();
    if (draft) {
      updateContent(draft.content);
      // Could also restore command history here if needed
      // restoreHistory(draft.history);
    }
  }, [recoverDraft, updateContent]);
  
  const handleDiscardDraft = useCallback(async () => {
    try {
      await discardDraft();
    } catch (error) {
      console.error('Failed to discard draft:', error);
    }
  }, [discardDraft]);
  
  // Handle content changes from ChordProTextArea using command system
  const handleContentChange = useCallback(async (newContent: string) => {
    // Create a ReplaceTextCommand for the entire content change
    const command = new ReplaceTextCommand(0, content.length, newContent);
    
    try {
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to execute content change command:', error);
      // Fallback to direct update if command fails
      updateContent(newContent);
    }
  }, [content, executeCommand, updateContent]);

  // Combined keyboard handler for autocomplete and bracket completion
  const handleCombinedKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // First try bracket completion
    const bracketHandled = bracketCompletion.handleKeyDown(e);
    if (bracketHandled) return;
    
    // Then try autocomplete
    const autocompleteHandled = autocomplete.handleKeyDown(e);
    if (autocompleteHandled) return;
    
    // Additional keyboard shortcuts can be added here
  }, [bracketCompletion, autocomplete]);

  // Handle scroll synchronization between textarea and syntax highlighter
  const handleScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    if (syntaxRef.current) {
      // Use transform for better performance
      requestAnimationFrame(() => {
        if (syntaxRef.current) {
          const syntaxHighlighter = syntaxRef.current.querySelector('.syntax-highlighter') as HTMLElement;
          if (syntaxHighlighter) {
            syntaxHighlighter.style.transform = `translate(-${scrollLeft}px, -${scrollTop}px)`;
          }
        }
      });
    }
  }, []);

  // Handle cursor position changes
  const handleCursorChange = useCallback((position: number) => {
    handleCursorPositionChange(position);
  }, [handleCursorPositionChange]);

  // Handle selection range changes
  const handleSelectionRangeChangeLocal = useCallback((range: [number, number]) => {
    handleSelectionRangeChange(range);
  }, [handleSelectionRangeChange]);

  // Calculate line and column
  const getLineAndColumn = () => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
  };

  const { line, column } = getLineAndColumn();

  // Handle responsive layout changes
  useEffect(() => {
    // Hide preview on mobile by default when switching to mobile
    if (layout.isMobile && previewVisible) {
      setPreviewVisible(false);
    }
  }, [layout.isMobile, previewVisible]);

  // Handle splitter resize from EditorSplitter component
  const handleSplitterResize = useCallback((leftWidth: number) => {
    setSplitPosition(leftWidth);
  }, []);

  // Handle mobile preview toggle
  const handleMobileToggle = useCallback(() => {
    setPreviewVisible(!previewVisible);
  }, [previewVisible]);

  // Handle keyboard shortcuts for save and undo/redo
  const handleKeyboardShortcuts = useCallback(async (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      try {
        if (needsSave) {
          await saveToMongoDB();
        }
        if (onSave) {
          onSave(content);
        }
      } catch (error) {
        console.error('Save failed:', error);
      }
    }
    
    // Note: Undo/Redo (Ctrl+Z/Ctrl+Y) are handled by useEnhancedEditorState
  }, [content, onSave, needsSave, saveToMongoDB]);

  return (
    <div 
      className={`chord-pro-editor-wrapper h-full flex flex-col ${className}`}
      data-theme={currentTheme}
      data-device={layout.deviceType}
    >
      {/* Enhanced toolbar with transpose controls, undo/redo, and mobile toggle */}
      <div className="chord-editor-toolbar">
        <div className="toolbar-left">
          {/* Undo/Redo buttons */}
          <div className="undo-redo-controls" style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="toolbar-button"
              title="Undo (Ctrl+Z)"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: canUndo ? 'var(--background)' : 'var(--muted)',
                color: canUndo ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
              </svg>
              Undo
            </button>
            
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="toolbar-button"
              title="Redo (Ctrl+Y)"
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: canRedo ? 'var(--background)' : 'var(--muted)',
                color: canRedo ? 'var(--foreground)' : 'var(--muted-foreground)',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3-2.3" />
              </svg>
              Redo
            </button>
          </div>
          
          {enableTransposition && (
            <TransposeBar 
              transposition={transposition}
              className="inline-transpose-bar"
            />
          )}
        </div>
        
        <div className="toolbar-center">
          {layout.isMobile && showPreview && (
            <MobileToggle
              showPreview={previewVisible}
              onToggle={handleMobileToggle}
            />
          )}
        </div>
        
        <div className="toolbar-right">
          {/* Auto-save indicator */}
          <div className="auto-save-indicator" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
            {isAutoSaving && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Saving...
              </div>
            )}
            {lastSaved && !isAutoSaving && (
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Saved {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {autoSaveError && (
              <div style={{ fontSize: '0.875rem', color: 'var(--destructive)' }}>
                Save failed
              </div>
            )}
          </div>
          
          <FontPreferences showCompact={true} />
        </div>
      </div>
      
      <div 
        className="chord-pro-editor-container flex-1 flex chord-editor-main"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          flexDirection: layout.isMobile ? 'column' : 'row'
        }}
        onKeyDown={handleKeyboardShortcuts}
      >
        {/* Editor Pane */}
        <div 
          className="chord-editor-pane editor-pane"
          style={{ 
            width: !layout.isMobile && showPreview && previewVisible ? `${splitPosition}%` : '100%',
            height: layout.isMobile && previewVisible ? '50%' : layout.isMobile ? '100%' : 'auto'
          }}
        >
          {/* Editor layers container - ensures proper stacking */}
          <div className="editor-layers">
            {/* Syntax highlighting layer - behind textarea */}
            <div 
              ref={syntaxRef}
              className="syntax-container"
            >
              <SyntaxHighlighter 
                content={content} 
                theme={currentTheme}
                className="syntax-highlighter"
              />
            </div>
            
            {/* Transparent textarea layer - user input */}
            <ChordProTextArea
              value={content}
              onChange={handleContentChange}
              onCursorChange={handleCursorChange}
              onSelectionChange={handleSelectionRangeChangeLocal}
              onScroll={handleScroll}
              onKeyDown={handleCombinedKeyDown}
              onInput={autocomplete.handleInput}
              onBeforeInput={bracketCompletion.handleBeforeInput}
              textareaRef={textareaRef}
              theme={currentTheme === 'light' ? 'light' : 'dark'}
              placeholder="Start typing your ChordPro song..."
              className={debugMode ? 'debug' : ''}
              autoFocus={autoFocus}
            />
            
            {/* Alignment debugger overlay */}
            {showAlignmentDebugger && (
              <AlignmentDebugger 
                enabled={true}
                showGrid={true}
                showMetrics={true}
                className="alignment-debugger"
              />
            )}
          </div>
          
          {/* Status bar */}
          <div className="chord-editor-statusbar">
            <span>Line {line}, Column {column}</span>
            <span>{content.length} characters</span>
          </div>
        </div>

        {/* Enhanced Splitter - only show on tablet/desktop */}
        {!layout.isMobile && showPreview && previewVisible && (
          <EditorSplitter
            onResize={handleSplitterResize}
            defaultPosition={splitPosition}
            minWidth={200}
            maxWidth={80}
          />
        )}
        
        {/* Mobile horizontal divider */}
        {layout.isMobile && showPreview && previewVisible && (
          <div className="chord-editor-divider-mobile" />
        )}
        
        {/* Preview Pane */}
        {showPreview && previewVisible && (
          <div className={`chord-editor-pane preview-pane ${layout.isMobile ? 'mobile-preview' : 'desktop-preview'}`}>
            <PreviewPane 
              content={content} 
              theme={currentTheme}
              transpose={transposition.previewSemitones}
            />
          </div>
        )}
      </div>
      
      {/* Autocomplete dropdown */}
      <AutoCompleteDropdown
        items={autocomplete.items}
        selectedIndex={autocomplete.selectedIndex}
        onSelect={autocomplete.handleItemSelect}
        anchorEl={autocomplete.anchorEl}
        isOpen={autocomplete.isOpen}
        isMobile={layout.isMobile}
        isSearching={autocomplete.isSearching}
        onClose={autocomplete.closeAutocomplete}
      />
      
      {/* Recovery dialog for unsaved drafts */}
      <RecoveryDialog
        isOpen={hasDraft && !isCheckingRecovery}
        onRecover={handleRecoverDraft}
        onDiscard={handleDiscardDraft}
        draftTimestamp={draftData?.timestamp}
        draftPreview={getDraftPreview()}
        draftAge={getDraftAge()}
      />
    </div>
  );
};