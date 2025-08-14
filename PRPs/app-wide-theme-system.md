# PRP: App-Wide Theme System Implementation

## Feature Overview
Implement a comprehensive app-wide theme system with three themes (light, dark, stage) where dark is the default. Add a theme toggle in the header and ensure all pages, components, and UI elements properly match the selected theme.

## Context & Current State

### Existing Theme Infrastructure
The codebase already has a partial theme system implemented in the ChordPro editor:
- **File**: `/src/features/arrangements/components/ChordProEditor/styles/themes.css` - Complete CSS variable definitions for 3 themes
- **Hook**: `/src/features/arrangements/hooks/useEditorTheme.ts` - Theme management with localStorage persistence and system preference detection
- **Component**: `/src/features/arrangements/components/ThemeSelector.tsx` - Theme selector UI (light/dark/stage)

### Current Problems
1. Theme system is scoped only to the ChordPro editor
2. Many components use hardcoded colors instead of CSS variables
3. No global theme provider or context
4. Inconsistent styling approaches across components
5. Header navigation has no theme toggle

### Files Requiring Theme Updates

#### Core Layout Components
- `/src/shared/components/Layout.tsx` - Hardcoded colors: `#1e293b`, `#60a5fa`, `#f8fafc`, `#94a3b8`
- `/src/shared/components/ErrorBoundary.tsx` - Error states: `#fee2e2`, `#fca5a5`, `#dc2626`

#### Page Components (All 9 Pages)
- `/src/app/pages/HomePage.tsx`
- `/src/app/pages/SearchPage.tsx`
- `/src/app/pages/SetlistDetailPage.tsx`
- `/src/app/pages/TestEditorPage.tsx`
- `/src/features/songs/pages/SongListPage.tsx`
- `/src/features/songs/pages/SongDetailPage.tsx`
- `/src/features/setlists/pages/SetlistPage.tsx`
- `/src/features/arrangements/pages/ArrangementViewerPage.tsx`
- `/src/features/arrangements/pages/ChordEditingPage.tsx`

#### Feature Components
See comprehensive list in research findings - over 30 components with hardcoded colors.

## Implementation Blueprint

### Phase 1: Theme Infrastructure Setup

#### 1.1 Create Global Theme CSS Variables
Create `/src/shared/styles/theme-variables.css`:
```css
/* Light Theme (Default in CSS, but dark in app) */
:root {
  /* Core colors */
  --color-background: #ffffff;
  --color-foreground: #f8fafc;
  --color-card: #ffffff;
  --color-card-hover: #f9fafb;
  --color-popover: #ffffff;
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f3f4f6;
  --color-secondary-foreground: #1f2937;
  --color-muted: #f9fafb;
  --color-muted-foreground: #6b7280;
  --color-accent: #f3f4f6;
  --color-accent-foreground: #1f2937;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-border: #e5e7eb;
  --color-input: #e5e7eb;
  --color-ring: #3b82f6;
  
  /* Text colors */
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  
  /* Status colors */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-error: #dc2626;
  --status-info: #3b82f6;
  
  /* Navigation specific */
  --nav-background: #1e293b;
  --nav-text: #ffffff;
  --nav-active: #60a5fa;
  --nav-hover: rgba(96, 165, 250, 0.1);
}

/* Dark Theme */
[data-theme="dark"] {
  --color-background: #0f172a;
  --color-foreground: #1e293b;
  --color-card: #1e293b;
  --color-card-hover: #334155;
  --color-popover: #1e293b;
  --color-primary: #60a5fa;
  --color-primary-foreground: #0f172a;
  --color-secondary: #334155;
  --color-secondary-foreground: #f1f5f9;
  --color-muted: #334155;
  --color-muted-foreground: #94a3b8;
  --color-accent: #334155;
  --color-accent-foreground: #f1f5f9;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #f1f5f9;
  --color-border: #334155;
  --color-input: #334155;
  --color-ring: #60a5fa;
  
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  
  --status-success: #34d399;
  --status-warning: #fbbf24;
  --status-error: #f87171;
  --status-info: #60a5fa;
  
  --nav-background: #0f172a;
  --nav-text: #f1f5f9;
  --nav-active: #60a5fa;
  --nav-hover: rgba(96, 165, 250, 0.1);
}

/* Stage Theme (High Contrast for Performance) */
[data-theme="stage"] {
  --color-background: #000000;
  --color-foreground: #0a0a0a;
  --color-card: #0a0a0a;
  --color-card-hover: #1a1a1a;
  --color-popover: #0a0a0a;
  --color-primary: #ffeb3b;
  --color-primary-foreground: #000000;
  --color-secondary: #1a1a1a;
  --color-secondary-foreground: #ffffff;
  --color-muted: #1a1a1a;
  --color-muted-foreground: #a0a0a0;
  --color-accent: #1a1a1a;
  --color-accent-foreground: #ffffff;
  --color-destructive: #ff5252;
  --color-destructive-foreground: #ffffff;
  --color-border: #333333;
  --color-input: #333333;
  --color-ring: #ffeb3b;
  
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-tertiary: #a0a0a0;
  
  --status-success: #4caf50;
  --status-warning: #ff9800;
  --status-error: #f44336;
  --status-info: #00bcd4;
  
  --nav-background: #000000;
  --nav-text: #ffffff;
  --nav-active: #ffeb3b;
  --nav-hover: rgba(255, 235, 59, 0.1);
}

/* Smooth theme transitions */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none;
  }
}
```

