import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { createLogger } from '../shared/services/logger'

const logger = createLogger('DatabaseReset')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../..', '.env.server') })

async function resetDatabase() {
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
    
    // Get all collections
    const collections = await db.listCollections().toArray()
    
    logger.info(`Found ${collections.length} collections`)
    
    // Drop each collection
    for (const collection of collections) {
      logger.info(`Dropping collection: ${collection.name}`)
      await db.dropCollection(collection.name)
    }
    
    logger.info('All collections dropped successfully')
    
    // Create indexes for the main collections
    logger.info('Creating indexes...')
    
    // Songs collection indexes
    const songsCollection = db.collection('songs')
    await songsCollection.createIndex({ title: 'text', artist: 'text', themes: 'text' })
    await songsCollection.createIndex({ slug: 1 }, { unique: true })
    await songsCollection.createIndex({ 'metadata.isPublic': 1 })
    await songsCollection.createIndex({ 'metadata.createdBy': 1 })
    logger.info('Songs indexes created')
    
    // Arrangements collection indexes
    const arrangementsCollection = db.collection('arrangements')
    await arrangementsCollection.createIndex({ songIds: 1 })
    await arrangementsCollection.createIndex({ slug: 1 }, { unique: true })
    await arrangementsCollection.createIndex({ 'metadata.isPublic': 1 })
    await arrangementsCollection.createIndex({ createdBy: 1 })
    logger.info('Arrangements indexes created')
    
    // Users collection indexes
    const usersCollection = db.collection('users')
    await usersCollection.createIndex({ clerkId: 1 }, { unique: true })
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    await usersCollection.createIndex({ username: 1 })
    logger.info('Users indexes created')
    
    // Optional: Add sample data
    if (process.argv.includes('--seed')) {
      logger.info('Seeding database with sample data...')
      
      // Add a sample song
      await songsCollection.insertOne({
        title: 'Amazing Grace',
        artist: 'John Newton',
        slug: 'amazing-grace',
        compositionYear: 1772,
        themes: ['grace', 'salvation', 'traditional'],
        metadata: {
          isPublic: true,
          ratings: { average: 0, count: 0 },
          views: 0,
          createdBy: null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      logger.info('Sample data added')
    }
    
    logger.info('Database reset complete!')
    
  } catch (error) {
    logger.error('Failed to reset database', error as Error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    logger.info('Disconnected from MongoDB')
  }
}

// Run the reset
resetDatabase()