import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { AppError, HttpCode, ValidationError } from '../utils/errors'
import config from '../config/env'

interface ErrorResponse {
  success: false
  error: {
    message: string
    status: string
    code?: string
    errors?: string[]
    stack?: string
    originalError?: Error
  }
}

const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, HttpCode.BAD_REQUEST)
}

const handleDuplicateFieldsDB = (err: Error & { keyValue?: Record<string, unknown>, code?: number }): AppError => {
  const field = Object.keys(err.keyValue)[0]
  const value = err.keyValue[field]
  const message = `${field} '${value}' already exists`
  return new AppError(message, HttpCode.CONFLICT)
}

const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).map(e => e.message)
  const message = `Validation failed: ${errors.join(', ')}`
  return new ValidationError(message, errors)
}

const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again', HttpCode.UNAUTHORIZED)
}

const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again', HttpCode.UNAUTHORIZED)
}

const sendErrorDev = (err: AppError, res: Response) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      status: err.status,
      message: err.message,
      stack: err.stack,
      originalError: err
    }
  }

  // Include validation errors if present
  if (err instanceof ValidationError && err.errors) {
    response.error.errors = err.errors
  }

  res.status(err.statusCode).json(response)
}

const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ErrorResponse = {
      success: false,
      error: {
        status: err.status,
        message: err.message
      }
    }

    if (err instanceof ValidationError && err.errors) {
      response.error.errors = err.errors
    }

    res.status(err.statusCode).json(response)
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err)

    const response: ErrorResponse = {
      success: false,
      error: {
        status: 'error',
        message: 'Something went wrong'
      }
    }

    res.status(HttpCode.INTERNAL_SERVER_ERROR).json(response)
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = err

  // Handle non-AppError errors
  if (!(error instanceof AppError)) {
    // Handle Mongoose errors
    if (error instanceof mongoose.Error.CastError) {
      error = handleCastErrorDB(error)
    } else if (error instanceof mongoose.Error.ValidationError) {
      error = handleValidationErrorDB(error)
    } else if ((error as Error & { code?: number }).code === 11000) {
      error = handleDuplicateFieldsDB(error)
    } else if (error.name === 'JsonWebTokenError') {
      error = handleJWTError()
    } else if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError()
    } else {
      // Unknown error
      const message = config.nodeEnv === 'production' 
        ? 'Something went wrong' 
        : err.message
      error = new AppError(message, HttpCode.INTERNAL_SERVER_ERROR, false)
    }
  }

  const appError = error as AppError

  // Set default values if not set
  appError.statusCode = appError.statusCode || HttpCode.INTERNAL_SERVER_ERROR
  appError.status = appError.status || 'error'

  if (config.nodeEnv === 'development') {
    sendErrorDev(appError, res)
  } else {
    sendErrorProd(appError, res)
  }
}