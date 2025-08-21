import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@shared/components/modal/Modal';
import type { LyricsLanguageModalProps } from '../types/multilingual.types';
import { 
  getLanguageInfo, 
  getLanguageGroups, 
  isRomajiLanguageCode,
  LANGUAGE_STORAGE_KEYS,
  type LanguageCode 
} from '../types/multilingual.types';

/**
 * Modal for selecting which language lyrics to use when creating arrangements
 * Shows available languages with preview text and clear distinction between native and Romaji variants
 */
export function LyricsLanguageModal({
  isOpen,
  onClose,
  availableLyrics,
  currentSelection,
  songTitle
}: LyricsLanguageModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | undefined>(currentSelection);

  // Get available language codes from the lyrics object
  const availableLanguageCodes = useMemo(() => {
    if (!availableLyrics || typeof availableLyrics !== 'object') {
      return [];
    }
    
    return Object.keys(availableLyrics)
      .filter((key): key is LanguageCode => {
        const lyrics = availableLyrics[key];
        return Boolean(lyrics && lyrics.trim());
      });
  }, [availableLyrics]);

  // Group languages for better organization
  const languageGroups = useMemo(() => {
    return getLanguageGroups(availableLanguageCodes);
  }, [availableLanguageCodes]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      // Try to restore previous selection from session storage
      try {
        const stored = sessionStorage.getItem(LANGUAGE_STORAGE_KEYS.LYRICS_SELECTION);
        if (stored && availableLanguageCodes.includes(stored as LanguageCode)) {
          setSelectedLanguage(stored as LanguageCode);
          return;
        }
      } catch (error) {
        console.warn('Failed to read lyrics language selection from session storage:', error);
      }
      
      setSelectedLanguage(currentSelection || availableLanguageCodes[0]);
    }
  }, [isOpen, currentSelection, availableLanguageCodes]);

  // Save selection to session storage when it changes
  useEffect(() => {
    if (selectedLanguage) {
      try {
        sessionStorage.setItem(LANGUAGE_STORAGE_KEYS.LYRICS_SELECTION, selectedLanguage);
      } catch (error) {
        console.warn('Failed to save lyrics language selection to session storage:', error);
      }
    }
  }, [selectedLanguage]);

  const handleConfirm = () => {
    onClose(selectedLanguage);
  };

  const handleCancel = () => {
    onClose();
  };

  const truncateText = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Styles
  const cardStyles: React.CSSProperties = {
    border: '2px solid var(--color-border)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'var(--color-card)',
    position: 'relative'
  };

  const selectedCardStyles: React.CSSProperties = {
    ...cardStyles,
    borderColor: 'var(--color-primary)',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-accent-foreground)'
  };

  const groupHeaderStyles: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    marginTop: '1rem',
    paddingBottom: '0.25rem',
    borderBottom: '1px solid var(--color-border)'
  };

  const languageNameStyles: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const badgeStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 400,
    padding: '0.125rem 0.5rem',
    borderRadius: '12px',
    backgroundColor: 'var(--color-muted)',
    color: 'var(--text-muted)'
  };

  const previewStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    lineHeight: 1.4
  };

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--color-border)'
  };

  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    fontWeight: 500
  };

  const primaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-primary-foreground)'
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--color-border)'
  };

  // Don't render if no languages available
  if (availableLanguageCodes.length === 0) {
    return null;
  }

  // If only one language available, auto-select and close
  if (availableLanguageCodes.length === 1 && isOpen) {
    const singleLanguage = availableLanguageCodes[0];
    setTimeout(() => onClose(singleLanguage), 100);
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Choose Lyrics Language"
      description={songTitle ? `Select which language lyrics to use for "${songTitle}"` : 'Select which language lyrics to use for this arrangement'}
      size="medium"
    >
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {languageGroups.map((group, _groupIndex) => (
          <div key={group.nativeLanguage.code}>
            {/* Group header for multiple groups or groups with both native and romaji */}
            {(languageGroups.length > 1 || group.availableOptions.length > 1) && (
              <div style={groupHeaderStyles}>
                {group.nativeLanguage.name}
              </div>
            )}
            
            {group.availableOptions.map((option) => {
              const langInfo = getLanguageInfo(option.code);
              if (!langInfo) return null;
              
              const isSelected = selectedLanguage === option.code;
              const lyricsText = availableLyrics[option.code] || '';
              const previewText = truncateText(lyricsText);
              
              return (
                <div
                  key={option.code}
                  style={isSelected ? selectedCardStyles : cardStyles}
                  onClick={() => setSelectedLanguage(option.code)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-primary-muted)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                >
                  <div style={languageNameStyles}>
                    <span>{langInfo.name}</span>
                    {isRomajiLanguageCode(option.code) && (
                      <span style={badgeStyles}>Romaji</span>
                    )}
                    {isSelected && (
                      <span style={{ 
                        ...badgeStyles, 
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-primary-foreground)'
                      }}>
                        Selected
                      </span>
                    )}
                  </div>
                  
                  {previewText && (
                    <div style={previewStyles}>
                      "{previewText}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div style={buttonContainerStyles}>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            ...secondaryButtonStyles,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Cancel
        </button>
        
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedLanguage}
          style={{
            ...primaryButtonStyles,
            opacity: selectedLanguage ? 1 : 0.5,
            cursor: selectedLanguage ? 'pointer' : 'not-allowed'
          }}
        >
          Use This Language
        </button>
      </div>
    </Modal>
  );
}