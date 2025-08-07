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
  async decompressChordPro(compressedData: Buffer): Promise<string> {
    try {
      const decompressed = await decompress(compressedData)
      return decompressed.toString('utf-8')
    } catch (error) {
      logger.error('Decompression failed', error as Error)
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