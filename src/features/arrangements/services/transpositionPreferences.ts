interface TranspositionPreference {
  semitones: number
  lastModified: string
}

interface TranspositionPreferences {
  [arrangementId: string]: TranspositionPreference
}

const STORAGE_KEY = 'transpose-prefs'

class TranspositionPreferencesService {
  /**
   * Get transposition preference for an arrangement
   */
  get(arrangementId: string): number {
    try {
      const prefs = this.getAll()
      return prefs[arrangementId]?.semitones || 0
    } catch (error) {
      console.error('Failed to get transposition preference:', error)
      return 0
    }
  }
  
  /**
   * Set transposition preference for an arrangement
   */
  set(arrangementId: string, semitones: number): void {
    try {
      const prefs = this.getAll()
      prefs[arrangementId] = {
        semitones,
        lastModified: new Date().toISOString()
      }
      this.save(prefs)
    } catch (error) {
      console.error('Failed to set transposition preference:', error)
    }
  }
  
  /**
   * Remove transposition preference for an arrangement
   */
  clear(arrangementId: string): void {
    try {
      const prefs = this.getAll()
      delete prefs[arrangementId]
      this.save(prefs)
    } catch (error) {
      console.error('Failed to clear transposition preference:', error)
    }
  }
  
  /**
   * Clear all transposition preferences
   */
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear all transposition preferences:', error)
    }
  }
  
  /**
   * Get all transposition preferences
   */
  getAll(): TranspositionPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return {}
      
      const parsed = JSON.parse(stored)
      
      // Validate the structure
      if (typeof parsed !== 'object' || parsed === null) {
        return {}
      }
      
      // Clean up old entries (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const cleaned: TranspositionPreferences = {}
      for (const [key, value] of Object.entries(parsed)) {
        if (
          typeof value === 'object' &&
          value !== null &&
          'semitones' in value &&
          'lastModified' in value
        ) {
          const pref = value as TranspositionPreference
          const lastModified = new Date(pref.lastModified)
          
          // Keep if modified within last 30 days
          if (lastModified > thirtyDaysAgo) {
            cleaned[key] = pref
          }
        }
      }
      
      // Save cleaned preferences if different
      if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
        this.save(cleaned)
      }
      
      return cleaned
    } catch (error) {
      console.error('Failed to get all transposition preferences:', error)
      return {}
    }
  }
  
  /**
   * Check if an arrangement has a transposition preference
   */
  has(arrangementId: string): boolean {
    const prefs = this.getAll()
    return arrangementId in prefs
  }
  
  /**
   * Get the count of stored preferences
   */
  count(): number {
    return Object.keys(this.getAll()).length
  }
  
  /**
   * Export preferences as JSON
   */
  export(): string {
    return JSON.stringify(this.getAll(), null, 2)
  }
  
  /**
   * Import preferences from JSON
   */
  import(json: string): boolean {
    try {
      const prefs = JSON.parse(json)
      
      // Validate structure
      if (typeof prefs !== 'object' || prefs === null) {
        throw new Error('Invalid preferences format')
      }
      
      // Validate each entry
      for (const [key, value] of Object.entries(prefs)) {
        if (
          typeof value !== 'object' ||
          value === null ||
          !('semitones' in value) ||
          !('lastModified' in value)
        ) {
          throw new Error(`Invalid preference entry: ${key}`)
        }
      }
      
      this.save(prefs as TranspositionPreferences)
      return true
    } catch (error) {
      console.error('Failed to import transposition preferences:', error)
      return false
    }
  }
  
  /**
   * Save preferences to localStorage
   */
  private save(prefs: TranspositionPreferences): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }
}

// Export singleton instance
export const transpositionPreferences = new TranspositionPreferencesService()