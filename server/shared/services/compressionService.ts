import { compress, decompress } from '@mongodb-js/zstd'
import config from '../config/env'
import { createLogger } from './logger'
import { COMPRESSION } from '../constants'

const logger = createLogger('CompressionService')

export interface CompressionMetrics {
  originalSize: number
  compressedSize: number
  ratio: number
  savings: number
}

export class CompressionService {
  private readonly compressionLevel: number

  constructor() {
    this.compressionLevel = config.zstdCompressionLevel || COMPRESSION.LEVEL
  }

  /**
   * Compress ChordPro text data to Buffer
   * @param chordProText - Raw ChordPro formatted text
   * @returns Compressed Buffer
   */
  async compressChordPro(chordProText: string): Promise<Buffer> {
    try {
      const buffer = Buffer.from(chordProText, 'utf-8')
      const compressed = await compress(buffer, this.compressionLevel)
      
      // Log compression ratio for monitoring
      const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(2)
      
      if (COMPRESSION.LOG_METRICS) {
        logger.debug('ChordPro compressed', {
          originalSize: buffer.length,
          compressedSize: compressed.length,
          ratio: `${ratio}%`
        })
      }
      
      return compressed
    } catch (error) {
      logger.error('Compression failed', error as Error)
      throw new Error('Failed to compress chord data')
    }
  }

  /**
   * Decompress Buffer back to ChordPro text
   * @param compressedData - Compressed Buffer from database
   * @returns Original ChordPro text
   */
  async decompressChordPro(compressedData: Buffer | { type: 'Buffer'; data: number[] } | Uint8Array | unknown): Promise<string> {
    try {
      // Handle MongoDB lean() which returns Buffer-like objects
      let buffer: Buffer
      if (Buffer.isBuffer(compressedData)) {
        buffer = compressedData
      } else if (compressedData && typeof compressedData === 'object' && 'type' in compressedData && 'data' in compressedData && compressedData.type === 'Buffer' && Array.isArray(compressedData.data)) {
        // MongoDB lean() returns { type: 'Buffer', data: [...] }
        buffer = Buffer.from(compressedData.data as number[])
      } else if (compressedData instanceof Uint8Array) {
        buffer = Buffer.from(compressedData)
      } else if (compressedData && compressedData.buffer && Buffer.isBuffer(compressedData.buffer)) {
        // Handle MongoDB Binary type (from lean() queries)
        // Binary objects have a 'buffer' property that contains the actual Buffer
        buffer = compressedData.buffer
      } else if (compressedData && compressedData.buffer instanceof ArrayBuffer) {
        // Handle other ArrayBuffer-based types
        buffer = Buffer.from(compressedData.buffer)
      } else if (compressedData && typeof compressedData === 'object' && compressedData.data) {
        // Handle other potential MongoDB formats
        if (Buffer.isBuffer(compressedData.data)) {
          buffer = compressedData.data
        } else if (Array.isArray(compressedData.data)) {
          buffer = Buffer.from(compressedData.data)
        } else {
          throw new Error('Invalid compressed data format - unknown data property type')
        }
      } else {
        throw new Error('Invalid compressed data format')
      }
      
      const decompressed = await decompress(buffer)
      return decompressed.toString('utf-8')
    } catch (error) {
      logger.error('Decompression failed', { error })
      throw new Error('Failed to decompress chord data')
    }
  }

  /**
   * Calculate compression metrics for monitoring
   */
  calculateMetrics(original: string, compressed: Buffer): CompressionMetrics {
    const originalSize = Buffer.byteLength(original, 'utf-8')
    const compressedSize = compressed.length
    const ratio = (1 - compressedSize / originalSize) * 100
    const savings = originalSize - compressedSize

    return {
      originalSize,
      compressedSize,
      ratio: parseFloat(ratio.toFixed(2)),
      savings
    }
  }

  /**
   * Compress multiple items in batch
   */
  async compressMultiple(
    items: Array<{ id: string; chordProText: string }>
  ): Promise<Array<{ id: string; compressed: Buffer; metrics: CompressionMetrics }>> {
    const results = await Promise.all(
      items.map(async (item) => {
        const compressed = await this.compressChordPro(item.chordProText)
        const metrics = this.calculateMetrics(item.chordProText, compressed)
        
        return {
          id: item.id,
          compressed,
          metrics
        }
      })
    )
    
    return results
  }
}

// Export singleton instance
export const compressionService = new CompressionService()