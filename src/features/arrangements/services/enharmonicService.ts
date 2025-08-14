/**
 * @file enharmonicService.ts
 * @description Service for handling enharmonic conversions and preferences
 */

import { Chord } from 'chordsheetjs';

export interface EnharmonicPreference {
  preference: 'sharp' | 'flat' | 'auto';
  contextKey?: string;
}

export class EnharmonicService {
  private preference: EnharmonicPreference = { preference: 'auto' };
  
  // Enharmonic key pairs
  private readonly ENHARMONIC_PAIRS = [
    { sharp: 'C#', flat: 'Db' },
    { sharp: 'D#', flat: 'Eb' },
    { sharp: 'F#', flat: 'Gb' },
    { sharp: 'G#', flat: 'Ab' },
    { sharp: 'A#', flat: 'Bb' }
  ];
  
  // Key signature preferences (flats preferred)
  private readonly FLAT_KEY_SIGNATURES = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  private readonly SHARP_KEY_SIGNATURES = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  
  setPreference(pref: EnharmonicPreference): void {
    this.preference = pref;
    localStorage.setItem('enharmonic-preference', JSON.stringify(pref));
  }
  
  getPreference(): EnharmonicPreference {
    const stored = localStorage.getItem('enharmonic-preference');
    if (stored) {
      try {
        this.preference = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse enharmonic preference:', e);
      }
    }
    return this.preference;
  }
  
  convertChord(chordSymbol: string, targetModifier?: '#' | 'b'): string {
    try {
      const chord = Chord.parse(chordSymbol);
      if (!chord) return chordSymbol;
      
      // Determine modifier based on preference
      const modifier = targetModifier || this.determineModifier(chordSymbol);
      const result = chord.useModifier(modifier).toString();
      
      // Return result if it's a valid conversion
      return result || chordSymbol;
    } catch (e) {
      console.error('Failed to convert chord:', e);
      return chordSymbol;
    }
  }
  
  convertAllChords(chords: string[], targetModifier: '#' | 'b'): string[] {
    return chords.map(chord => this.convertChord(chord, targetModifier));
  }
  
  private determineModifier(chordSymbol: string): '#' | 'b' {
    if (this.preference.preference === 'sharp') return '#';
    if (this.preference.preference === 'flat') return 'b';
    
    // Auto mode: use context
    if (this.preference.contextKey) {
      const baseKey = this.preference.contextKey.replace('m', '');
      if (this.FLAT_KEY_SIGNATURES.includes(baseKey)) return 'b';
      if (this.SHARP_KEY_SIGNATURES.includes(baseKey)) return '#';
    }
    
    // Default to current notation
    return chordSymbol.includes('b') ? 'b' : '#';
  }
  
  isEnharmonicKey(key: string): boolean {
    const baseKey = key.replace('m', '');
    return this.ENHARMONIC_PAIRS.some(
      pair => pair.sharp === baseKey || pair.flat === baseKey
    );
  }
  
  getEnharmonicEquivalent(key: string): string | null {
    const isMinor = key.endsWith('m');
    const baseKey = key.replace('m', '');
    
    const pair = this.ENHARMONIC_PAIRS.find(
      p => p.sharp === baseKey || p.flat === baseKey
    );
    
    if (!pair) return null;
    
    const equivalent = pair.sharp === baseKey ? pair.flat : pair.sharp;
    return isMinor ? `${equivalent}m` : equivalent;
  }
  
  // Context-aware conversion using key signature
  convertWithContext(chord: string, keyContext: string): string {
    const savedPref = this.preference;
    this.preference = { preference: 'auto', contextKey: keyContext };
    const result = this.convertChord(chord);
    this.preference = savedPref;
    return result;
  }
  
  // Suggest best spelling based on key
  suggestSpelling(chord: string, key: string): string {
    return this.convertWithContext(chord, key);
  }
}

export const enharmonicService = new EnharmonicService();