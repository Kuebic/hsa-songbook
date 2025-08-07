import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { createLogger } from '../shared/services/logger'

const logger = createLogger('SeedSongs')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../..', '.env') })

const sampleSongs = [
  {
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace',
    compositionYear: 1772,
    themes: ['grace', 'salvation', 'redemption', 'traditional'],
    source: 'Traditional Hymnal',
    notes: 'One of the most beloved hymns of all time',
    metadata: {
      isPublic: true,
      ratings: { average: 4.8, count: 125 },
      views: 1500
    }
  },
  {
    title: 'How Great Thou Art',
    artist: 'Carl Boberg',
    slug: 'how-great-thou-art',
    compositionYear: 1885,
    themes: ['worship', 'creation', 'majesty', 'traditional'],
    source: 'Swedish Hymnal',
    notes: 'Translated from Swedish, originally titled "O Store Gud"',
    metadata: {
      isPublic: true,
      ratings: { average: 4.9, count: 98 },
      views: 1200
    }
  },
  {
    title: '10,000 Reasons',
    artist: 'Matt Redman',
    slug: '10000-reasons',
    compositionYear: 2011,
    themes: ['worship', 'praise', 'contemporary', 'thankfulness'],
    source: 'Modern Worship',
    ccli: '6016351',
    notes: 'Also known as "Bless the Lord"',
    metadata: {
      isPublic: true,
      ratings: { average: 4.7, count: 87 },
      views: 950
    }
  },
  {
    title: 'What a Beautiful Name',
    artist: 'Hillsong Worship',
    slug: 'what-a-beautiful-name',
    compositionYear: 2016,
    themes: ['worship', 'Jesus', 'contemporary', 'power'],
    source: 'Hillsong',
    ccli: '7068424',
    notes: 'Winner of multiple Dove Awards',
    metadata: {
      isPublic: true,
      ratings: { average: 4.6, count: 76 },
      views: 890
    }
  },
  {
    title: 'Great Is Thy Faithfulness',
    artist: 'Thomas Chisholm',
    slug: 'great-is-thy-faithfulness',
    compositionYear: 1923,
    themes: ['faithfulness', 'provision', 'traditional', 'hymn'],
    source: 'Traditional Hymnal',
    notes: 'Based on Lamentations 3:22-23',
    metadata: {
      isPublic: true,
      ratings: { average: 4.8, count: 93 },
      views: 1100
    }
  },
  {
    title: 'Oceans (Where Feet May Fail)',
    artist: 'Hillsong United',
    slug: 'oceans',
    compositionYear: 2013,
    themes: ['faith', 'trust', 'contemporary', 'surrender'],
    source: 'Hillsong',
    ccli: '6428767',
    notes: 'One of the most popular contemporary worship songs',
    metadata: {
      isPublic: true,
      ratings: { average: 4.5, count: 102 },
      views: 1350
    }
  },
  {
    title: 'Blessed Be Your Name',
    artist: 'Matt Redman',
    slug: 'blessed-be-your-name',
    compositionYear: 2002,
    themes: ['praise', 'sovereignty', 'contemporary', 'trials'],
    source: 'Modern Worship',
    ccli: '3798438',
    notes: 'Written after 9/11, speaks to praising God in all circumstances',
    metadata: {
      isPublic: true,
      ratings: { average: 4.6, count: 79 },
      views: 820
    }
  },
  {
    title: 'In Christ Alone',
    artist: 'Keith Getty & Stuart Townend',
    slug: 'in-christ-alone',
    compositionYear: 2001,
    themes: ['salvation', 'Christ', 'contemporary', 'doctrine'],
    source: 'Modern Hymns',
    ccli: '3350395',
    notes: 'Modern hymn with rich theological content',
    metadata: {
      isPublic: true,
      ratings: { average: 4.9, count: 115 },
      views: 1450
    }
  }
]

async function seedSongs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hsa-songbook-dev'
    
    logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') })
    
    await mongoose.connect(mongoUri)
    
    logger.info('Connected to MongoDB')
    
    // Ensure database connection is established
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    
    // Get the songs collection
    const songsCollection = db.collection('songs')
    
    // Check if songs already exist
    const existingCount = await songsCollection.countDocuments()
    if (existingCount > 0) {
      logger.info(`Database already has ${existingCount} songs. Skipping seed.`)
      return
    }
    
    // Create a system user ID for seeded content
    const systemUserId = 'system-seed-user'
    logger.info('Creating songs with system user ID:', systemUserId)
    
    // Add timestamps and createdBy to all songs
    const songsWithTimestamps = sampleSongs.map(song => ({
      ...song,
      metadata: {
        ...song.metadata,
        createdBy: systemUserId,
        lastModifiedBy: systemUserId
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    // Insert sample songs
    const result = await songsCollection.insertMany(songsWithTimestamps)
    
    logger.info(`Successfully seeded ${result.insertedCount} songs!`)
    
    // List the songs
    logger.info('Songs added:')
    sampleSongs.forEach(song => {
      logger.info(`  - ${song.title} by ${song.artist}`)
    })
    
  } catch (error) {
    logger.error('Failed to seed songs', error as Error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    logger.info('Disconnected from MongoDB')
  }
}

// Run the seed
seedSongs()