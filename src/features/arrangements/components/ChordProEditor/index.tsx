import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { PreviewPane } from './PreviewPane';
import { ChordProTextArea } from './ChordProTextArea';
import { MobileToggle } from './components/MobileToggle';
import { EditorSplitter } from './components/EditorSplitter';
import { AutoCompleteDropdown } from './components/AutoCompleteDropdown';
import { AlignmentDebugger } from './components/AlignmentDebugger';
import { TransposeControls } from '../TransposeControls';
import { FontPreferences } from '../FontPreferences';
import { useDebounce } from '../../hooks/useDebounce';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useExitSave } from '../../hooks/useExitSave';
import { useAuth } from '@features/auth';
import { useTheme } from '@shared/contexts/useTheme';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';
import { useMobileAutocomplete } from './hooks/useMobileAutocomplete';
import { useBracketCompletion } from './hooks/useBracketCompletion';
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
  arrangementId: string; // Required for auto-save storage
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
  onCancel,
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
  
  // Simple editor state
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debouncedContent = useDebounce(content, 300);
  
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== initialContent);
    onChange?.(newContent);
  }, [initialContent, onChange]);
  
  const handleCursorPositionChange = useCallback((pos: number) => {
    setCursorPosition(pos);
  }, []);
  
  const handleSelectionRangeChange = useCallback(() => {
    // Not used currently
  }, []);

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
    isDirty,
    userId: userId || undefined,
    enabled: true
  });
  
  // Exit save to Supabase
  const {
    // isSaving: isExitSaving, // Can be used to show saving state
    needsSave,
    saveNow: saveToSupabase
  } = useExitSave({
    arrangementId,
    content,
    isDirty,
    enabled: true,
    onSaveSuccess: () => {
      clearDrafts();
    }
  });
  
  
  // Simple transposition state for immediate application
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  
  // Extract current key from content
  const getCurrentKey = useCallback(() => {
    const keyMatch = content.match(/\{key:\s*([^}]+)\}/i);
    if (keyMatch) return keyMatch[1];
    // Try to detect from first chord
    const chordMatch = content.match(/\[([A-G][#b]?)/);
    return chordMatch ? chordMatch[1] : 'C';
  }, [content]);
  
  const currentKey = getCurrentKey();
  
  // Transpose immediately
  const handleTranspose = useCallback((steps: number) => {
    const newSemitones = transposeSemitones + steps;
    if (newSemitones < -12 || newSemitones > 12) return;
    
    setTransposeSemitones(newSemitones);
    // Note: actual transposition is applied to preview, not the editor content
    // This matches the arrangement viewer behavior
  }, [transposeSemitones]);
  
  const handleReset = useCallback(() => {
    setTransposeSemitones(0);
  }, []);


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

  
  // Handle content changes from ChordProTextArea
  const handleContentChange = useCallback((newContent: string) => {
    // Directly update content without using command system for regular typing
    // This preserves cursor position naturally
    updateContent(newContent);
  }, [updateContent]);

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
  const handleSelectionRangeChangeLocal = useCallback((_range: [number, number]) => {
    handleSelectionRangeChange();
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

  // Handle keyboard shortcuts for save
  const handleKeyboardShortcuts = useCallback(async (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      try {
        if (needsSave) {
          await saveToSupabase();
        }
        if (onSave) {
          onSave(content);
        }
      } catch (error) {
        console.error('Save failed:', error);
      }
    }
  }, [content, onSave, needsSave, saveToSupabase]);

  return (
    <div 
      className={`chord-pro-editor-wrapper h-full flex flex-col ${className}`}
      data-theme={currentTheme}
      data-device={layout.deviceType}
    >
      {/* Enhanced toolbar with transpose controls and mobile toggle */}
      <div className="chord-editor-toolbar">
        <div className="toolbar-left">
          {/* Back button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="toolbar-button"
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Go back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
          )}
          
          {/* Save button */}
          {onSave && (
            <button
              onClick={async () => {
                try {
                  if (needsSave) {
                    await saveToSupabase();
                  }
                  if (onSave) {
                    onSave(content);
                  }
                } catch (error) {
                  console.error('Save failed:', error);
                }
              }}
              className="toolbar-button"
              disabled={!needsSave}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                background: needsSave ? 'var(--primary)' : 'var(--background)',
                color: needsSave ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                cursor: needsSave ? 'pointer' : 'default',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                opacity: needsSave ? 1 : 0.5
              }}
              title={needsSave ? "Save changes (Ctrl+S)" : "No changes to save"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save
            </button>
          )}
          
          {enableTransposition && (
            <TransposeControls
              currentKey={currentKey}
              originalKey={currentKey}
              semitones={transposeSemitones}
              onTranspose={handleTranspose}
              onReset={handleReset}
              canTransposeUp={transposeSemitones < 12}
              canTransposeDown={transposeSemitones > -12}
              variant="toolbar"
              className="inline-transpose-controls"
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
              content={debouncedContent} 
              theme={currentTheme}
              transpose={transposeSemitones}
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
    </div>
  );
};