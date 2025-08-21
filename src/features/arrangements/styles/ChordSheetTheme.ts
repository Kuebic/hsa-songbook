/**
 * @file ChordSheetTheme.ts
 * @description CSS-in-JS theme system for chord sheet styling
 * Provides dynamic theme generation and application for ChordSheetJS output
 */

export interface ChordSheetThemeColors {
  chord: string;
  lyric: string;
  section: string;
  comment: string;
  background: string;
  surface: string;
  border: string;
  highlight: string;
}

export interface ChordSheetThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ChordSheetThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ChordSheetTheme {
  name: string;
  colors: ChordSheetThemeColors;
  spacing: ChordSheetThemeSpacing;
  typography: ChordSheetThemeTypography;
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

/**
 * Predefined theme configurations
 */
export const chordSheetThemes: Record<string, ChordSheetTheme> = {
  light: {
    name: 'Light',
    colors: {
      chord: 'var(--color-primary, #2563eb)',
      lyric: 'var(--text-primary, #111827)',
      section: 'var(--color-secondary, #7c3aed)',
      comment: 'var(--text-secondary, #6b7280)',
      background: 'var(--color-background, #ffffff)',
      surface: 'var(--color-surface, #f9fafb)',
      border: 'var(--color-border, #e5e7eb)',
      highlight: 'var(--color-highlight, #fef3c7)'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    typography: {
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem'
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 600
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.6,
        relaxed: 1.8
      }
    },
    borderRadius: '0.25rem',
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  },
  
  dark: {
    name: 'Dark',
    colors: {
      chord: 'var(--color-primary-dark, #60a5fa)',
      lyric: 'var(--text-primary-dark, #f9fafb)',
      section: 'var(--color-secondary-dark, #a78bfa)',
      comment: 'var(--text-secondary-dark, #d1d5db)',
      background: 'var(--color-background-dark, #1f2937)',
      surface: 'var(--color-surface-dark, #374151)',
      border: 'var(--color-border-dark, #4b5563)',
      highlight: 'var(--color-highlight-dark, #451a03)'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    typography: {
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem'
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 600
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.6,
        relaxed: 1.8
      }
    },
    borderRadius: '0.25rem',
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
    }
  },
  
  stage: {
    name: 'Stage',
    colors: {
      chord: '#fbbf24', // High contrast yellow
      lyric: '#ffffff', // Pure white
      section: '#f59e0b', // Orange
      comment: '#fde68a', // Light yellow
      background: '#000000', // Pure black
      surface: '#111111',
      border: '#333333',
      highlight: '#dc2626' // Red for emphasis
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem'
    },
    typography: {
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: {
        xs: '1rem',
        sm: '1.125rem',
        md: '1.25rem',
        lg: '1.5rem',
        xl: '1.875rem'
      },
      fontWeight: {
        normal: 500,
        medium: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.3,
        normal: 1.7,
        relaxed: 2
      }
    },
    borderRadius: '0.5rem',
    shadows: {
      sm: '0 0 10px rgba(251, 191, 36, 0.3)',
      md: '0 0 20px rgba(251, 191, 36, 0.4)',
      lg: '0 0 30px rgba(251, 191, 36, 0.5)'
    }
  },
  
  print: {
    name: 'Print',
    colors: {
      chord: '#000000',
      lyric: '#000000',
      section: '#000000',
      comment: '#333333',
      background: '#ffffff',
      surface: '#ffffff',
      border: '#000000',
      highlight: '#cccccc'
    },
    spacing: {
      xs: '2pt',
      sm: '4pt',
      md: '8pt',
      lg: '12pt',
      xl: '16pt'
    },
    typography: {
      fontFamily: 'serif',
      fontSize: {
        xs: '8pt',
        sm: '9pt',
        md: '10pt',
        lg: '11pt',
        xl: '12pt'
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700
      },
      lineHeight: {
        tight: 1.1,
        normal: 1.3,
        relaxed: 1.5
      }
    },
    borderRadius: '0',
    shadows: {
      sm: 'none',
      md: 'none',
      lg: 'none'
    }
  }
};

/**
 * Generate CSS variables from theme
 */
export function generateThemeCSSVariables(theme: ChordSheetTheme): string {
  return `
    --cs-color-chord: ${theme.colors.chord};
    --cs-color-lyric: ${theme.colors.lyric};
    --cs-color-section: ${theme.colors.section};
    --cs-color-comment: ${theme.colors.comment};
    --cs-color-background: ${theme.colors.background};
    --cs-color-surface: ${theme.colors.surface};
    --cs-color-border: ${theme.colors.border};
    --cs-color-highlight: ${theme.colors.highlight};
    
    --cs-spacing-xs: ${theme.spacing.xs};
    --cs-spacing-sm: ${theme.spacing.sm};
    --cs-spacing-md: ${theme.spacing.md};
    --cs-spacing-lg: ${theme.spacing.lg};
    --cs-spacing-xl: ${theme.spacing.xl};
    
    --cs-font-family: ${theme.typography.fontFamily};
    --cs-font-size-xs: ${theme.typography.fontSize.xs};
    --cs-font-size-sm: ${theme.typography.fontSize.sm};
    --cs-font-size-md: ${theme.typography.fontSize.md};
    --cs-font-size-lg: ${theme.typography.fontSize.lg};
    --cs-font-size-xl: ${theme.typography.fontSize.xl};
    
    --cs-font-weight-normal: ${theme.typography.fontWeight.normal};
    --cs-font-weight-medium: ${theme.typography.fontWeight.medium};
    --cs-font-weight-bold: ${theme.typography.fontWeight.bold};
    
    --cs-line-height-tight: ${theme.typography.lineHeight.tight};
    --cs-line-height-normal: ${theme.typography.lineHeight.normal};
    --cs-line-height-relaxed: ${theme.typography.lineHeight.relaxed};
    
    --cs-border-radius: ${theme.borderRadius};
    --cs-shadow-sm: ${theme.shadows.sm};
    --cs-shadow-md: ${theme.shadows.md};
    --cs-shadow-lg: ${theme.shadows.lg};
  `;
}

