/**
 * @file enharmonicService.test.ts
 * @description Unit tests for EnharmonicService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EnharmonicService } from '../enharmonicService'

describe('EnharmonicService', () => {
  let service: EnharmonicService
  
  beforeEach(() => {
    service = new EnharmonicService()
    // Clear localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })
  
  describe('convertChord', () => {
    it('should convert sharp to flat notation', () => {
      const result = service.convertChord('C#', 'b')
      expect(result).toBe('Db')
    })
    
    it('should convert flat to sharp notation', () => {
      const result = service.convertChord('Bb', '#')
      expect(result).toBe('A#')
    })
    
    it('should preserve chord quality when converting', () => {
      const result = service.convertChord('Ebm7', '#')
      expect(result).toBe('D#m7')
    })
    
    it('should handle complex chords', () => {
      const result = service.convertChord('F#sus4', 'b')
      expect(result).toBe('Gbsus4')
    })
    
    it('should handle slash chords', () => {
      const result = service.convertChord('C#/G#', 'b')
      expect(result).toBe('Db/Ab')
    })
    
    it('should handle non-standard chords gracefully', () => {
      // ChordSheetJS may try to parse even invalid chords
      const result = service.convertChord('XYZ123', '#')
      expect(typeof result).toBe('string')
      // Should at least return something
      expect(result).toBeTruthy()
    })
  })
  
  describe('isEnharmonicKey', () => {
    it('should identify enharmonic keys', () => {
      expect(service.isEnharmonicKey('C#')).toBe(true)
      expect(service.isEnharmonicKey('Db')).toBe(true)
      expect(service.isEnharmonicKey('F#')).toBe(true)
      expect(service.isEnharmonicKey('Gb')).toBe(true)
      expect(service.isEnharmonicKey('A#m')).toBe(true)
      expect(service.isEnharmonicKey('Bbm')).toBe(true)
    })
    
    it('should return false for non-enharmonic keys', () => {
      expect(service.isEnharmonicKey('C')).toBe(false)
      expect(service.isEnharmonicKey('G')).toBe(false)
      expect(service.isEnharmonicKey('Am')).toBe(false)
      expect(service.isEnharmonicKey('Em')).toBe(false)
    })
  })
  
  describe('getEnharmonicEquivalent', () => {
    it('should return correct enharmonic equivalent', () => {
      expect(service.getEnharmonicEquivalent('C#')).toBe('Db')
      expect(service.getEnharmonicEquivalent('Db')).toBe('C#')
      expect(service.getEnharmonicEquivalent('F#')).toBe('Gb')
      expect(service.getEnharmonicEquivalent('Gb')).toBe('F#')
      expect(service.getEnharmonicEquivalent('A#')).toBe('Bb')
      expect(service.getEnharmonicEquivalent('Bb')).toBe('A#')
    })
    
    it('should preserve minor keys', () => {
      expect(service.getEnharmonicEquivalent('C#m')).toBe('Dbm')
      expect(service.getEnharmonicEquivalent('Bbm')).toBe('A#m')
    })
    
    it('should return null for non-enharmonic keys', () => {
      expect(service.getEnharmonicEquivalent('C')).toBe(null)
      expect(service.getEnharmonicEquivalent('G')).toBe(null)
      expect(service.getEnharmonicEquivalent('Am')).toBe(null)
    })
  })
  
  describe('preference management', () => {
    it('should save and retrieve preferences', () => {
      service.setPreference({ preference: 'sharp' })
      const pref = service.getPreference()
      expect(pref.preference).toBe('sharp')
    })
    
    it('should persist preferences to localStorage', () => {
      service.setPreference({ preference: 'flat', contextKey: 'F' })
      const stored = localStorage.getItem('enharmonic-preference')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.preference).toBe('flat')
      expect(parsed.contextKey).toBe('F')
    })
    
    it('should load preferences from localStorage', () => {
      localStorage.setItem('enharmonic-preference', JSON.stringify({
        preference: 'sharp',
        contextKey: 'G'
      }))
      const newService = new EnharmonicService()
      const pref = newService.getPreference()
      expect(pref.preference).toBe('sharp')
      expect(pref.contextKey).toBe('G')
    })
  })
  
  describe('convertAllChords', () => {
    it('should convert multiple chords', () => {
      const chords = ['C#', 'F#', 'G#7']
      const result = service.convertAllChords(chords, 'b')
      expect(result).toEqual(['Db', 'Gb', 'Ab7'])
    })
  })
  
  describe('context-aware conversion', () => {
    it('should use flats in F major context', () => {
      const result = service.convertWithContext('A#', 'F')
      expect(result).toBe('Bb')
    })
    
    it('should use sharps in G major context', () => {
      const result = service.convertWithContext('Gb', 'G')
      expect(result).toBe('F#')
    })
    
    it('should use flats in Bb major context', () => {
      const result = service.convertWithContext('D#', 'Bb')
      expect(result).toBe('Eb')
    })
    
    it('should use sharps in D major context', () => {
      const result = service.convertWithContext('Db', 'D')
      expect(result).toBe('C#')
    })
  })
  
  describe('suggestSpelling', () => {
    it('should suggest appropriate spelling based on key', () => {
      expect(service.suggestSpelling('A#', 'F')).toBe('Bb')
      expect(service.suggestSpelling('Gb', 'D')).toBe('F#')
    })
  })
})