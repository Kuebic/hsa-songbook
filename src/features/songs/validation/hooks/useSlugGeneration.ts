import { useState, useCallback, useEffect } from 'react'
import { 
  generateUniqueSlug, 
  regenerateSlug, 
  isValidSlug,
  isUniqueSlug,
  slugify,
  type SlugOptions 
} from '../utils/slugGeneration'

/**
 * Hook configuration options
 */
interface UseSlugGenerationOptions extends Omit<SlugOptions, 'title' | 'artist' | 'existingSlugs'> {
  /** Whether to auto-generate slug on title/artist change (default: true) */
  autoGenerate?: boolean
  /** Debounce delay for auto-generation in milliseconds (default: 500) */
  debounceDelay?: number
  /** Whether to validate generated slugs (default: true) */
  validateSlug?: boolean
  /** Callback when slug is generated */
  onSlugGenerated?: (slug: string) => void
  /** Callback when slug generation fails */
  onError?: (error: Error) => void
}

/**
 * Hook return value
 */
interface UseSlugGenerationReturn {
  /** Generated or manually set slug */
  slug: string
  /** Whether currently generating slug */
  isGenerating: boolean
  /** Error if generation failed */
  error: Error | null
  /** Whether the current slug is valid */
  isValid: boolean
  /** Whether the current slug is unique */
  isUnique: boolean
  /** Manually generate a new slug */
  generateSlug: (title: string, artist?: string) => Promise<string>
  /** Regenerate slug with new random ID */
  regenerate: () => Promise<string>
  /** Manually set slug (with validation) */
  setSlug: (slug: string) => void
  /** Clear current slug */
  clearSlug: () => void
  /** Get a preview of what the slug would be */
  previewSlug: (title: string, artist?: string) => string
}

/**
 * Hook for generating unique slugs for songs
 * 
 * @param existingSlugs - Array of existing slugs to check against
 * @param options - Generation options
 * @returns Slug generation state and utilities
 */
