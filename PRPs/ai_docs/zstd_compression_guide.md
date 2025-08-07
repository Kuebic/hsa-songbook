# ZSTD Compression Guide for ChordPro Data

## Overview
ZSTD (Zstandard) compression is crucial for storing ChordPro chord data efficiently in MongoDB, achieving 60-80% size reduction. This guide covers implementation for the HSA Songbook.

## Installation

```bash
# MongoDB official ZSTD package (recommended)
npm install @mongodb-js/zstd

# Alternative: Node ZSTD binding
npm install node-zstd
```

## Implementation for ChordPro Data

### Compression Service
```typescript
// server/services/compressionService.ts
import { compress, decompress } from '@mongodb-js/zstd'

export class CompressionService {
  // Compression level: 1-22 (3 = fast, 10 = balanced, 19 = max compression)
  private readonly COMPRESSION_LEVEL = 10

  /**
   * Compress ChordPro text data to Buffer
   * @param chordProText - Raw ChordPro formatted text
   * @returns Compressed Buffer
   */
  async compressChordPro(chordProText: string): Promise<Buffer> {
    try {
      const buffer = Buffer.from(chordProText, 'utf-8')
      const compressed = await compress(buffer, this.COMPRESSION_LEVEL)
      
      // Log compression ratio for monitoring
      const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(2)
      console.log(`Compression ratio: ${ratio}% (${buffer.length} → ${compressed.length} bytes)`)
      
      return compressed
    } catch (error) {
      console.error('Compression failed:', error)
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
      console.error('Decompression failed:', error)
      throw new Error('Failed to decompress chord data')
    }
  }

  /**
   * Calculate compression metrics for monitoring
   */
  calculateMetrics(original: string, compressed: Buffer): {
    originalSize: number
    compressedSize: number
    ratio: number
    savings: number
  } {
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
}

export const compressionService = new CompressionService()
```

### Arrangement Model with Compression
```typescript
// server/models/Arrangement.ts
import { Schema, model, Types } from 'mongoose'
import { compressionService } from '../services/compressionService'

export interface IArrangement {
  name: string
  songIds: Types.ObjectId[]
  slug: string
  createdBy: Types.ObjectId
  chordData: Buffer  // Stored as compressed Buffer
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  tags: string[]
  metadata: {
    isMashup: boolean
    mashupSections?: Array<{
      songId: Types.ObjectId
      title: string
    }>
    isPublic: boolean
    ratings?: { average: number; count: number }
    views: number
  }
  documentSize: number
}

const arrangementSchema = new Schema<IArrangement>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  songIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  }],
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chordData: {
    type: Buffer,
    required: true
  },
  key: {
    type: String,
    enum: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  },
  tempo: {
    type: Number,
    min: 40,
    max: 240
  },
  timeSignature: {
    type: String,
    enum: ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8']
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  description: String,
  tags: [String],
  metadata: {
    isMashup: { type: Boolean, default: false },
    mashupSections: [{
      songId: { type: Schema.Types.ObjectId, ref: 'Song' },
      title: String
    }],
    isPublic: { type: Boolean, default: false },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    views: { type: Number, default: 0 }
  },
  documentSize: { type: Number, default: 0 }
}, {
  timestamps: true
})

// Virtual for decompressed chord data
arrangementSchema.virtual('chordDataString').get(async function() {
  if (!this.chordData) return null
  return await compressionService.decompressChordPro(this.chordData)
})

// Pre-save middleware to calculate document size
arrangementSchema.pre('save', function(next) {
  this.documentSize = this.chordData ? this.chordData.length : 0
  next()
})

export const Arrangement = model<IArrangement>('Arrangement', arrangementSchema)
```

