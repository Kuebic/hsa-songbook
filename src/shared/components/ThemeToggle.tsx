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