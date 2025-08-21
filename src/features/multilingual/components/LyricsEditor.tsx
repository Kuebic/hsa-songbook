import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  MultilingualText, 
  LanguageCode
} from '../types/multilingual.types';
import { 
  getLanguageInfo, 
  isRomajiLanguageCode,
  isValidLanguageCode 
} from '../types/multilingual.types';

/**
 * Props for the LyricsEditor component
 */
interface LyricsEditorProps {
  lyrics: MultilingualText;
  onChange: (lyrics: MultilingualText) => void;
  onValidationChange?: (isValid: boolean, errors: Record<LanguageCode, string>) => void;
  availableLanguages?: LanguageCode[];
  initialActiveLanguage?: LanguageCode;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoHeight?: boolean;
  className?: string;
}

/**
 * Multilingual lyrics editor with tabbed interface
 * Supports adding/removing languages and real-time validation
 */
export function LyricsEditor({
  lyrics,
  onChange,
  onValidationChange,
  availableLanguages = ['en', 'ja', 'ja-romaji', 'ko', 'ko-romaji'],
  initialActiveLanguage = 'en',
  disabled = false,
  placeholder = 'Enter lyrics...',
  maxLength = 10000,
  showCharacterCount = true,
  autoHeight = false,
  className = ''
}: LyricsEditorProps) {
  // Get languages that have content or should be shown
  const activeLangCodes = Object.keys(lyrics).filter((key): key is LanguageCode => 
    isValidLanguageCode(key) && availableLanguages.includes(key)
  );
  
  // Ensure initial active language is available
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>(() => {
    if (activeLangCodes.includes(initialActiveLanguage)) {
      return initialActiveLanguage;
    }
    if (activeLangCodes.length > 0) {
      return activeLangCodes[0];
    }
    return availableLanguages.find(lang => lang === 'en') || availableLanguages[0];
  });
  
  const [errors, setErrors] = useState<Record<LanguageCode, string>>({});
  const textareaRefs = useRef<Record<LanguageCode, HTMLTextAreaElement | null>>({});

  // Add new language tab
  const addLanguage = useCallback((language: LanguageCode) => {
    if (!lyrics[language] && availableLanguages.includes(language)) {
      const newLyrics = { ...lyrics, [language]: '' };
      onChange(newLyrics);
      setActiveLanguage(language);
    }
  }, [lyrics, onChange, availableLanguages]);

  // Remove language tab and its content
  const removeLanguage = useCallback((language: LanguageCode) => {
    if (activeLangCodes.length <= 1) {
      return; // Don't remove if it's the last language
    }
    
    const newLyrics = { ...lyrics };
    delete newLyrics[language];
    onChange(newLyrics);
    
    // Switch to another language if removing active language
    if (activeLanguage === language) {
      const remainingLanguages = activeLangCodes.filter(lang => lang !== language);
      if (remainingLanguages.length > 0) {
        setActiveLanguage(remainingLanguages[0]);
      }
    }
    
    // Clear error for removed language
    const newErrors = { ...errors };
    delete newErrors[language];
    setErrors(newErrors);
  }, [lyrics, onChange, activeLangCodes, activeLanguage, errors]);

  // Update lyrics for specific language
  const updateLyrics = useCallback((language: LanguageCode, content: string) => {
    const newLyrics = { ...lyrics, [language]: content };
    onChange(newLyrics);
    
    // Clear validation error when user starts typing
    if (errors[language]) {
      const newErrors = { ...errors };
      delete newErrors[language];
      setErrors(newErrors);
    }
  }, [lyrics, onChange, errors]);

  // Validate lyrics content
  const validateLyrics = useCallback(() => {
    const newErrors: Record<LanguageCode, string> = {};
    
    for (const [language, content] of Object.entries(lyrics)) {
      if (!isValidLanguageCode(language)) continue;
      
      if (content.length > maxLength) {
        newErrors[language] = `Content exceeds ${maxLength} characters`;
      }
      
      // Additional validation for specific languages could go here
      // For example, checking for proper CJK characters for Japanese/Korean
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange?.(isValid, newErrors);
    
    return isValid;
  }, [lyrics, maxLength, onValidationChange]);

  // Run validation when lyrics change
  useEffect(() => {
    validateLyrics();
  }, [validateLyrics]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    if (autoHeight) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
    }
  }, [autoHeight]);

  // Handle textarea ref and auto-resize
  const setTextareaRef = useCallback((language: LanguageCode) => (ref: HTMLTextAreaElement | null) => {
    textareaRefs.current[language] = ref;
    if (ref && autoHeight) {
      adjustTextareaHeight(ref);
    }
  }, [adjustTextareaHeight, autoHeight]);

  // Get available languages that aren't already added
  const availableToAdd = availableLanguages.filter(lang => !lyrics[lang]);

  // Styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto'
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    borderBottom: '1px solid var(--color-border)',
    overflowX: 'auto',
    paddingBottom: '0'
  };

  const tabStyles: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    borderRadius: '4px 4px 0 0',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    position: 'relative',
    borderBottom: '2px solid transparent'
  };

  const activeTabStyles: React.CSSProperties = {
    ...tabStyles,
    color: 'var(--text-primary)',
    backgroundColor: 'var(--color-accent)',
    borderBottom: '2px solid var(--color-primary)'
  };

  const addButtonStyles: React.CSSProperties = {
    ...tabStyles,
    color: 'var(--color-primary)',
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem'
  };

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: autoHeight ? '120px' : '200px',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--color-background)',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: autoHeight ? 'none' : 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    transition: 'border-color 0.2s'
  };

  const errorTextareaStyles: React.CSSProperties = {
    ...textareaStyles,
    borderColor: 'var(--color-destructive)'
  };

  const metaInfoStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem'
  };

  const errorStyles: React.CSSProperties = {
    color: 'var(--color-destructive)',
    fontSize: '0.75rem',
    marginTop: '0.25rem'
  };

  const currentContent = lyrics[activeLanguage] || '';
  const currentError = errors[activeLanguage];
  const charCount = currentContent.length;
  const isOverLimit = charCount > maxLength;

  return (
    <div style={containerStyles} className={className}>
      {/* Tab Headers */}
      <div style={tabsContainerStyles}>
        {activeLangCodes.map((language) => {
          const langInfo = getLanguageInfo(language);
          if (!langInfo) return null;
          
          const isActive = language === activeLanguage;
          const hasError = !!errors[language];
          
          return (
            <button
              key={language}
              type="button"
              style={isActive ? activeTabStyles : tabStyles}
              onClick={() => setActiveLanguage(language)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--color-muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>
                {langInfo.name}
                {isRomajiLanguageCode(language) && ' (R)'}
              </span>
              {hasError && (
                <span style={{ color: 'var(--color-destructive)' }}>⚠</span>
              )}
              {activeLangCodes.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLanguage(language);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'currentColor',
                    cursor: 'pointer',
                    padding: '0 0 0 0.25rem',
                    fontSize: '1rem',
                    lineHeight: 1
                  }}
                  title={`Remove ${langInfo.name} lyrics`}
                >
                  ×
                </button>
              )}
            </button>
          );
        })}
        
        {/* Add Language Dropdown */}
        {availableToAdd.length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) {
                addLanguage(e.target.value as LanguageCode);
                e.target.value = ''; // Reset selection
              }
            }}
            style={addButtonStyles}
            value=""
          >
            <option value="" disabled>+ Add Language</option>
            {availableToAdd.map((language) => {
              const langInfo = getLanguageInfo(language);
              return langInfo ? (
                <option key={language} value={language}>
                  {langInfo.name}
                </option>
              ) : null;
            })}
          </select>
        )}
      </div>

      {/* Active Language Editor */}
      <div>
        <textarea
          ref={setTextareaRef(activeLanguage)}
          value={currentContent}
          onChange={(e) => {
            updateLyrics(activeLanguage, e.target.value);
            if (autoHeight) {
              adjustTextareaHeight(e.target);
            }
          }}
          placeholder={`${placeholder} (${getLanguageInfo(activeLanguage)?.name})`}
          style={currentError ? errorTextareaStyles : textareaStyles}
          maxLength={maxLength + 100} // Allow slight overflow for better UX
        />
        
        {/* Meta Information */}
        <div style={metaInfoStyles}>
          <div>
            {getLanguageInfo(activeLanguage)?.nativeName !== getLanguageInfo(activeLanguage)?.name && (
              <span>{getLanguageInfo(activeLanguage)?.nativeName}</span>
            )}
          </div>
          {showCharacterCount && (
            <div style={{ color: isOverLimit ? 'var(--color-destructive)' : 'inherit' }}>
              {charCount.toLocaleString()} / {maxLength.toLocaleString()} characters
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {currentError && (
          <div style={errorStyles}>{currentError}</div>
        )}
      </div>
    </div>
  );
}