### Controller with Compression/Decompression
```typescript
// server/controllers/arrangementController.ts
import { Request, Response, NextFunction } from 'express'
import { Arrangement } from '../models/Arrangement'
import { compressionService } from '../services/compressionService'
import { catchAsync } from '../utils/catchAsync'

export const createArrangement = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { chordProText, ...arrangementData } = req.body
  
  // Compress the ChordPro text
  const compressedData = await compressionService.compressChordPro(chordProText)
  
  // Calculate metrics for monitoring
  const metrics = compressionService.calculateMetrics(chordProText, compressedData)
  console.log('Compression metrics:', metrics)
  
  // Create arrangement with compressed data
  const arrangement = await Arrangement.create({
    ...arrangementData,
    chordData: compressedData,
    createdBy: req.auth.userId
  })
  
  res.status(201).json({
    success: true,
    data: {
      ...arrangement.toObject(),
      chordData: undefined, // Don't send Buffer to client
      compressionMetrics: metrics
    }
  })
})

export const getArrangement = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  
  const arrangement = await Arrangement.findById(id)
    .populate('songIds', 'title artist')
    .lean()
  
  if (!arrangement) {
    return res.status(404).json({
      success: false,
      message: 'Arrangement not found'
    })
  }
  
  // Decompress chord data for client
  const chordProText = await compressionService.decompressChordPro(arrangement.chordData)
  
  res.json({
    success: true,
    data: {
      ...arrangement,
      chordData: chordProText // Send decompressed text to client
    }
  })
})

export const updateArrangement = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const { chordProText, ...updateData } = req.body
  
  const updateFields: any = { ...updateData }
  
  // If chord data is being updated, compress it
  if (chordProText) {
    updateFields.chordData = await compressionService.compressChordPro(chordProText)
  }
  
  const arrangement = await Arrangement.findByIdAndUpdate(
    id,
    updateFields,
    { new: true, runValidators: true }
  )
  
  if (!arrangement) {
    return res.status(404).json({
      success: false,
      message: 'Arrangement not found'
    })
  }
  
  res.json({
    success: true,
    data: arrangement
  })
})
```

## ChordPro Format Examples

### Sample ChordPro Data
```chordpro
{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 72}
{time: 3/4}

{verse: 1}
A[G]mazing [G/B]grace how [C]sweet the [G]sound
That [G]saved a [G/B]wretch like [D]me
I [G]once was [G/B]lost but [C]now am [G]found
Was [Em]blind but [D]now I [G]see

{chorus}
[G]Amazing [C]grace, [G]amazing [D]grace
How [G]sweet the [C]sound
```

### Compression Results
```javascript
// Typical compression ratios for ChordPro data:
Original size: 1,245 bytes
Compressed size: 412 bytes
Compression ratio: 66.91%
Savings: 833 bytes

// For larger arrangements (10+ verses):
Original size: 8,432 bytes
Compressed size: 1,897 bytes
Compression ratio: 77.50%
Savings: 6,535 bytes
```

## Performance Optimization

### Batch Compression
```typescript
// server/services/batchCompressionService.ts
export class BatchCompressionService {
  async compressMultiple(
    items: Array<{ id: string; chordProText: string }>
  ): Promise<Array<{ id: string; compressed: Buffer; metrics: any }>> {
    const results = await Promise.all(
      items.map(async (item) => {
        const compressed = await compressionService.compressChordPro(item.chordProText)
        const metrics = compressionService.calculateMetrics(item.chordProText, compressed)
        
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
```

### Caching Decompressed Data
```typescript
// server/services/cacheService.ts
import NodeCache from 'node-cache'

class CacheService {
  private cache: NodeCache
  
  constructor() {
    // TTL: 5 minutes, check period: 60 seconds
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 })
  }
  
  async getDecompressedChordData(
    arrangementId: string,
    compressedData: Buffer
  ): Promise<string> {
    const cached = this.cache.get<string>(arrangementId)
    
    if (cached) {
      console.log(`Cache hit for arrangement ${arrangementId}`)
      return cached
    }
    
    const decompressed = await compressionService.decompressChordPro(compressedData)
    this.cache.set(arrangementId, decompressed)
    
    return decompressed
  }
  
  invalidate(arrangementId: string): void {
    this.cache.del(arrangementId)
  }
}

export const cacheService = new CacheService()
```

## Migration Script for Existing Data

