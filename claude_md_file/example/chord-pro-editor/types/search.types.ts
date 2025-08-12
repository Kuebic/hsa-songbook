/**
 * @file search.types.ts
 * @description TypeScript type definitions for song search and filtering functionality
 */

import type { ISong } from '../../../../server/models/types';

// Re-export ISong as Song for client usage
export type Song = ISong;

export interface SearchFilters {
  /** Search query string */
  query?: string;
  /** Musical keys to filter by */
  key?: string[];
  /** Tempo range [min, max] in BPM */
  tempo?: [number, number];
  /** Difficulty levels */
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  /** Song themes/categories */
  themes?: string[];
  /** Source/origin of songs */
  source?: string[];
  /** Sort criteria */
  sortBy?: 'relevance' | 'title' | 'artist' | 'date' | 'popularity';
  /** Current page number */
  page?: number;
  /** Results per page */
  limit?: number;
}

export interface SearchResult {
  /** Array of matching songs */
  songs: ISong[];
  /** Total number of matching songs */
  totalCount: number;
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Available filter options based on current results */
  availableFilters: AvailableFilters;
  /** Search execution time in milliseconds */
  executionTime?: number;
}

export interface AvailableFilters {
  /** Available musical keys with counts */
  keys: FilterOption[];
  /** Available difficulty levels with counts */
  difficulties: FilterOption[];
  /** Available themes with counts */
  themes: FilterOption[];
  /** Available sources with counts */
  sources: FilterOption[];
  /** Tempo range [min, max] from all songs */
  tempoRange: [number, number];
}

export interface FilterOption {
  /** Filter value */
  value: string;
  /** Display label */
  label: string;
  /** Number of songs with this filter value */
  count: number;
}

export interface SearchState {
  /** Current search filters */
  filters: SearchFilters;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Search results */
  results: SearchResult | null;
  /** Whether search has been executed */
  hasSearched: boolean;
}

export interface UseSearchQueryOptions {
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Whether to sync with URL */
  syncWithUrl?: boolean;
  /** Default filters */
  defaultFilters?: Partial<SearchFilters>;
  /** Callback when search is triggered */
  onSearch?: (filters: SearchFilters) => void;
}

export interface UseSearchQueryResult {
  /** Current search filters */
  filters: SearchFilters;
  /** Update search query */
  setQuery: (query: string) => void;
  /** Update specific filter */
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  /** Update multiple filters at once */
  updateFilters: (updates: Partial<SearchFilters>) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Clear specific filter */
  clearFilter: (key: keyof SearchFilters) => void;
  /** Get shareable URL for current search */
  getShareableUrl: () => string;
  /** Load filters from URL */
  loadFromUrl: () => void;
}

export interface UseSearchResultsOptions {
  /** Whether to enable the query */
  enabled?: boolean;
  /** Whether to keep previous data while loading */
  keepPreviousData?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Cache time in milliseconds */
  cacheTime?: number;
}

export interface UseSearchResultsResult {
  /** Search results */
  data: SearchResult | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether currently fetching */
  isFetching: boolean;
  /** Whether there is cached data */
  isStale: boolean;
  /** Refetch the search */
  refetch: () => void;
}

export interface SearchComponentProps {
  /** CSS class name */
  className?: string;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Callback when search is performed */
  onSearch?: (filters: SearchFilters) => void;
  /** Callback when filters change */
  onFiltersChange?: (filters: SearchFilters) => void;
  /** Initial search filters */
  initialFilters?: Partial<SearchFilters>;
  /** Whether to show advanced filters */
  showAdvancedFilters?: boolean;
}

export interface SearchFiltersProps {
  /** Current filter values */
  filters: SearchFilters;
  /** Available filter options */
  availableFilters?: AvailableFilters;
  /** Callback when filters change */
  onChange: (filters: SearchFilters) => void;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Compact layout for mobile */
  compact?: boolean;
  /** CSS class name */
  className?: string;
}

export interface SearchResultsProps {
  /** Search results to display */
  results: SearchResult | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Whether search has been performed */
  hasSearched: boolean;
  /** Callback when song is selected */
  onSongSelect?: (song: ISong) => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Current search filters for context */
  filters: SearchFilters;
  /** CSS class name */
  className?: string;
}

export interface FilterBottomSheetProps {
  /** Whether bottom sheet is open */
  isOpen: boolean;
  /** Callback to close bottom sheet */
  onClose: () => void;
  /** Current filter values */
  filters: SearchFilters;
  /** Available filter options */
  availableFilters?: AvailableFilters;
  /** Callback when filters are applied */
  onApplyFilters: (filters: SearchFilters) => void;
  /** Whether to show backdrop */
  showBackdrop?: boolean;
}

export interface SearchSkeletonProps {
  /** Number of result items to show */
  itemCount?: number;
  /** Whether to show filter skeleton */
  showFilters?: boolean;
  /** CSS class name */
  className?: string;
}

export interface SearchApiClient {
  /** Search songs with filters */
  searchSongs: (filters: SearchFilters) => Promise<SearchResult>;
  /** Get available filter options */
  getAvailableFilters: () => Promise<AvailableFilters>;
  /** Get search suggestions */
  getSearchSuggestions: (query: string) => Promise<string[]>;
}

export interface MobileSearchState {
  /** Whether bottom sheet is open */
  isBottomSheetOpen: boolean;
  /** Active filter category in bottom sheet */
  activeFilterCategory: string | null;
  /** Whether search input is focused */
  isSearchFocused: boolean;
}

export interface UseSearchMobileResult {
  /** Mobile search state */
  state: MobileSearchState;
  /** Open bottom sheet */
  openBottomSheet: () => void;
  /** Close bottom sheet */
  closeBottomSheet: () => void;
  /** Set active filter category */
  setActiveFilterCategory: (category: string | null) => void;
  /** Set search focus state */
  setSearchFocused: (focused: boolean) => void;
}

/** Search debounce delay constant */
export const SEARCH_DEBOUNCE_DELAY = 300;

/** Default search results per page */
export const DEFAULT_SEARCH_LIMIT = 20;

/** Maximum search results per page */
export const MAX_SEARCH_LIMIT = 100;

/** Search API endpoint paths */
export const SEARCH_API_ENDPOINTS = {
  SEARCH: '/api/songs/search',
  FILTERS: '/api/songs/filters',
  SUGGESTIONS: '/api/songs/suggestions'
} as const;

/** Filter categories for bottom sheet organization */
export const FILTER_CATEGORIES = {
  SEARCH: 'search',
  MUSICAL: 'musical',
  CONTENT: 'content',
  SORTING: 'sorting'
} as const;

/** Available sort options */
export const SORT_OPTIONS: Array<{ value: SearchFilters['sortBy']; label: string }> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'artist', label: 'Artist A-Z' },
  { value: 'date', label: 'Date Added' },
  { value: 'popularity', label: 'Popularity' }
];

/** Available difficulty options */
export const DIFFICULTY_OPTIONS: Array<{ value: string; label: string; color: string }> = [
  { value: 'beginner', label: 'Beginner', color: 'green' },
  { value: 'intermediate', label: 'Intermediate', color: 'yellow' },
  { value: 'advanced', label: 'Advanced', color: 'red' }
];

/** Common musical keys for filtering */
export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
] as const;

/** Tempo range constraints */
export const TEMPO_RANGE = {
  MIN: 60,
  MAX: 200,
  DEFAULT: [80, 140] as [number, number]
} as const;