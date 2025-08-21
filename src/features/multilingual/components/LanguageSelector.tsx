import React, { useMemo } from 'react';
import type { LanguageSelectorProps } from '../types/multilingual.types';
import { 
  SUPPORTED_LANGUAGES, 
  getLanguageInfo, 
  getLanguageGroups,
  type LanguageCode 
} from '../types/multilingual.types';

/**
 * Language selector dropdown component
 * Supports grouping by script family and showing native names
 */
export function LanguageSelector({
  value,
  onChange,
  availableLanguages,
  disabled = false,
  placeholder = 'Select language',
  groupByScript = true,
  showNativeNames = true,
  className = ''
}: LanguageSelectorProps) {
  
  // Filter to only available languages or all supported languages
  const languages = useMemo(() => {
    const codes = availableLanguages || SUPPORTED_LANGUAGES.map(lang => lang.code);
    return codes.filter(code => 
      SUPPORTED_LANGUAGES.some(lang => lang.code === code)
    );
  }, [availableLanguages]);

  // Group languages if requested
  const languageGroups = useMemo(() => {
    if (!groupByScript) {
      return null;
    }
    return getLanguageGroups(languages);
  }, [languages, groupByScript]);

  // Default input styles matching the existing form pattern
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--color-background)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value as LanguageCode;
    onChange(selectedValue);
  };

  // Render grouped options
  if (groupByScript && languageGroups) {
    return (
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        style={inputStyles}
        className={className}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        
        {languageGroups.map((group) => {
          const groupLabel = group.nativeLanguage.name;
          
          // If only one option in group, render without optgroup
          if (group.availableOptions.length === 1) {
            const option = group.availableOptions[0];
            const langInfo = getLanguageInfo(option.code);
            if (!langInfo) return null;
            
            return (
              <option key={option.code} value={option.code}>
                {showNativeNames && langInfo.nativeName !== langInfo.name
                  ? `${langInfo.name} (${langInfo.nativeName})`
                  : langInfo.name}
              </option>
            );
          }
          
          // Render optgroup for multiple options
          return (
            <optgroup key={groupLabel} label={groupLabel}>
              {group.availableOptions.map((option) => {
                const langInfo = getLanguageInfo(option.code);
                if (!langInfo) return null;
                
                const displayName = option.isRomaji 
                  ? langInfo.name 
                  : (showNativeNames && langInfo.nativeName !== langInfo.name
                      ? `${langInfo.name} (${langInfo.nativeName})`
                      : langInfo.name);
                
                return (
                  <option key={option.code} value={option.code}>
                    {displayName}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    );
  }

  // Render flat list
  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      style={inputStyles}
      className={className}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      
      {languages.map((code) => {
        const langInfo = getLanguageInfo(code);
        if (!langInfo) return null;
        
        const displayName = showNativeNames && langInfo.nativeName !== langInfo.name
          ? `${langInfo.name} (${langInfo.nativeName})`
          : langInfo.name;
        
        return (
          <option key={code} value={code}>
            {displayName}
          </option>
        );
      })}
    </select>
  );
}

/**
 * Compact language selector for inline use
 */
export function CompactLanguageSelector({
  value,
  onChange,
  availableLanguages,
  disabled = false,
  className = ''
}: Omit<LanguageSelectorProps, 'placeholder' | 'groupByScript' | 'showNativeNames'>) {
  return (
    <LanguageSelector
      value={value}
      onChange={onChange}
      availableLanguages={availableLanguages}
      disabled={disabled}
      placeholder="Lang"
      groupByScript={false}
      showNativeNames={false}
      className={className}
    />
  );
}

/**
 * Language selector with label for forms
 */
interface LabeledLanguageSelectorProps extends LanguageSelectorProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export function LabeledLanguageSelector({
  label,
  required = false,
  error,
  description,
  ...props
}: LabeledLanguageSelectorProps) {
  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-primary)'
  };

  const errorStyles: React.CSSProperties = {
    color: 'var(--color-destructive)',
    fontSize: '0.75rem',
    marginTop: '0.25rem'
  };

  const descriptionStyles: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    marginTop: '0.25rem'
  };

  return (
    <div>
      <label style={labelStyles}>
        {label} {required && '*'}
      </label>
      
      <LanguageSelector 
        {...props}
        className={`${props.className || ''} ${error ? 'error' : ''}`.trim()}
      />
      
      {error && (
        <div style={errorStyles}>{error}</div>
      )}
      
      {description && !error && (
        <div style={descriptionStyles}>{description}</div>
      )}
    </div>
  );
}