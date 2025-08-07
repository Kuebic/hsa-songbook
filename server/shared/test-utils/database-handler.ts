import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { createLogger } from '../services/logger'

const logger = createLogger('TestDatabaseHandler')

let mongoServer: MongoMemoryServer | null = null

/**
 * Connect to MongoDB Memory Server for testing
 */
export const connectTestDatabase = async (): Promise<void> => {
  try {
    // Create new MongoDB Memory Server instance with explicit configuration
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.14',
        downloadDir: './mongodb-binaries'
        // systemBinary removed - when omitted, uses downloaded binary by default
      },
      instance: {
        dbName: 'test-hsa-songbook',
        port: 0 // Use random available port
      }
    })

    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
    
    logger.debug('Connected to MongoDB Memory Server', { uri })
  } catch (error) {
    logger.error('Failed to connect to test database', error as Error)
    throw error
  }
}

/**
 * Clear all data from test database
 */
export const clearTestDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 0) {
      logger.warn('Database not connected, skipping clear')
      return
    }

    const collections = mongoose.connection.collections
    
    // Clear all collections in parallel
    await Promise.all(
      Object.values(collections).map(collection => 
        collection.deleteMany({})
      )
    )
    
    logger.debug('Cleared all test database collections')
  } catch (error) {
    logger.error('Failed to clear test database', error as Error)
    throw error
  }
}

/**
 * Close test database connection and stop MongoDB Memory Server
 */
export const closeTestDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      logger.debug('Disconnected from MongoDB')
    }

    if (mongoServer) {
      await mongoServer.stop()
      mongoServer = null
      logger.debug('Stopped MongoDB Memory Server')
    }
  } catch (error) {
    logger.error('Failed to close test database', error as Error)
    throw error
  }
}

/**
 * Get database connection info for debugging
 */
export const getTestDatabaseInfo = () => {
  return {
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    collections: Object.keys(mongoose.connection.collections)
  }
}

/**
 * Check if test database is connected
 */
export const isTestDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1
}