export function useSlugGeneration(
  existingSlugs: string[],
  options: UseSlugGenerationOptions = {}
): UseSlugGenerationReturn {
  const {
    autoGenerate: _autoGenerate = true,
    debounceDelay: _debounceDelay = 500,
    validateSlug = true,
    onSlugGenerated,
    onError,
    ...generationOptions
  } = options

  const [slug, setSlugState] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  /**
   * Clear any pending debounce timer
   */
  const clearDebounce = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      setDebounceTimer(null)
    }
  }, [debounceTimer])

  /**
   * Generate a unique slug
   */
  const generateSlug = useCallback(
    async (title: string, artist?: string): Promise<string> => {
      clearDebounce()
      
      if (!title || title.trim().length === 0) {
        setSlugState('')
        setError(null)
        return ''
      }

      setIsGenerating(true)
      setError(null)

      try {
        const newSlug = await generateUniqueSlug({
          title,
          artist,
          existingSlugs,
          ...generationOptions
        })

        // Validate if enabled
        if (validateSlug && !isValidSlug(newSlug)) {
          throw new Error(`Generated invalid slug: ${newSlug}`)
        }

        setSlugState(newSlug)
        
        if (onSlugGenerated) {
          onSlugGenerated(newSlug)
        }

        return newSlug
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate slug')
        setError(error)
        
        if (onError) {
          onError(error)
        }

        return ''
      } finally {
        setIsGenerating(false)
      }
    },
    [existingSlugs, generationOptions, validateSlug, onSlugGenerated, onError, clearDebounce]
  )

  /**
   * Generate slug with debouncing for auto-generation
   * Note: Currently unused but kept for potential future use
   */
  // const _generateSlugDebounced = useCallback(
  //   (title: string, artist?: string) => {
  //     clearDebounce()
  //
  //     if (!title || title.trim().length === 0) {
  //       setSlugState('')
  //       setError(null)
  //       return
  //     }
  //
  //     const timer = setTimeout(() => {
  //       generateSlug(title, artist)
  //     }, debounceDelay)
  //
  //     setDebounceTimer(timer)
  //   },
  //   [generateSlug, debounceDelay, clearDebounce]
  // )

  /**
   * Regenerate slug with new random ID
   */
  const regenerate = useCallback(async (): Promise<string> => {
    if (!slug) {
      const error = new Error('No slug to regenerate')
      setError(error)
      return ''
    }

    setIsGenerating(true)
    setError(null)

    try {
      const newSlug = await regenerateSlug(slug, existingSlugs)

      // Validate if enabled
      if (validateSlug && !isValidSlug(newSlug)) {
        throw new Error(`Generated invalid slug: ${newSlug}`)
      }

      setSlugState(newSlug)
      
      if (onSlugGenerated) {
        onSlugGenerated(newSlug)
      }

      return newSlug
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to regenerate slug')
      setError(error)
      
      if (onError) {
        onError(error)
      }

      return ''
    } finally {
      setIsGenerating(false)
    }
  }, [slug, existingSlugs, validateSlug, onSlugGenerated, onError])

  /**
   * Manually set slug with validation
   */
  const setSlug = useCallback(
    (newSlug: string) => {
      setError(null)

      // Validate if enabled
      if (validateSlug && newSlug && !isValidSlug(newSlug)) {
        const error = new Error(`Invalid slug format: ${newSlug}`)
        setError(error)
        
        if (onError) {
          onError(error)
        }
        
        return
      }

      setSlugState(newSlug)
    },
    [validateSlug, onError]
  )

  /**
   * Clear current slug
   */
  const clearSlug = useCallback(() => {
    clearDebounce()
    setSlugState('')
    setError(null)
    setIsGenerating(false)
  }, [clearDebounce])

  /**
   * Get a preview of what the slug would be (without uniqueness check)
   */
  const previewSlug = useCallback(
    (title: string, artist?: string): string => {
      if (!title || title.trim().length === 0) {
        return ''
      }

      const baseSlug = slugify(title)
      
      if (!baseSlug) {
        return 'song-preview'
      }

      if (generationOptions.includeArtistInitials && artist) {
        const initials = artist
          .trim()
          .split(/\s+/)
          .map(word => word[0])
          .filter(char => char !== undefined)
          .join('')
          .toLowerCase()
        
        return initials ? `${baseSlug}-${initials}-xxxxx` : `${baseSlug}-xxxxx`
      }

      return `${baseSlug}-xxxxx`
    },
    [generationOptions.includeArtistInitials]
  )

  /**
   * Check validity and uniqueness
   */
  const isValid = slug ? isValidSlug(slug) : false
  const isUnique = slug ? isUniqueSlug(slug, existingSlugs) : true

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearDebounce()
    }
  }, [clearDebounce])

  return {
    slug,
    isGenerating,
    error,
    isValid,
    isUnique,
    generateSlug,
    regenerate,
    setSlug,
    clearSlug,
    previewSlug
  }
}

/**
 * Hook for auto-generating slugs based on form inputs
 * 
 * @param title - Current title value
 * @param artist - Current artist value
 * @param existingSlugs - Array of existing slugs
 * @param options - Generation options
 * @returns Slug generation state
 */
export function useAutoSlugGeneration(
  title: string,
  artist: string | undefined,
  existingSlugs: string[],
  options: UseSlugGenerationOptions = {}
): UseSlugGenerationReturn {
  const generation = useSlugGeneration(existingSlugs, {
    ...options,
    autoGenerate: true
  })

  // Generate slug when title or artist changes
  useEffect(() => {
    if (options.autoGenerate !== false && title && title.trim().length > 0) {
      // Use internal debounced method
      const timer = setTimeout(() => {
        generation.generateSlug(title, artist)
      }, options.debounceDelay || 500)

      return () => clearTimeout(timer)
    } else if (!title || title.trim().length === 0) {
      generation.clearSlug()
    }
  }, [title, artist]) // eslint-disable-line react-hooks/exhaustive-deps

  return generation
}