/**
 * Generate complete CSS for a theme
 */
export function generateThemeCSS(themeName: keyof typeof chordSheetThemes): string {
  const theme = chordSheetThemes[themeName];
  if (!theme) {
    console.warn(`Theme "${themeName}" not found, using light theme`);
    return generateThemeCSS('light');
  }
  
  const cssVariables = generateThemeCSSVariables(theme);
  
  return `
    .chord-sheet-themed[data-theme="${themeName}"] {
      ${cssVariables}
    }
    
    /* Apply theme to ChordSheetJS native classes */
    .chord-sheet-themed[data-theme="${themeName}"] {
      background-color: var(--cs-color-background);
      color: var(--cs-color-lyric);
      font-family: var(--cs-font-family);
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .chord {
      color: var(--cs-color-chord);
      font-weight: var(--cs-font-weight-bold);
      margin-bottom: var(--cs-spacing-xs);
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .lyrics {
      color: var(--cs-color-lyric);
      line-height: var(--cs-line-height-normal);
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .comment {
      color: var(--cs-color-comment);
      font-style: italic;
      margin: var(--cs-spacing-sm) 0;
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .verse-label,
    .chord-sheet-themed[data-theme="${themeName}"] .chorus-label,
    .chord-sheet-themed[data-theme="${themeName}"] .bridge-label,
    .chord-sheet-themed[data-theme="${themeName}"] .tag-label {
      color: var(--cs-color-section);
      font-weight: var(--cs-font-weight-bold);
      font-size: var(--cs-font-size-lg);
      margin-top: var(--cs-spacing-lg);
      margin-bottom: var(--cs-spacing-sm);
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--cs-spacing-sm);
      margin-bottom: var(--cs-spacing-sm);
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .column {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .paragraph {
      margin-bottom: var(--cs-spacing-md);
      padding: var(--cs-spacing-sm);
      border-radius: var(--cs-border-radius);
    }
    
    .chord-sheet-themed[data-theme="${themeName}"] .paragraph:hover {
      background-color: var(--cs-color-surface);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .chord-sheet-themed[data-theme="${themeName}"] {
        font-size: var(--cs-font-size-sm);
      }
      
      .chord-sheet-themed[data-theme="${themeName}"] .chord {
        font-size: var(--cs-font-size-md);
      }
    }
    
    @media (min-width: 1024px) {
      .chord-sheet-themed[data-theme="${themeName}"] {
        font-size: var(--cs-font-size-md);
      }
      
      .chord-sheet-themed[data-theme="${themeName}"] .chord {
        font-size: var(--cs-font-size-lg);
      }
    }
    
    /* Print specific styles */
    @media print {
      .chord-sheet-themed[data-theme="${themeName}"] {
        background-color: white !important;
        color: black !important;
        font-size: 10pt !important;
      }
      
      .chord-sheet-themed[data-theme="${themeName}"] .chord {
        color: black !important;
        font-weight: bold !important;
      }
      
      .chord-sheet-themed[data-theme="${themeName}"] .paragraph {
        page-break-inside: avoid;
      }
    }
  `;
}

/**
 * Generate all theme CSS
 */
export function generateAllThemesCSS(): string {
  return Object.keys(chordSheetThemes)
    .map(themeName => generateThemeCSS(themeName as keyof typeof chordSheetThemes))
    .join('\n\n');
}

/**
 * Create a custom theme
 */
export function createCustomTheme(
  name: string,
  overrides: Partial<ChordSheetTheme>
): ChordSheetTheme {
  const baseTheme = chordSheetThemes.light;
  
  return {
    ...baseTheme,
    name,
    colors: {
      ...baseTheme.colors,
      ...(overrides.colors || {})
    },
    spacing: {
      ...baseTheme.spacing,
      ...(overrides.spacing || {})
    },
    typography: {
      ...baseTheme.typography,
      ...(overrides.typography || {})
    },
    borderRadius: overrides.borderRadius || baseTheme.borderRadius,
    shadows: {
      ...baseTheme.shadows,
      ...(overrides.shadows || {})
    }
  };
}

/**
 * Apply theme to element
 */
export function applyThemeToElement(
  element: HTMLElement,
  themeName: keyof typeof chordSheetThemes
): void {
  const theme = chordSheetThemes[themeName];
  if (!theme) return;
  
  // Set data attribute
  element.setAttribute('data-theme', themeName);
  element.classList.add('chord-sheet-themed');
  
  // Apply CSS variables
  const cssVariables = generateThemeCSSVariables(theme);
  const lines = cssVariables.trim().split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^\s*(--[\w-]+):\s*(.+);?\s*$/);
    if (match) {
      const [, property, value] = match;
      element.style.setProperty(property, value);
    }
  });
}

/**
 * Get theme by name with fallback
 */
export function getTheme(themeName?: string): ChordSheetTheme {
  if (!themeName || !(themeName in chordSheetThemes)) {
    return chordSheetThemes.light;
  }
  return chordSheetThemes[themeName as keyof typeof chordSheetThemes];
}

/**
 * Hook to inject theme CSS into document
 */
export function injectThemeCSS(themeName?: keyof typeof chordSheetThemes): void {
  const styleId = 'chord-sheet-theme-styles';
  
  // Remove existing style element
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new style element
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = themeName 
    ? generateThemeCSS(themeName)
    : generateAllThemesCSS();
  
  // Append to head
  document.head.appendChild(style);
}