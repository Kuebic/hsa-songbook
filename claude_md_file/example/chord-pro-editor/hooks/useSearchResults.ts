/**
 * @file useSearchResults.ts
 * @description React hook for fetching search results with React Query integration
 */

import { useQuery } from '@tanstack/react-query';
import type {
  SearchFilters,
  SearchResult,
  UseSearchResultsOptions,
  UseSearchResultsResult
} from '../types/search.types';
import { hasActiveFilters, validateSearchFilters } from '../utils/searchUtils';

/**
 * Mock API function for search results
 * In a real implementation, this would call the actual search API
 */
const fetchSearchResults = async (filters: SearchFilters): Promise<SearchResult> => {
  const startTime = performance.now();
  
  // Validate filters
  const validation = validateSearchFilters(filters);
  if (!validation.isValid) {
    throw new Error(`Invalid search filters: ${validation.errors.join(', ')}`);
  }
  
  // Simulate API delay (should be <300ms as per requirements)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
  
  // Mock search results based on filters
  const mockSongs = [
    {
      id: '1',
      title: 'Amazing Grace',
      artist: 'Traditional',
      slug: 'amazing-grace',
      key: 'G',
      tempo: 90,
      difficulty: 'beginner' as const,
      themes: ['hymn', 'worship'],
      source: 'Traditional Hymnal',
      lyrics: 'Amazing grace, how sweet the sound...',
      metadata: {
        isPublic: true,
        ratings: { average: 4.8, count: 120 },
        views: 1500
      },
      documentSize: 1024,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      id: '2',
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      slug: 'how-great-thou-art',
      key: 'C',
      tempo: 85,
      difficulty: 'intermediate' as const,
      themes: ['hymn', 'praise'],
      source: 'Traditional Hymnal',
      lyrics: 'O Lord my God, when I in awesome wonder...',
      metadata: {
        isPublic: true,
        ratings: { average: 4.9, count: 200 },
        views: 2500
      },
      documentSize: 1280,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: '3',
      title: 'Holy Spirit',
      artist: 'Francesca Battistelli',
      slug: 'holy-spirit',
      key: 'D',
      tempo: 120,
      difficulty: 'advanced' as const,
      themes: ['contemporary', 'worship'],
      source: 'CCLI',
      lyrics: 'Holy Spirit, You are welcome here...',
      metadata: {
        isPublic: true,
        ratings: { average: 4.7, count: 89 },
        views: 890
      },
      documentSize: 950,
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2023-02-01')
    }
  ];
  
  // Filter songs based on search criteria
  let filteredSongs = mockSongs;
  
  // Text search
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredSongs = filteredSongs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.lyrics?.toLowerCase().includes(query)
    );
  }
  
  // Key filter
  if (filters.key && filters.key.length > 0) {
    filteredSongs = filteredSongs.filter(song => 
      song.key && filters.key!.includes(song.key)
    );
  }
  
  // Difficulty filter
  if (filters.difficulty && filters.difficulty.length > 0) {
    filteredSongs = filteredSongs.filter(song => 
      song.difficulty && filters.difficulty!.includes(song.difficulty)
    );
  }
  
  // Themes filter
  if (filters.themes && filters.themes.length > 0) {
    filteredSongs = filteredSongs.filter(song =>
      song.themes && song.themes.some(theme => filters.themes!.includes(theme))
    );
  }
  
  // Source filter
  if (filters.source && filters.source.length > 0) {
    filteredSongs = filteredSongs.filter(song =>
      song.source && filters.source!.includes(song.source)
    );
  }
  
  // Tempo filter
  if (filters.tempo) {
    const [minTempo, maxTempo] = filters.tempo;
    filteredSongs = filteredSongs.filter(song =>
      song.tempo && song.tempo >= minTempo && song.tempo <= maxTempo
    );
  }
  
  // Sort results
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'title':
        filteredSongs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'artist':
        filteredSongs.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
        break;
      case 'date':
        filteredSongs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'popularity':
        filteredSongs.sort((a, b) => (b.metadata?.views || 0) - (a.metadata?.views || 0));
        break;
      case 'relevance':
      default:
        // Keep original order for relevance
        break;
    }
  }
  
  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedSongs = filteredSongs.slice(startIndex, endIndex);
  
  const executionTime = performance.now() - startTime;
  
  return {
    songs: paginatedSongs,
    totalCount: filteredSongs.length,
    currentPage: page,
    totalPages: Math.ceil(filteredSongs.length / limit),
    availableFilters: {
      keys: [
        { value: 'C', label: 'C', count: 1 },
        { value: 'D', label: 'D', count: 1 },
        { value: 'G', label: 'G', count: 1 }
      ],
      difficulties: [
        { value: 'beginner', label: 'Beginner', count: 1 },
        { value: 'intermediate', label: 'Intermediate', count: 1 },
        { value: 'advanced', label: 'Advanced', count: 1 }
      ],
      themes: [
        { value: 'hymn', label: 'Hymn', count: 2 },
        { value: 'worship', label: 'Worship', count: 2 },
        { value: 'contemporary', label: 'Contemporary', count: 1 },
        { value: 'praise', label: 'Praise', count: 1 }
      ],
      sources: [
        { value: 'Traditional Hymnal', label: 'Traditional Hymnal', count: 2 },
        { value: 'CCLI', label: 'CCLI', count: 1 }
      ],
      tempoRange: [85, 120]
    },
    executionTime
  };
};

