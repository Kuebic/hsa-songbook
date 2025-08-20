/**
 * Utility functions for generating ChordPro templates from arrangement metadata
 */

interface TemplateOptions {
  title?: string
  subtitle?: string
  key?: string
  tempo?: number
  timeSignature?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  capo?: number
  description?: string
}

/**
 * Generate a ChordPro template with metadata from arrangement form data
 */
export function generateChordProTemplate(options: TemplateOptions): string {
  const lines: string[] = []
  
  // Add title directive
  if (options.title) {
    lines.push(`{title: ${options.title}}`)
  }
  
  // Add subtitle directive (for song name when arrangement has its own title)
  if (options.subtitle) {
    lines.push(`{subtitle: ${options.subtitle}}`)
  }
  
  // Add key directive
  if (options.key) {
    lines.push(`{key: ${options.key}}`)
  }
  
  // Add tempo directive
  if (options.tempo) {
    lines.push(`{tempo: ${options.tempo}}`)
  }
  
  // Add time signature as a comment
  if (options.timeSignature) {
    lines.push(`{time: ${options.timeSignature}}`)
  }
  
  // Add capo directive
  if (options.capo && options.capo > 0) {
    lines.push(`{capo: ${options.capo}}`)
  }
  
  // Add difficulty as a comment
  if (options.difficulty) {
    lines.push(`{comment: Difficulty - ${options.difficulty.charAt(0).toUpperCase() + options.difficulty.slice(1)}}`)
  }
  
  // Add description as a comment if provided
  if (options.description && options.description.trim()) {
    lines.push(`{comment: ${options.description.trim()}}`)
  }
  
  // Add empty line after metadata
  if (lines.length > 0) {
    lines.push('')
  }
  
  // Add basic song structure template
  lines.push('{start_of_verse}')
  lines.push('// Add your verse lyrics and chords here')
  lines.push('// Example: [C]Amazing [G]grace how [Am]sweet the [F]sound')
  lines.push('{end_of_verse}')
  lines.push('')
  lines.push('{start_of_chorus}')
  lines.push('// Add your chorus lyrics and chords here')
  lines.push('{end_of_chorus}')
  lines.push('')
  lines.push('{comment: Add more sections as needed (verse, chorus, bridge, etc.)}')
  
  return lines.join('\n')
}

/**
 * Generate a minimal ChordPro template with just essential metadata
 */
export function generateMinimalTemplate(title?: string, key?: string): string {
  const lines: string[] = []
  
  if (title) {
    lines.push(`{title: ${title}}`)
  }
  
  if (key) {
    lines.push(`{key: ${key}}`)
  }
  
  if (lines.length > 0) {
    lines.push('')
  }
  
  lines.push('// Start adding your lyrics and chords here')
  lines.push('// Use [chord] notation above lyrics')
  lines.push('// Example: [C]Hello [G]world')
  
  return lines.join('\n')
}

/**
 * Extract metadata from existing ChordPro content to preserve user data
 */
export function preserveExistingMetadata(existingContent: string, newOptions: TemplateOptions): string {
  if (!existingContent || !existingContent.trim()) {
    return generateChordProTemplate(newOptions)
  }
  
  // Extract existing directives
  const existingDirectives: Record<string, string> = {}
  const directivePattern = /\{([^:}]+):\s*([^}]+)\}/g
  let match
  
  while ((match = directivePattern.exec(existingContent)) !== null) {
    const directive = match[1].toLowerCase().trim()
    const value = match[2].trim()
    existingDirectives[directive] = value
  }
  
  // Merge with new options, preferring existing values
  const mergedOptions: TemplateOptions = {
    title: existingDirectives.title || newOptions.title,
    key: existingDirectives.key || newOptions.key,
    tempo: existingDirectives.tempo ? parseInt(existingDirectives.tempo, 10) : newOptions.tempo,
    timeSignature: existingDirectives.time || newOptions.timeSignature,
    capo: existingDirectives.capo ? parseInt(existingDirectives.capo, 10) : newOptions.capo,
    description: newOptions.description // Always use new description if provided
  }
  
  // Return existing content if it has substantial content beyond directives
  const contentWithoutDirectives = existingContent.replace(/\{[^:}]+:[^}]+\}/g, '').trim()
  if (contentWithoutDirectives.length > 50) { // Arbitrary threshold
    return existingContent
  }
  
  // Generate new template with merged metadata
  return generateChordProTemplate(mergedOptions)
}