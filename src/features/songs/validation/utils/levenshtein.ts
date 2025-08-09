/**
 * Calculate the Levenshtein distance between two strings
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one word into the other
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns The Levenshtein distance between the two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  // If one string is empty, the distance is the length of the other
  if (str1.length === 0) return str2.length
  if (str2.length === 0) return str1.length
  
  // Initialize the first column (str2 characters)
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  // Initialize the first row (str1 characters)
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  // Fill in the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        // Characters match, no operation needed
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        // Characters don't match, take minimum of three operations
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Calculate the normalized Levenshtein distance (0 to 1)
 * 0 means strings are identical, 1 means completely different
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Normalized distance between 0 and 1
 */
export function normalizedLevenshteinDistance(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 0
  
  const distance = levenshteinDistance(str1, str2)
  return distance / maxLength
}

/**
 * Calculate similarity percentage between two strings
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity percentage (0-100)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const normalized = normalizedLevenshteinDistance(str1, str2)
  return Math.round((1 - normalized) * 100)
}

/**
 * Check if two strings are similar based on Levenshtein distance
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @param threshold - Maximum distance to consider similar (default: 3)
 * @returns True if strings are similar
 */
export function areSimilar(str1: string, str2: string, threshold: number = 3): boolean {
  return levenshteinDistance(str1, str2) <= threshold
}