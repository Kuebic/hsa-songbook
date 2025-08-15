import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from './theme-types';
import { ThemeContext } from './theme-context';

// Re-export for backward compatibility
export { useTheme } from './useTheme';
export type { Theme, ThemeContextType } from './theme-types';

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