#### 1.2 Create Theme Context Provider
Create `/src/shared/contexts/ThemeContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'stage';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('app-theme');
    if (stored === 'light' || stored === 'dark' || stored === 'stage') {
      return stored;
    }
    // Default to dark theme instead of system preference
    return 'dark';
  }
  return 'dark';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
    
    // Also update Tailwind dark class
    if (theme === 'dark' || theme === 'stage') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => {
      const themes: Theme[] = ['light', 'dark', 'stage'];
      const currentIndex = themes.indexOf(current);
      return themes[(currentIndex + 1) % themes.length];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

#### 1.3 Create Theme Toggle Component
Create `/src/shared/components/ThemeToggle.tsx`:
```typescript
import { useTheme } from '@shared/contexts/ThemeContext';
import type { Theme } from '@shared/contexts/ThemeContext';

const themeIcons: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  stage: '🎭'
};

const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  stage: 'Stage'
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-border)',
        borderRadius: '0.375rem',
        padding: '0.5rem 0.75rem',
        color: 'var(--nav-text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      aria-label={`Switch to ${themeLabels[theme]} theme`}
    >
      <span>{themeIcons[theme]}</span>
      <span>{themeLabels[theme]}</span>
    </button>
  );
}
```

### Phase 2: Update Core Components

#### 2.1 Update Layout Component
Modify `/src/shared/components/Layout.tsx`:
1. Import ThemeToggle component
2. Replace all hardcoded colors with CSS variables
3. Add ThemeToggle to header between navigation links and auth buttons

Example transformation:
```typescript
// Before
style={{ backgroundColor: '#1e293b' }}
// After
style={{ backgroundColor: 'var(--nav-background)' }}
```

#### 2.2 Update App.tsx
Wrap the app with ThemeProvider:
```typescript
import { ThemeProvider } from '@shared/contexts/ThemeContext';

