import mongoose from 'mongoose'
import config from './env'
import { createLogger } from '../services/logger'
import { DATABASE } from '../constants'

const logger = createLogger('Database')

export const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: DATABASE.POOL_SIZE,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: config.nodeEnv === 'development',
    })

    logger.info('MongoDB connected successfully', {
      host: conn.connection.host,
      database: conn.connection.name
    })

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
      if (retryCount < DATABASE.MAX_RETRIES && config.nodeEnv === 'production') {
        logger.info(`Scheduling reconnection attempt ${retryCount + 1}/${DATABASE.MAX_RETRIES}`)
        setTimeout(() => connectDB(retryCount + 1), DATABASE.RETRY_DELAY)
      }
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      logger.info('MongoDB connection closed through app termination')
      process.exit(0)
    })

  } catch (error) {
    logger.error(`Database connection attempt ${retryCount + 1} failed`, error as Error)
    
    if (retryCount < DATABASE.MAX_RETRIES) {
      logger.info(`Retrying in ${DATABASE.RETRY_DELAY / 1000} seconds...`, {
        attempt: retryCount + 1,
        maxAttempts: DATABASE.MAX_RETRIES
      })
      setTimeout(() => connectDB(retryCount + 1), DATABASE.RETRY_DELAY)
    } else {
      logger.error('Maximum retry attempts reached. Exiting...')
      process.exit(1)
    }
  }
}

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    logger.info('MongoDB disconnected successfully')
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', error as Error)
  }
}