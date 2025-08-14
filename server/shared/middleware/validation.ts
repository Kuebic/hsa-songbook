import { Request, Response, NextFunction } from 'express'
import { z, ZodIssue } from 'zod'
import { ValidationError } from '../utils/errors'

// Extended type for ZodIssue with optional expected and received properties
interface ExtendedZodIssue extends ZodIssue {
  expected?: unknown;
  received?: unknown;
}

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      })
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
        
        next(new ValidationError('Validation failed', errors))
      } else {
        next(error)
      }
    }
  }
}

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
        
        // Log validation errors for debugging
        console.error('❌ Validation failed for request body:', {
          body: req.body,
          errors: error.errors.map(err => {
            const extendedErr = err as ExtendedZodIssue;
            return {
              path: err.path.join('.'),
              message: err.message,
              code: err.code,
              expected: extendedErr.expected,
              received: extendedErr.received
            };
          })
        })
        
        next(new ValidationError('Request body validation failed', errors))
      } else {
        next(error)
      }
    }
  }
}

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
        
        next(new ValidationError('Request params validation failed', errors))
      } else {
        next(error)
      }
    }
  }
}

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
        
        next(new ValidationError('Query params validation failed', errors))
      } else {
        next(error)
      }
    }
  }
}