function App() {
  // ... existing code
  return (
    <ErrorBoundary level="app">
      <ThemeProvider>
        <NotificationProvider>
          {/* ... rest of app */}
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

### Phase 3: Component Migration Strategy

For each component with hardcoded colors:
1. Replace hex colors with CSS variables
2. Test in all three themes
3. Ensure proper contrast ratios

#### Migration Map:
```typescript
// Color mapping guide
const colorMigrationMap = {
  // Backgrounds
  '#ffffff': 'var(--color-background)',
  '#f8fafc': 'var(--color-foreground)',
  '#f9fafb': 'var(--color-muted)',
  '#f3f4f6': 'var(--color-secondary)',
  '#f1f5f9': 'var(--color-accent)',
  
  // Text
  '#1f2937': 'var(--text-primary)',
  '#6b7280': 'var(--text-secondary)',
  '#9ca3af': 'var(--text-tertiary)',
  '#94a3b8': 'var(--text-tertiary)',
  '#64748b': 'var(--text-secondary)',
  
  // Borders
  '#e5e7eb': 'var(--color-border)',
  '#e2e8f0': 'var(--color-border)',
  
  // Status colors
  '#ef4444': 'var(--status-error)',
  '#dc2626': 'var(--status-error)',
  '#10b981': 'var(--status-success)',
  '#f59e0b': 'var(--status-warning)',
  '#3b82f6': 'var(--status-info)',
  '#60a5fa': 'var(--status-info)',
  
  // Navigation
  '#1e293b': 'var(--nav-background)',
};
```

### Phase 4: Tailwind Configuration Update

Update `/tailwind.config.js`:
```javascript
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map CSS variables to Tailwind utilities
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
      },
    },
  },
  plugins: [],
};
```

### Phase 5: Import Theme Styles

Update `/src/app/main.tsx`:
```typescript
import '@shared/styles/theme-variables.css';
// ... other imports
```

## Implementation Tasks (In Order)

1. **Create theme infrastructure files**
   - [ ] Create theme-variables.css with all CSS variables
   - [ ] Create ThemeContext.tsx with provider and hook
   - [ ] Create ThemeToggle.tsx component

2. **Update core application files**
   - [ ] Update main.tsx to import theme CSS
   - [ ] Update App.tsx to wrap with ThemeProvider
   - [ ] Update tailwind.config.js with dark mode and color mappings

3. **Update Layout component**
   - [ ] Replace hardcoded colors with CSS variables
   - [ ] Add ThemeToggle to header
   - [ ] Test theme switching works

4. **Update all page components (9 pages)**
   - [ ] HomePage.tsx
   - [ ] SearchPage.tsx
   - [ ] SetlistDetailPage.tsx
   - [ ] TestEditorPage.tsx
   - [ ] SongListPage.tsx
   - [ ] SongDetailPage.tsx
   - [ ] SetlistPage.tsx
   - [ ] ArrangementViewerPage.tsx
   - [ ] ChordEditingPage.tsx

5. **Update feature components**
   - [ ] Song components (SongCard, SongViewer, etc.)
   - [ ] Setlist components (SetlistCard, SetlistBuilder, etc.)
   - [ ] Search components (SearchBar, SearchResults)
   - [ ] PWA components (OfflineIndicator, UpdatePrompt, etc.)
   - [ ] Form components (FormButton, FormSelect, etc.)
   - [ ] Modal and notification components

6. **Testing and validation**
   - [ ] Test all three themes on each page
   - [ ] Verify contrast ratios meet WCAG standards
   - [ ] Test theme persistence across refreshes
   - [ ] Test theme transitions are smooth

## Validation Gates

```bash
# 1. Type checking - ensure no TypeScript errors
npm run build

# 2. Linting - check code quality
npm run lint

# 3. Start dev server and manually test
npm run dev
# Then manually:
# - Toggle through all three themes using header button
# - Verify theme persists on page refresh
# - Check all 9 pages render correctly in each theme
# - Verify no hardcoded colors remain visible

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
# Test theme switching in production build

# 6. Run any existing tests
npm run test

# Additional validation checks:
# - Open DevTools and verify CSS variables are updating
# - Check localStorage has 'app-theme' key
# - Test in Chrome, Firefox, and Safari if possible
# - Verify stage theme has high contrast for visibility
```

## Testing Checklist

For each page, verify in all three themes:
- [ ] Background colors update correctly
- [ ] Text remains readable (proper contrast)
- [ ] Buttons and interactive elements are visible
- [ ] Forms and inputs have proper styling
- [ ] Error states are distinguishable
- [ ] Navigation shows active state clearly
- [ ] Modals and overlays work properly
- [ ] No flashing during theme transitions

## Known Gotchas & Solutions

1. **ChordPro Editor Already Has Themes**
   - The editor has its own theme system - ensure it syncs with app theme
   - Update useEditorTheme to read from global theme context

2. **Hardcoded Colors in CSS Modules**
   - Search all .css and .module.css files for hex colors
   - Replace with CSS variables

3. **Inline Styles**
   - Many components use inline styles with hardcoded colors
   - Must be updated to use CSS variables

4. **Third-party Components**
   - Some Radix UI components may need theme-aware styling
   - Override with CSS variables where needed

5. **Performance**
   - Use CSS variables instead of React Context for styling to avoid re-renders
   - Only use Context for theme state management

## Success Criteria

- ✅ Three themes (light, dark, stage) fully implemented
- ✅ Dark theme is the default
- ✅ Theme toggle visible and functional in header
- ✅ All pages and components respect the selected theme
- ✅ Theme persists across page refreshes
- ✅ Smooth transitions between themes
- ✅ No hardcoded colors remain in components
- ✅ Stage theme provides high contrast for performance visibility
- ✅ All validation gates pass

## External Resources

- [CSS Custom Properties Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
- [Tailwind Dark Mode Documentation](https://tailwindcss.com/docs/dark-mode)
- [React Context with TypeScript](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

## Architecture Notes

This implementation follows a **vertical slice architecture** where the theme feature is self-contained:
- Theme context and hooks in `/src/shared/contexts/`
- Theme components in `/src/shared/components/`
- Theme styles in `/src/shared/styles/`
- Minimal cross-feature dependencies

The theme system integrates with existing features but remains decoupled, allowing for easy maintenance and extension.

---

**Confidence Score: 9/10**

This PRP provides comprehensive context and step-by-step implementation details for successfully implementing an app-wide theme system in one pass. The existing partial implementation in the ChordPro editor provides a solid foundation to build upon.