/**
 * Generate a unique query key for React Query caching
 */
const getSearchQueryKey = (filters: SearchFilters): [string, SearchFilters] => {
  return ['songs-search', filters];
};

/**
 * Custom hook for fetching search results with React Query
 * 
 * Features:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Error handling and retry logic
 * - Loading states management
 * - Optimistic updates support
 * 
 * @param filters - Search filters to apply
 * @param options - Additional options for the query
 * @returns Search results with loading states
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useSearchResults(
 *   { query: 'Amazing Grace', difficulty: ['beginner'] },
 *   { enabled: true, keepPreviousData: true } // Note: keepPreviousData maps to placeholderData
 * );
 * 
 * if (isLoading) return <SearchSkeleton />;
 * if (error) return <SearchError error={error} onRetry={refetch} />;
 * 
 * return <SearchResults results={data} />;
 * ```
 */
export function useSearchResults(
  filters: SearchFilters,
  options: UseSearchResultsOptions = {}
): UseSearchResultsResult {
  const {
    enabled = true,
    keepPreviousData = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000 // 10 minutes
  } = options;
  
  // Only enable query if there are meaningful search criteria
  const shouldFetch = enabled && (hasActiveFilters(filters) || filters.query === '');
  
  const queryResult = useQuery({
    queryKey: getSearchQueryKey(filters),
    queryFn: () => fetchSearchResults(filters),
    enabled: shouldFetch,
    staleTime,
    gcTime: cacheTime, // Updated property name in newer React Query versions
    placeholderData: keepPreviousData ? (previousData) => previousData : undefined,
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes('Invalid search filters')) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    meta: {
      errorMessage: 'Failed to load search results. Please try again.'
    }
  });
  
  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isFetching: queryResult.isFetching,
    isStale: queryResult.isStale,
    refetch: queryResult.refetch
  };
}

/**
 * Hook for prefetching search results
 * Useful for preloading likely search results
 */
export function usePrefetchSearchResults() {
  const { useQueryClient } = require('@tanstack/react-query');
  const queryClient = useQueryClient();
  
  const prefetchSearch = async (filters: SearchFilters) => {
    await queryClient.prefetchQuery({
      queryKey: getSearchQueryKey(filters),
      queryFn: () => fetchSearchResults(filters),
      staleTime: 5 * 60 * 1000
    });
  };
  
  return { prefetchSearch };
}

/**
 * Hook for invalidating search results cache
 * Useful when songs are added/updated/deleted
 */
export function useInvalidateSearchResults() {
  const { useQueryClient } = require('@tanstack/react-query');
  const queryClient = useQueryClient();
  
  const invalidateSearch = async (filters?: Partial<SearchFilters>) => {
    if (filters) {
      // Invalidate specific search
      await queryClient.invalidateQueries({
        queryKey: ['songs-search'],
        predicate: (query: { queryKey: unknown[] }) => {
          if (!query.queryKey[1]) return false;
          const queryFilters = query.queryKey[1] as SearchFilters;
          
          // Check if any of the provided filters match
          return Object.entries(filters).some(([key, value]) => {
            return queryFilters[key as keyof SearchFilters] === value;
          });
        }
      });
    } else {
      // Invalidate all search results
      await queryClient.invalidateQueries({
        queryKey: ['songs-search']
      });
    }
  };
  
  return { invalidateSearch };
}