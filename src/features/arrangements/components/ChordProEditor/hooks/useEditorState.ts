import { useState, useCallback, useEffect } from 'react';

interface UseEditorStateProps {
  initialContent: string;
  onChange?: (content: string) => void;
}

export const useEditorState = ({ initialContent, onChange }: UseEditorStateProps) => {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0
  });

  // Update content and notify parent
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  }, [onChange]);

  // Update cursor position
  const updateCursorPosition = useCallback((position: number) => {
    setCursorPosition(position);
  }, []);

  // Update selection range
  const updateSelectionRange = useCallback((start: number, end: number) => {
    setSelectionRange({ start, end });
  }, []);

  // Handle initial content changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return {
    content,
    cursorPosition,
    selectionRange,
    updateContent,
    setCursorPosition: updateCursorPosition,
    setSelectionRange: updateSelectionRange,
  };
};