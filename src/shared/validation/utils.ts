import { ZodError } from 'zod'
import type { ZodIssue } from 'zod'

/**
 * Formats Zod errors into a user-friendly message
 */
export function formatZodError(error: ZodError): string {
  const messages = error.issues.map((err: ZodIssue) => {
    const field = err.path.join('.')
    return field ? `${field}: ${err.message}` : err.message
  })
  return messages.join(', ')
}

/**
 * Gets the first error message from a Zod error
 */
export function getFirstError(error: ZodError): string {
  return error.issues[0]?.message || 'Validation failed'
}

/**
 * Converts Zod errors to a field error map
 */
export function getFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  error.issues.forEach((err: ZodIssue) => {
    const path = err.path.join('.')
    if (!fieldErrors[path]) {
      fieldErrors[path] = err.message
    }
  })
  return fieldErrors
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers (without the \s* to preserve spaces)
    // Don't trim here - let the consumer decide when to trim (e.g., on blur or submit)
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}