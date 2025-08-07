import app from './app'
import { connectDB } from './shared/config/database'
import config from './shared/config/env'
import { createLogger } from './shared/services/logger'

const logger = createLogger('Server')

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err)
  process.exit(1)
})

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()
    
    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
        healthCheck: `http://localhost:${config.port}/health`,
        apiBase: `http://localhost:${config.port}/api/v1`,
        pid: process.pid
      })
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', err)
      server.close(() => {
        process.exit(1)
      })
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, initiating graceful shutdown')
      server.close(() => {
        logger.info('Server closed successfully')
        process.exit(0)
      })
    })

  } catch (error) {
    logger.error('Failed to start server', error as Error)
    process.exit(1)
  }
}

// Start the server
startServer()