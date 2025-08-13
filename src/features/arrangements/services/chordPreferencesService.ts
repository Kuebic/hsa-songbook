/**
 * @file chordPreferencesService.ts
 * @description Service for managing chord display preferences with localStorage persistence
 */

import type { 
  ChordDisplayPreferences, 
  PreferenceUpdateEvent 
} from '../types/preferences.types';
import { DEFAULT_PREFERENCES } from '../types/preferences.types';

export class ChordPreferencesService {
  private static instance: ChordPreferencesService;
  private readonly STORAGE_KEY = 'chord-display-preferences';
  private readonly EVENT_NAME = 'chord-preferences-changed';
  private preferences: ChordDisplayPreferences;
  private listeners: Set<(preferences: ChordDisplayPreferences) => void> = new Set();

  private constructor() {
    this.preferences = this.loadPreferences();
    this.setupStorageListener();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ChordPreferencesService {
    if (!ChordPreferencesService.instance) {
      ChordPreferencesService.instance = new ChordPreferencesService();
    }
    return ChordPreferencesService.instance;
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): ChordDisplayPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load chord preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save chord preferences:', error);
    }
  }

  /**
   * Setup cross-tab synchronization
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY && event.newValue) {
        try {
          const newPreferences = JSON.parse(event.newValue);
          this.preferences = { ...DEFAULT_PREFERENCES, ...newPreferences };
          this.notifyListeners();
        } catch (error) {
          console.error('Failed to sync preferences across tabs:', error);
        }
      }
    });
  }

  /**
   * Get current preferences
   */
  getPreferences(): ChordDisplayPreferences {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<ChordDisplayPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    
    // Identify changed keys
    const changedKeys = Object.keys(updates) as (keyof ChordDisplayPreferences)[];
    
    // Save to localStorage
    this.savePreferences();
    
    // Dispatch custom event for cross-component communication
    const event = new CustomEvent(this.EVENT_NAME, {
      detail: { 
        preferences: this.preferences,
        changedKeys 
      }
    }) as PreferenceUpdateEvent;
    window.dispatchEvent(event);
    
    // Notify local listeners
    this.notifyListeners();
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    
    const event = new CustomEvent(this.EVENT_NAME, {
      detail: { 
        preferences: this.preferences,
        changedKeys: Object.keys(DEFAULT_PREFERENCES) as (keyof ChordDisplayPreferences)[]
      }
    }) as PreferenceUpdateEvent;
    window.dispatchEvent(event);
    
    this.notifyListeners();
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(listener: (preferences: ChordDisplayPreferences) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of preference changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.preferences);
      } catch (error) {
        console.error('Error in preference listener:', error);
      }
    });
  }

  /**
   * Get a specific preference value
   */
  getPreference<K extends keyof ChordDisplayPreferences>(
    key: K
  ): ChordDisplayPreferences[K] {
    return this.preferences[key];
  }

  /**
   * Update a single preference
   */
  setPreference<K extends keyof ChordDisplayPreferences>(
    key: K, 
    value: ChordDisplayPreferences[K]
  ): void {
    this.updatePreferences({ [key]: value });
  }

  /**
   * Check if preferences have been customized
   */
  hasCustomPreferences(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Export preferences as JSON string
   */
  exportPreferences(): string {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences from JSON string
   */
  importPreferences(json: string): void {
    try {
      const imported = JSON.parse(json);
      // Validate that it has the right structure
      if (typeof imported === 'object' && imported !== null) {
        this.updatePreferences(imported);
      } else {
        throw new Error('Invalid preferences format');
      }
    } catch (error) {
      console.error('Failed to import preferences:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chordPreferencesService = ChordPreferencesService.getInstance();