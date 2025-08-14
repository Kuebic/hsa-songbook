import { describe, it, expect } from 'vitest'
import { compressionService } from '../compressionService'

describe('CompressionService', () => {
  const testChordPro = `{title: Test Song}
{key: C}
[Verse 1]
[C]This is a [G]test [Am]song
With [F]chord [C]data`

  describe('compression and decompression', () => {
    it('should compress and decompress chord data correctly', async () => {
      const compressed = await compressionService.compressChordPro(testChordPro)
      expect(compressed).toBeInstanceOf(Buffer)
      expect(compressed.length).toBeLessThan(Buffer.byteLength(testChordPro))

      const decompressed = await compressionService.decompressChordPro(compressed)
      expect(decompressed).toBe(testChordPro)
    })

    it('should handle MongoDB lean() buffer format', async () => {
      const compressed = await compressionService.compressChordPro(testChordPro)
      
      // Simulate MongoDB lean() format
      const mongoLeanFormat = {
        type: 'Buffer',
        data: Array.from(compressed)
      }

      const decompressed = await compressionService.decompressChordPro(mongoLeanFormat)
      expect(decompressed).toBe(testChordPro)
    })

    it('should handle MongoDB Binary type from lean queries', async () => {
      const compressed = await compressionService.compressChordPro(testChordPro)
      
      // Simulate MongoDB Binary type (what lean() actually returns for Buffer fields)
      const mongoBinaryFormat = {
        sub_type: 0,
        buffer: compressed,
        position: compressed.length
      }

      const decompressed = await compressionService.decompressChordPro(mongoBinaryFormat)
      expect(decompressed).toBe(testChordPro)
    })

    it('should handle Uint8Array format', async () => {
      const compressed = await compressionService.compressChordPro(testChordPro)
      const uint8Array = new Uint8Array(compressed)

      const decompressed = await compressionService.decompressChordPro(uint8Array)
      expect(decompressed).toBe(testChordPro)
    })

    it('should throw error for invalid data format', async () => {
      await expect(
        compressionService.decompressChordPro('invalid string data')
      ).rejects.toThrow('Failed to decompress chord data')

      await expect(
        compressionService.decompressChordPro({ invalid: 'object' })
      ).rejects.toThrow('Failed to decompress chord data')
    })
  })

  describe('compression metrics', () => {
    it('should calculate correct compression metrics', async () => {
      const compressed = await compressionService.compressChordPro(testChordPro)
      const metrics = compressionService.calculateMetrics(testChordPro, compressed)

      expect(metrics.originalSize).toBe(Buffer.byteLength(testChordPro))
      expect(metrics.compressedSize).toBe(compressed.length)
      expect(metrics.ratio).toBeGreaterThan(0)
      expect(metrics.savings).toBe(metrics.originalSize - metrics.compressedSize)
    })
  })

  describe('batch compression', () => {
    it('should compress multiple items', async () => {
      const items = [
        { id: '1', chordProText: testChordPro },
        { id: '2', chordProText: testChordPro + '\n[Verse 2]\nMore lyrics' }
      ]

      const results = await compressionService.compressMultiple(items)

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('1')
      expect(results[0].compressed).toBeInstanceOf(Buffer)
      expect(results[0].metrics.ratio).toBeGreaterThan(0)
      expect(results[1].id).toBe('2')
    })
  })
})