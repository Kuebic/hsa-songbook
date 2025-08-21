/**
 * @file preferences.types.ts
 * @description Type definitions for chord sheet display preferences
 */

export interface ChordDisplayPreferences {
  /** Font size in pixels */
  fontSize: number;
  
  /** Font family for chord sheet display */
  fontFamily: string;
  
  /** Line height multiplier */
  lineHeight: number;
  
  /** Chord color (hex or CSS color) */
  chordColor: string;
  
  /** Lyric color (hex or CSS color) */
  lyricColor: string;
  
  /** Whether to show chord diagrams */
  showChordDiagrams: boolean;
  
  /** Auto-scroll speed (0 = disabled) */
  autoScrollSpeed: number;
  
  /** Transpose value (-11 to +11) */
  defaultTranspose: number;
  
  /** Theme preference for chord sheet */
  theme: 'light' | 'dark' | 'auto' | 'stage';
}

export interface PreferenceUpdateEvent extends CustomEvent {
  detail: {
    preferences: ChordDisplayPreferences;
    changedKeys: (keyof ChordDisplayPreferences)[];
  };
}

export interface RenderOptions {
  /** Override font size for this render */
  fontSize?: number;
  
  /** Override font family for this render */
  fontFamily?: string;
  
  /** Apply transposition */
  transpose?: number;
  
  /** Show/hide chord diagrams */
  showDiagrams?: boolean;
  
  /** Theme for rendering (used for cache key) */
  theme?: string;
}

export const DEFAULT_PREFERENCES: ChordDisplayPreferences = {
  fontSize: 16,
  fontFamily: 'monospace',
  lineHeight: 1.6,
  chordColor: '#2563eb',
  lyricColor: '#374151',
  showChordDiagrams: false,
  autoScrollSpeed: 0,
  defaultTranspose: 0,
  theme: 'auto'
};

export const FONT_FAMILY_OPTIONS = [
  { value: 'monospace', label: 'Monospace' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: "'Roboto Mono', monospace", label: 'Roboto Mono' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: 'system-ui, sans-serif', label: 'System Default' },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Segoe UI', sans-serif", label: 'Segoe UI' }
];

export const FONT_SIZE_RANGE = {
  min: 12,
  max: 24,
  step: 1
};

export const LINE_HEIGHT_RANGE = {
  min: 1.2,
  max: 2.0,
  step: 0.1
};