# MongoDB Express Integration Guide for HSA Songbook

## Express Server Setup with TypeScript

### Server Configuration
```typescript
// server/app.ts
import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import mongoSanitize from 'express-mongo-sanitize'
import { connectDB } from './config/database'
import { errorHandler } from './middleware/errorHandler'
import routes from './routes'

const app: Express = express()

// Security middleware
app.use(helmet())
app.use(mongoSanitize())

// CORS configuration for Vite dev server
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(compression())

// API routes
app.use('/api/v1', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling
app.use(errorHandler)

export default app
```

### Database Connection with Retry Logic
```typescript
// server/config/database.ts
import mongoose from 'mongoose'

const MAX_RETRIES = 5
const RETRY_DELAY = 5000

export const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV === 'development'
    })

    console.log(`MongoDB Connected: ${conn.connection.host}`)

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY)
      }
    })

  } catch (error) {
    console.error(`Database connection attempt ${retryCount + 1} failed:`, error)
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`)
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY)
    } else {
      console.error('Maximum retry attempts reached. Exiting...')
      process.exit(1)
    }
  }
}
```

## Mongoose Schema Patterns with TypeScript

### Base Schema with Timestamps
```typescript
// server/models/base.schema.ts
import { Schema, Document } from 'mongoose'

export interface BaseDocument extends Document {
  createdAt: Date
  updatedAt: Date
}

export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    }
  }
}
```

### Song Model with Validation
```typescript
// server/models/Song.ts
import { Schema, model, Types } from 'mongoose'
import { baseSchemaOptions, BaseDocument } from './base.schema'

export interface ISong extends BaseDocument {
  title: string
  artist?: string
  slug: string
  compositionYear?: number
  ccli?: string
  themes: string[]
  source?: string
  notes?: string
  defaultArrangementId?: Types.ObjectId
  metadata: {
    createdBy: Types.ObjectId
    lastModifiedBy?: Types.ObjectId
    isPublic: boolean
    ratings: { average: number; count: number }
    views: number
  }
  documentSize: number
}

const songSchema = new Schema<ISong>({
  title: {
    type: String,
    required: [true, 'Song title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  artist: {
    type: String,
    trim: true,
    maxlength: [100, 'Artist name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  compositionYear: {
    type: Number,
    min: [1000, 'Year must be after 1000'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  ccli: {
    type: String,
    sparse: true,
    index: true
  },
  themes: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  source: String,
  notes: String,
  defaultArrangementId: {
    type: Schema.Types.ObjectId,
    ref: 'Arrangement'
  },
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  documentSize: {
    type: Number,
    default: 0
  }
}, baseSchemaOptions)

// Indexes for performance
songSchema.index({ title: 'text', artist: 'text', themes: 'text' })
songSchema.index({ 'metadata.isPublic': 1, themes: 1 })
songSchema.index({ 'metadata.createdBy': 1, createdAt: -1 })

// Pre-save middleware to calculate document size
songSchema.pre('save', function(next) {
  this.documentSize = JSON.stringify(this.toObject()).length
  next()
})

export const Song = model<ISong>('Song', songSchema)
```

## API Route Patterns

### Controller with Error Handling
```typescript
// server/controllers/songController.ts
import { Request, Response, NextFunction } from 'express'
import { Song } from '../models/Song'
import { AppError } from '../utils/errors'
import { catchAsync } from '../utils/catchAsync'

export const getAllSongs = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page = 1, limit = 20, themes, isPublic = true } = req.query

  const query: any = {}
  if (isPublic !== undefined) query['metadata.isPublic'] = isPublic === 'true'
  if (themes) query.themes = { $in: (themes as string).split(',') }

  const songs = await Song.find(query)
    .select('-documentSize')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .lean()

  const total = await Song.countDocuments(query)

  res.json({
    success: true,
    data: songs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

export const createSong = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.auth // From Clerk middleware
  
  const songData = {
    ...req.body,
    metadata: {
      ...req.body.metadata,
      createdBy: userId
    }
  }

  const song = await Song.create(songData)
  
  res.status(201).json({
    success: true,
    data: song
  })
})
```

### Route Definition
```typescript
// server/routes/songRoutes.ts
import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { createSongSchema } from '../validation/songValidation'
import * as songController from '../controllers/songController'

const router = Router()

// Public routes
router.get('/', songController.getAllSongs)
router.get('/:slug', songController.getSongBySlug)

// Protected routes
router.use(requireAuth) // All routes below require authentication
router.post('/', validate(createSongSchema), songController.createSong)
router.patch('/:id', validate(updateSongSchema), songController.updateSong)
router.delete('/:id', requireRole('admin'), songController.deleteSong)

export default router
```

## Clerk Integration Middleware

### Authentication Middleware
```typescript
// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node'
import { AppError } from '../utils/errors'

export interface AuthRequest extends Request {
  auth?: {
    userId: string
    sessionId: string
    sessionClaims: any
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      throw new AppError('No authentication token provided', 401)
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })

    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
      sessionClaims: payload
    }

    next()
  } catch (error) {
    next(new AppError('Invalid or expired token', 401))
  }
}

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth?.sessionClaims?.metadata?.role) {
      return next(new AppError('No role assigned', 403))
    }

    if (req.auth.sessionClaims.metadata.role !== role) {
      return next(new AppError('Insufficient permissions', 403))
    }

    next()
  }
}
```

## Error Handling

### Custom Error Classes
```typescript
// server/utils/errors.ts
export class AppError extends Error {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}
```

### Global Error Handler
```typescript
// server/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import mongoose from 'mongoose'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err

  // Handle Mongoose errors
  if (err instanceof mongoose.Error.CastError) {
    const message = `Invalid ${err.path}: ${err.value}`
    error = new AppError(message, 400)
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(e => e.message)
    const message = `Validation failed: ${errors.join(', ')}`
    error = new AppError(message, 400)
  }

  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0]
    const message = `${field} already exists`
    error = new AppError(message, 409)
  }

  // Default error
  if (!(error instanceof AppError)) {
    const message = process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
    error = new AppError(message, 500)
  }

  const appError = error as AppError

  res.status(appError.statusCode).json({
    success: false,
    error: {
      message: appError.message,
      status: appError.status,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        originalError: err
      })
    }
  })
}
```

## Environment Variables

```env
# .env.server
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/hsa-songbook
# For production:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hsa-songbook?retryWrites=true&w=majority

# Clerk
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT (if needed for additional auth)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

## Testing Patterns

### Integration Test Setup
```typescript
// server/__tests__/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import app from '../app'

let mongoServer: MongoMemoryServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

export { request, app }
```

### API Test Example
```typescript
// server/__tests__/songs.test.ts
import { request, app } from './setup'
import { Song } from '../models/Song'

describe('Song API', () => {
  describe('GET /api/v1/songs', () => {
    it('should return all public songs', async () => {
      await Song.create([
        { title: 'Song 1', slug: 'song-1', metadata: { isPublic: true } },
        { title: 'Song 2', slug: 'song-2', metadata: { isPublic: false } }
      ])

      const res = await request(app)
        .get('/api/v1/songs')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].title).toBe('Song 1')
    })
  })

  describe('POST /api/v1/songs', () => {
    it('should create a new song with authentication', async () => {
      const token = 'mock-valid-token'
      
      const res = await request(app)
        .post('/api/v1/songs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Song',
          slug: 'new-song',
          artist: 'Test Artist'
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('New Song')
    })
  })
})
```