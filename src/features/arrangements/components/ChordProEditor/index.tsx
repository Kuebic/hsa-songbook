import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { PreviewPane } from './PreviewPane';
import { ChordProTextArea } from './ChordProTextArea';
import { MobileToggle } from './components/MobileToggle';
import { ThemeSelector } from './components/ThemeSelector';
import { EditorSplitter } from './components/EditorSplitter';
import { AutoCompleteDropdown } from './components/AutoCompleteDropdown';
import { AlignmentDebugger } from './components/AlignmentDebugger';
import { useEditorState } from './hooks/useEditorState';
import { useEditorTheme } from './hooks/useEditorTheme';
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

export interface ChordProEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  height?: number | string;
  showPreview?: boolean;
  defaultPreviewVisible?: boolean;
  autoFocus?: boolean;
  enableChordCompletion?: boolean;
  className?: string;
}

export const ChordProEditor: React.FC<ChordProEditorProps> = ({
  initialContent = '',
  onChange,
  onSave,
  height = 600,
  showPreview = true,
  defaultPreviewVisible = true,
  autoFocus = false,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const syntaxRef = useRef<HTMLDivElement | null>(null);
  const [splitPosition, setSplitPosition] = useState(50);
  const [previewVisible, setPreviewVisible] = useState(defaultPreviewVisible);
  
  // Debug mode - set to true to see red text overlay for alignment checking
  const [debugMode] = useState(false); // Set to true for debugging text alignment
  const [showAlignmentDebugger] = useState(false); // Set to true for alignment grid
  
  // Use enhanced hooks for theme and responsive layout
  const { currentTheme, setTheme } = useEditorTheme('light');
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
  
  const {
    content,
    cursorPosition,
    updateContent,
    setCursorPosition,
  } = useEditorState({
    initialContent,
    onChange
  });

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
    setCursorPosition(position);
  }, [setCursorPosition]);

  // Handle selection range changes
  const handleSelectionRangeChange = useCallback((range: [number, number]) => {
    // We can expand this later if needed
    setCursorPosition(range[0]);
  }, [setCursorPosition]);

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
  }, [layout.isMobile]);

  // Handle splitter resize from EditorSplitter component
  const handleSplitterResize = useCallback((leftWidth: number) => {
    setSplitPosition(leftWidth);
  }, []);

  // Handle mobile preview toggle
  const handleMobileToggle = useCallback(() => {
    setPreviewVisible(!previewVisible);
  }, [previewVisible]);

  // Handle keyboard shortcuts for save
  const handleSaveShortcut = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave) {
        onSave(content);
      }
    }
  }, [content, onSave]);

  return (
    <div 
      className={`chord-pro-editor-wrapper h-full flex flex-col ${className}`}
      data-theme={currentTheme}
      data-device={layout.deviceType}
    >
      {/* Enhanced toolbar with theme selector and mobile toggle */}
      <div className="chord-editor-toolbar">
        <div className="toolbar-left">
          <ThemeSelector 
            currentTheme={currentTheme}
            onThemeChange={setTheme}
          />
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
          {/* Space for additional toolbar items */}
        </div>
      </div>
      
      <div 
        className="chord-pro-editor-container flex-1 flex chord-editor-main"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          flexDirection: layout.isMobile ? 'column' : 'row'
        }}
        onKeyDown={handleSaveShortcut}
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
          <div className="editor-layers" style={{ flex: 1 }}>
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
              onSelectionChange={handleSelectionRangeChange}
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
            <div className="chord-preview-container">
              <div className="chord-preview-content">
                <PreviewPane content={content} theme={currentTheme} />
              </div>
            </div>
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
        onClose={autocomplete.closeAutocomplete}
      />
    </div>
  );
};