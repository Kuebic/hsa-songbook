import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.server file
dotenv.config({ path: path.join(__dirname, '../../..', '.env.server') })

interface Config {
  port: number
  mongoUri: string
  nodeEnv: string
  clerkSecretKey: string
  clerkWebhookSecret: string
  frontendUrl: string
  jwtSecret: string
  jwtExpiresIn: string
  rateLimitMax: number
  rateLimitWindowMs: number
  zstdCompressionLevel: number
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/hsa-songbook-dev',
  nodeEnv: process.env.NODE_ENV || 'development',
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  zstdCompressionLevel: parseInt(process.env.ZSTD_COMPRESSION_LEVEL || '10', 10)
}

// Validation for required environment variables
const requiredEnvVars = ['MONGO_URI']

if (config.nodeEnv === 'production') {
  requiredEnvVars.push('CLERK_SECRET_KEY', 'CLERK_WEBHOOK_SECRET', 'JWT_SECRET')
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    if (config.nodeEnv === 'production') {
      process.exit(1)
    }
  }
}

export default config