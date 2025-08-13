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
  const [debugMode] = useState(true); // Set to true for debugging text alignment
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
      debounceMs: layout.isMobile ? 200 : 100,
      onSelect: (item, _trigger, position) => {
        // Autocomplete will handle the insertion
        console.log('Selected:', item.label, 'at position:', position);
      }
    }
  );

  // Handle content changes from ChordProTextArea
  const handleContentChange = useCallback((newContent: string) => {
    updateContent(newContent);
    // Trigger autocomplete input handler
    autocomplete.handleInput();
  }, [updateContent, autocomplete]);

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

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
        onKeyDown={handleKeyDown}
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
              style={{ 
                position: 'absolute', 
                inset: 0, 
                overflow: 'auto', 
                pointerEvents: 'none',
                zIndex: 1
              }}
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
              onScroll={(scrollTop, scrollLeft) => {
                // Sync scroll position with syntax highlighter
                if (syntaxRef.current) {
                  syntaxRef.current.scrollTop = scrollTop;
                  syntaxRef.current.scrollLeft = scrollLeft;
                }
              }}
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