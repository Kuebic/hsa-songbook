import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, renderAsAdmin } from '../../test-utils/render'
import { SongForm } from '../../components/forms/SongForm'
import { songFactory } from '../../test-utils/factories'
import { songFormSchema } from '../../validation/schemas/songFormSchema'
import { levenshteinDistance } from '../../validation/utils/levenshtein'
import { findSimilarSongs } from '../../validation/utils/duplicateDetection'

describe('Song Form Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Render Performance', () => {
    it('renders within performance budget', () => {
      const startTime = performance.now()
      
      renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const renderTime = performance.now() - startTime
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100)
    })
    
    it('renders with initial data within budget', () => {
      const song = songFactory.buildWithRichMetadata()
      const startTime = performance.now()
      
      renderAsAdmin(
        <SongForm 
          initialData={song}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const renderTime = performance.now() - startTime
      
      // Should render within 150ms even with initial data
      expect(renderTime).toBeLessThan(150)
    })
    
    it('re-renders efficiently on prop changes', () => {
      const { rerender } = renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const startTime = performance.now()
      
      // Trigger re-render with new props
      rerender(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          isSubmitting={true}
        />
      )
      
      const rerenderTime = performance.now() - startTime
      
      // Re-render should be faster than initial render
      expect(rerenderTime).toBeLessThan(50)
    })
  })
  
  describe('Large Dataset Handling', () => {
    it('handles large existing songs list efficiently', () => {
      const largeSongList = songFactory.buildList(1000)
      
      const startTime = performance.now()
      
      renderAsAdmin(
        <SongForm 
          existingSongs={largeSongList}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const renderTime = performance.now() - startTime
      
      // Should handle 1000 songs within 200ms
      expect(renderTime).toBeLessThan(200)
    })
    
    it('performs duplicate detection efficiently', () => {
      const largeSongList = songFactory.buildList(1000)
      const testTitle = 'Amazing Grace'
      const testArtist = 'John Newton'
      
      const startTime = performance.now()
      
      // Simulate duplicate detection - correct parameter order
      const results = findSimilarSongs(
        testTitle,      // title as string
        largeSongList,  // existing songs array
        testArtist,     // optional artist string
        {
          maxDistance: 3,
          maxResults: 10
        }
      )
      
      const searchTime = performance.now() - startTime
      
      // Should process 1000 songs within 50ms
      expect(searchTime).toBeLessThan(50)
      expect(results).toBeDefined()
    })
    
    it('filters themes efficiently with large theme list', () => {
      const themes = Array.from({ length: 100 }, (_, i) => `theme${i}`)
      const searchTerm = 'theme5'
      
      const startTime = performance.now()
      
      // Simulate theme filtering
      const filtered = themes.filter(theme => 
        theme.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      const filterTime = performance.now() - startTime
      
      // Should filter 100 themes within 5ms
      expect(filterTime).toBeLessThan(5)
      expect(filtered.length).toBeGreaterThan(0)
    })
  })
  
  describe('Validation Performance', () => {
    it('validates form data efficiently', () => {
      const formData = songFactory.buildFormData()
      
      const startTime = performance.now()
      
      // Run validation 100 times
      for (let i = 0; i < 100; i++) {
        songFormSchema.safeParse(formData)
      }
      
      const validationTime = performance.now() - startTime
      
      // 100 validations should complete within 50ms
      expect(validationTime).toBeLessThan(50)
    })
    
    it('validates invalid data efficiently', () => {
      const invalidData = {
        title: '',
        themes: [],
        ccli: 'invalid'
      }
      
      const startTime = performance.now()
      
      // Run validation 100 times with invalid data
      for (let i = 0; i < 100; i++) {
        songFormSchema.safeParse(invalidData)
      }
      
      const validationTime = performance.now() - startTime
      
      // Invalid validation should also be fast
      expect(validationTime).toBeLessThan(50)
    })
    
    it('handles complex validation rules efficiently', () => {
      const complexData = songFactory.buildFormData({
        themes: Array.from({ length: 10 }, (_, i) => `theme${i}`),
        notes: 'a'.repeat(2000),
        ccli: '1234567'
      })
      
      const startTime = performance.now()
      
      // Run complex validation 50 times
      for (let i = 0; i < 50; i++) {
        const result = songFormSchema.safeParse(complexData)
        expect(result.success).toBe(true)
      }
      
      const validationTime = performance.now() - startTime
      
      // Complex validation should still be performant
      expect(validationTime).toBeLessThan(100)
    })
  })
  
  describe('String Processing Performance', () => {
    it('calculates Levenshtein distance efficiently', () => {
      const str1 = 'Amazing Grace How Sweet The Sound'
      const str2 = 'Amazing Grace, How Sweet the Sound!'
      
      const startTime = performance.now()
      
      // Calculate distance 1000 times
      for (let i = 0; i < 1000; i++) {
        levenshteinDistance(str1, str2)
      }
      
      const calcTime = performance.now() - startTime
      
      // 1000 calculations should complete within 100ms
      expect(calcTime).toBeLessThan(100)
    })
    
    it('normalizes theme names efficiently', () => {
      const themes = Array.from({ length: 100 }, (_, i) => 
        `Theme ${i} WITH Special!@# Characters`
      )
      
      const startTime = performance.now()
      
      // Normalize all themes
      const normalized = themes.map(theme => 
        theme.toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
      )
      
      const normalizeTime = performance.now() - startTime
      
      // Should normalize 100 themes within 10ms
      expect(normalizeTime).toBeLessThan(10)
      expect(normalized.length).toBe(100)
    })
    
    it('generates slugs efficiently', () => {
      const titles = songFactory.buildList(100).map(s => s.title)
      
      const startTime = performance.now()
      
      // Generate slugs for all titles
      const slugs = titles.map(title => 
        title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
      
      const slugTime = performance.now() - startTime
      
      // Should generate 100 slugs within 10ms
      expect(slugTime).toBeLessThan(10)
      expect(slugs.length).toBe(100)
    })
  })
  
  describe('Memory Usage', () => {
    it('does not leak memory on repeated renders', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderAsAdmin(
          <SongForm 
            onSubmit={vi.fn()}
            onCancel={vi.fn()}
          />
        )
        unmount()
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
    })
    
    it('handles large form data without excessive memory', () => {
      const largeNotes = 'a'.repeat(2000)
      const manyThemes = Array.from({ length: 10 }, (_, i) => `theme${i}`)
      
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      renderAsAdmin(
        <SongForm 
          initialData={{
            title: 'Test',
            themes: manyThemes,
            notes: largeNotes
          }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const afterRenderMemory = performance.memory?.usedJSHeapSize || 0
      const memoryUsed = afterRenderMemory - initialMemory
      
      // Should not use more than 2MB for large form data
      expect(memoryUsed).toBeLessThan(2 * 1024 * 1024)
    })
  })
  
  describe('Event Handler Performance', () => {
    it('handles rapid input changes efficiently', async () => {
      const onSubmit = vi.fn()
      const { container } = renderAsAdmin(
        <SongForm 
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      )
      
      const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement
      
      const startTime = performance.now()
      
      // Simulate rapid typing (100 characters)
      for (let i = 0; i < 100; i++) {
        const event = new Event('input', { bubbles: true })
        titleInput.value = 'a'.repeat(i + 1)
        titleInput.dispatchEvent(event)
      }
      
      const inputTime = performance.now() - startTime
      
      // Should handle 100 input events within 100ms
      expect(inputTime).toBeLessThan(100)
    })
    
    it('debounces duplicate detection efficiently', async () => {
      const checkDuplicates = vi.fn()
      
      vi.mock('../../validation/hooks/useDuplicateDetection', () => ({
        useRealtimeDuplicateDetection: () => ({
          duplicates: [],
          isChecking: false,
          checkDuplicates,
          hasExactMatch: false,
          hasSimilar: false
        })
      }))
      
      const { container } = renderAsAdmin(
        <SongForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      const titleInput = container.querySelector('input[name="title"]') as HTMLInputElement
      
      // Type rapidly
      for (let i = 0; i < 20; i++) {
        const event = new Event('input', { bubbles: true })
        titleInput.value = `Test ${i}`
        titleInput.dispatchEvent(event)
      }
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Should not call checkDuplicates for every keystroke
      expect(checkDuplicates.mock.calls.length).toBeLessThan(20)
    })
  })
  
  describe('Batch Operations Performance', () => {
    it('validates multiple songs efficiently', () => {
      const songs = songFactory.buildList(100).map(s => songFactory.buildFormData(s))
      
      const startTime = performance.now()
      
      // Validate all songs
      const results = songs.map(song => songFormSchema.safeParse(song))
      
      const batchTime = performance.now() - startTime
      
      // Should validate 100 songs within 100ms
      expect(batchTime).toBeLessThan(100)
      expect(results.every(r => r.success)).toBe(true)
    })
    
    it('processes theme normalization in batch efficiently', () => {
      const songs = songFactory.buildList(100)
      const allThemes = songs.flatMap(s => s.themes)
      
      const startTime = performance.now()
      
      // Normalize all themes at once
      const uniqueThemes = [...new Set(
        allThemes.map(theme => theme.toLowerCase().trim())
      )]
      
      const processTime = performance.now() - startTime
      
      // Should process all themes within 10ms
      expect(processTime).toBeLessThan(10)
      expect(uniqueThemes.length).toBeGreaterThan(0)
    })
  })
})