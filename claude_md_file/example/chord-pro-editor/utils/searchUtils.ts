/**
 * @file searchUtils.ts
 * @description Utility functions for search functionality
 */

import type { SearchFilters, FilterOption } from '../types/search.types';

/**
 * Check if search filters have any active values
 */
export const hasActiveFilters = (filters: SearchFilters): boolean => {
  return !!(
    (filters.query && filters.query.trim()) ||
    (filters.key && filters.key.length > 0) ||
    (filters.difficulty && filters.difficulty.length > 0) ||
    (filters.themes && filters.themes.length > 0) ||
    (filters.source && filters.source.length > 0) ||
    filters.tempo ||
    (filters.sortBy && filters.sortBy !== 'relevance')
  );
};

/**
 * Count the number of active filters
 */
export const getActiveFilterCount = (filters: SearchFilters): number => {
  let count = 0;
  
  if (filters.query && filters.query.trim()) count++;
  if (filters.key && filters.key.length > 0) count++;
  if (filters.difficulty && filters.difficulty.length > 0) count++;
  if (filters.themes && filters.themes.length > 0) count++;
  if (filters.source && filters.source.length > 0) count++;
  if (filters.tempo) count++;
  if (filters.sortBy && filters.sortBy !== 'relevance') count++;
  
  return count;
};

/**
 * Generate a human-readable description of active filters
 */
export const getFilterDescription = (filters: SearchFilters): string => {
  const parts: string[] = [];
  
  if (filters.query) {
    parts.push(`"${filters.query}"`);
  }
  
  if (filters.key && filters.key.length > 0) {
    parts.push(`key: ${filters.key.join(', ')}`);
  }
  
  if (filters.difficulty && filters.difficulty.length > 0) {
    parts.push(`difficulty: ${filters.difficulty.join(', ')}`);
  }
  
  if (filters.themes && filters.themes.length > 0) {
    parts.push(`themes: ${filters.themes.join(', ')}`);
  }
  
  if (filters.source && filters.source.length > 0) {
    parts.push(`source: ${filters.source.join(', ')}`);
  }
  
  if (filters.tempo) {
    parts.push(`tempo: ${filters.tempo[0]}-${filters.tempo[1]} BPM`);
  }
  
  if (filters.sortBy && filters.sortBy !== 'relevance') {
    parts.push(`sorted by ${filters.sortBy}`);
  }
  
  return parts.join(' • ');
};

/**
 * Format filter options for display
 */
export const formatFilterOptions = (options: FilterOption[]): FilterOption[] => {
  return options
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .map(option => ({
      ...option,
      label: `${option.label} (${option.count})`
    }));
};

/**
 * Create filter chips for active filters
 */
export const createFilterChips = (filters: SearchFilters): Array<{
  key: string;
  label: string;
  value: string;
  onRemove: () => Partial<SearchFilters>;
}> => {
  const chips: Array<{
    key: string;
    label: string;
    value: string;
    onRemove: () => Partial<SearchFilters>;
  }> = [];
  
  // Query chip
  if (filters.query) {
    chips.push({
      key: 'query',
      label: 'Search',
      value: filters.query,
      onRemove: () => ({ query: '' })
    });
  }
  
  // Key chips
  if (filters.key && filters.key.length > 0) {
    filters.key.forEach(key => {
      chips.push({
        key: `key-${key}`,
        label: 'Key',
        value: key,
        onRemove: () => ({
          key: filters.key?.filter(k => k !== key)
        })
      });
    });
  }
  
  // Difficulty chips
  if (filters.difficulty && filters.difficulty.length > 0) {
    filters.difficulty.forEach(difficulty => {
      chips.push({
        key: `difficulty-${difficulty}`,
        label: 'Difficulty',
        value: difficulty,
        onRemove: () => ({
          difficulty: filters.difficulty?.filter(d => d !== difficulty)
        })
      });
    });
  }
  
  // Theme chips
  if (filters.themes && filters.themes.length > 0) {
    filters.themes.forEach(theme => {
      chips.push({
        key: `theme-${theme}`,
        label: 'Theme',
        value: theme,
        onRemove: () => ({
          themes: filters.themes?.filter(t => t !== theme)
        })
      });
    });
  }
  
  // Source chips
  if (filters.source && filters.source.length > 0) {
    filters.source.forEach(source => {
      chips.push({
        key: `source-${source}`,
        label: 'Source',
        value: source,
        onRemove: () => ({
          source: filters.source?.filter(s => s !== source)
        })
      });
    });
  }
  
  // Tempo chip
  if (filters.tempo) {
    chips.push({
      key: 'tempo',
      label: 'Tempo',
      value: `${filters.tempo[0]}-${filters.tempo[1]} BPM`,
      onRemove: () => ({ tempo: undefined })
    });
  }
  
  // Sort chip
  if (filters.sortBy && filters.sortBy !== 'relevance') {
    chips.push({
      key: 'sortBy',
      label: 'Sort',
      value: filters.sortBy,
      onRemove: () => ({ sortBy: 'relevance' })
    });
  }
  
  return chips;
};

/**
 * Debounce utility function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Generate search analytics data
 */
export const generateSearchAnalytics = (
  filters: SearchFilters,
  resultCount: number,
  executionTime?: number
) => ({
  query: filters.query || '',
  filterCount: getActiveFilterCount(filters),
  resultCount,
  executionTime: executionTime || 0,
  timestamp: new Date().toISOString(),
  filters: {
    hasQuery: !!filters.query,
    hasKeyFilter: !!(filters.key && filters.key.length > 0),
    hasDifficultyFilter: !!(filters.difficulty && filters.difficulty.length > 0),
    hasThemeFilter: !!(filters.themes && filters.themes.length > 0),
    hasSourceFilter: !!(filters.source && filters.source.length > 0),
    hasTempoFilter: !!filters.tempo,
    sortBy: filters.sortBy || 'relevance'
  }
});

/**
 * Validate search filters
 */
export const validateSearchFilters = (filters: SearchFilters): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Validate query length
  if (filters.query && filters.query.length > 100) {
    errors.push('Search query must be less than 100 characters');
  }
  
  // Validate page number
  if (filters.page !== undefined && (filters.page < 1 || filters.page > 1000)) {
    errors.push('Page number must be between 1 and 1000');
  }
  
  // Validate limit
  if (filters.limit !== undefined && (filters.limit < 1 || filters.limit > 100)) {
    errors.push('Results per page must be between 1 and 100');
  }
  
  // Validate tempo range
  if (filters.tempo) {
    const [min, max] = filters.tempo;
    if (min < 60 || max > 200 || min >= max) {
      errors.push('Tempo range must be between 60-200 BPM with min < max');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize search query for safe API usage
 */
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s\-'".]/g, '') // Keep only alphanumeric, spaces, hyphens, apostrophes, quotes
    .substring(0, 100); // Limit length
};