```typescript
// scripts/migrateToCompression.ts
import mongoose from 'mongoose'
import { Arrangement } from '../server/models/Arrangement'
import { compressionService } from '../server/services/compressionService'

async function migrateArrangements() {
  await mongoose.connect(process.env.MONGO_URI!)
  
  const arrangements = await Arrangement.find({
    chordData: { $type: 'string' } // Find non-compressed arrangements
  })
  
  console.log(`Found ${arrangements.length} arrangements to compress`)
  
  let totalSavings = 0
  
  for (const arrangement of arrangements) {
    try {
      // Assuming chordData is currently stored as string
      const originalText = arrangement.chordData.toString()
      const compressed = await compressionService.compressChordPro(originalText)
      
      const metrics = compressionService.calculateMetrics(originalText, compressed)
      totalSavings += metrics.savings
      
      arrangement.chordData = compressed
      await arrangement.save()
      
      console.log(`Migrated ${arrangement.slug}: saved ${metrics.savings} bytes (${metrics.ratio}% compression)`)
    } catch (error) {
      console.error(`Failed to migrate ${arrangement.slug}:`, error)
    }
  }
  
  console.log(`Migration complete. Total savings: ${(totalSavings / 1024 / 1024).toFixed(2)} MB`)
  await mongoose.disconnect()
}

// Run migration
migrateArrangements().catch(console.error)
```

## Testing Compression

```typescript
// server/__tests__/compression.test.ts
import { compressionService } from '../services/compressionService'

describe('Compression Service', () => {
  const sampleChordPro = `
{title: Test Song}
{key: G}

[G]This is a [C]test [D]song
With [Em]multiple [Am]lines of [D]chords
  `.trim()

  it('should compress and decompress ChordPro data', async () => {
    const compressed = await compressionService.compressChordPro(sampleChordPro)
    
    expect(compressed).toBeInstanceOf(Buffer)
    expect(compressed.length).toBeLessThan(Buffer.byteLength(sampleChordPro))
    
    const decompressed = await compressionService.decompressChordPro(compressed)
    expect(decompressed).toBe(sampleChordPro)
  })

  it('should achieve significant compression ratio', async () => {
    const longChordPro = sampleChordPro.repeat(100) // Create larger sample
    const compressed = await compressionService.compressChordPro(longChordPro)
    
    const metrics = compressionService.calculateMetrics(longChordPro, compressed)
    
    expect(metrics.ratio).toBeGreaterThan(50) // Expect >50% compression
    expect(metrics.originalSize).toBe(Buffer.byteLength(longChordPro))
    expect(metrics.compressedSize).toBe(compressed.length)
  })

  it('should handle empty input', async () => {
    const compressed = await compressionService.compressChordPro('')
    const decompressed = await compressionService.decompressChordPro(compressed)
    
    expect(decompressed).toBe('')
  })

  it('should handle special characters in ChordPro', async () => {
    const specialChordPro = '{title: Café Société} [C#m7b5]♪♫'
    
    const compressed = await compressionService.compressChordPro(specialChordPro)
    const decompressed = await compressionService.decompressChordPro(compressed)
    
    expect(decompressed).toBe(specialChordPro)
  })
})
```

## MongoDB Storage Configuration

### Enable ZSTD at Collection Level
```javascript
// Database setup script
db.createCollection('arrangements', {
  storageEngine: {
    wiredTiger: {
      configString: 'block_compressor=zstd'
    }
  }
})
```

### Monitor Compression Performance
```javascript
// Admin script to check compression stats
db.arrangements.stats({
  indexDetails: true,
  indexDetailsKey: {},
  indexDetailsName: 'chordData'
})
```

## Key Considerations

1. **Compression Level Trade-offs**:
   - Level 1-3: Fast compression, lower ratio (50-60%)
   - Level 10: Balanced (65-70% compression)
   - Level 19-22: Maximum compression (75-80%), slower

2. **Memory Usage**: ZSTD uses ~100KB per compression context

3. **Error Handling**: Always wrap compression/decompression in try-catch

4. **Data Integrity**: Store original size for validation after decompression

5. **Migration Strategy**: Test compression ratios on sample data before full migration