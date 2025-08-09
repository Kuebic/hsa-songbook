import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './shared/middleware/errorHandler'
import config from './shared/config/env'

// Import feature routes
import songRoutes from './features/songs/song.routes'
import arrangementRoutes from './features/arrangements/arrangement.routes'
import userRoutes from './features/users/user.routes'
import reviewRoutes from './features/reviews/review.routes'

const app: Express = express()

// Security middleware
app.use(helmet())
app.use(mongoSanitize())

// CORS configuration for Vite dev server and production
app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? config.frontendUrl
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply rate limiting to API routes
app.use('/api/', limiter)

// Body parsing middleware - IMPORTANT: Order matters!
// Default JSON parsing for most routes
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime()
  })
})

// API v1 routes
app.use('/api/v1/songs', songRoutes)
app.use('/api/v1/arrangements', arrangementRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/reviews', reviewRoutes)

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

// Global error handling middleware (must be last)
app.use(errorHandler)

export default app