/**
 * @file useSearchQuery.ts
 * @description React hook for managing search query state with debouncing and URL synchronization
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  SearchFilters,
  UseSearchQueryOptions,
  UseSearchQueryResult
} from '../types/search.types';

/**
 * Default search filters
 */
const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  page: 1,
  limit: 20,
  sortBy: 'relevance'
};

/**
 * Convert search filters to URL search params
 */
const filtersToSearchParams = (filters: SearchFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    
    if (Array.isArray(value)) {
      if (key === 'tempo' && value.length === 2) {
        params.set(key, `${value[0]}-${value[1]}`);
      } else if (value.length > 0) {
        params.set(key, value.join(','));
      }
    } else if (value !== '') {
      params.set(key, String(value));
    }
  });
  
  return params;
};

/**
 * Convert URL search params to search filters
 */
const searchParamsToFilters = (searchParams: URLSearchParams): SearchFilters => {
  const filters: SearchFilters = { ...DEFAULT_FILTERS };
  
  // Query string
  const query = searchParams.get('query') || searchParams.get('q');
  if (query) filters.query = query;
  
  // Arrays
  const key = searchParams.get('key');
  if (key) filters.key = key.split(',');
  
  const difficulty = searchParams.get('difficulty');
  if (difficulty) {
    filters.difficulty = difficulty.split(',') as ('beginner' | 'intermediate' | 'advanced')[];
  }
  
  const themes = searchParams.get('themes');
  if (themes) filters.themes = themes.split(',');
  
  const source = searchParams.get('source');
  if (source) filters.source = source.split(',');
  
  // Tempo range
  const tempo = searchParams.get('tempo');
  if (tempo && tempo.includes('-')) {
    const [min, max] = tempo.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      filters.tempo = [min, max];
    }
  }
  
  // Sort by
  const sortBy = searchParams.get('sortBy') || searchParams.get('sort');
  if (sortBy && ['relevance', 'title', 'artist', 'date', 'popularity'].includes(sortBy)) {
    filters.sortBy = sortBy as SearchFilters['sortBy'];
  }
  
  // Pagination
  const page = searchParams.get('page');
  if (page) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      filters.page = pageNum;
    }
  }
  
  const limit = searchParams.get('limit');
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
      filters.limit = limitNum;
    }
  }
  
  return filters;
};

/**
 * Custom hook for managing search query state with debouncing and URL sync
 */
export function useSearchQuery(options: UseSearchQueryOptions = {}): UseSearchQueryResult {
  const {
    debounceDelay = 300, // SEARCH_DEBOUNCE_DELAY from types
    syncWithUrl = true,
    defaultFilters = {},
    onSearch
  } = options;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  
  // Initialize filters from URL or defaults
  const initialFilters = useMemo(() => {
    if (syncWithUrl && searchParams.toString()) {
      return { ...DEFAULT_FILTERS, ...defaultFilters, ...searchParamsToFilters(searchParams) };
    }
    return { ...DEFAULT_FILTERS, ...defaultFilters };
  }, [syncWithUrl, searchParams, defaultFilters]);
  
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  
  /**
   * Update URL when filters change (with debouncing for query)
   */
  const updateUrl = useCallback((newFilters: SearchFilters) => {
    if (!syncWithUrl) return;
    
    const params = filtersToSearchParams(newFilters);
    setSearchParams(params, { replace: true });
  }, [syncWithUrl, setSearchParams]);
  
  /**
   * Trigger search callback with debouncing for query changes
   */
  const triggerSearch = useCallback((newFilters: SearchFilters, immediate = false) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    const executeSearch = () => {
      if (onSearch) {
        onSearch(newFilters);
      }
    };
    
    // For query changes, use debouncing. For other filters, execute immediately
    if (!immediate && newFilters.query !== filters.query) {
      debounceTimeoutRef.current = setTimeout(executeSearch, debounceDelay);
    } else {
      executeSearch();
    }
  }, [filters.query, onSearch, debounceDelay]);
  
  /**
   * Update filters and trigger URL/search updates
   */
  const updateFiltersInternal = useCallback((
    updates: Partial<SearchFilters>, 
    immediate = false
  ) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, ...updates };
      
      // Reset page when filters change (except for page changes)
      if (!updates.page && Object.keys(updates).some(key => key !== 'page')) {
        newFilters.page = 1;
      }
      
      // Update URL immediately for all changes
      updateUrl(newFilters);
      
      // Trigger search with appropriate timing
      if (isInitializedRef.current) {
        triggerSearch(newFilters, immediate);
      }
      
      return newFilters;
    });
  }, [updateUrl, triggerSearch]);
  
  /**
   * Set search query with debouncing
   */
  const setQuery = useCallback((query: string) => {
    updateFiltersInternal({ query }, false);
  }, [updateFiltersInternal]);
  
  /**
   * Update specific filter
   */
  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    updateFiltersInternal({ [key]: value }, true);
  }, [updateFiltersInternal]);
  
  /**
   * Update multiple filters at once
   */
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    updateFiltersInternal(updates, true);
  }, [updateFiltersInternal]);
  
  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    const clearedFilters = { ...DEFAULT_FILTERS, ...defaultFilters };
    setFilters(clearedFilters);
    updateUrl(clearedFilters);
    
    if (isInitializedRef.current && onSearch) {
      onSearch(clearedFilters);
    }
  }, [defaultFilters, updateUrl, onSearch]);
  
  /**
   * Clear specific filter
   */
  const clearFilter = useCallback((key: keyof SearchFilters) => {
    const updates: Partial<SearchFilters> = {};
    
    if (key === 'query') {
      updates.query = '';
    } else if (Array.isArray(filters[key])) {
      updates[key] = undefined;
    } else {
      updates[key] = undefined;
    }
    
    updateFiltersInternal(updates, true);
  }, [filters, updateFiltersInternal]);
  
  /**
   * Get shareable URL for current search
   */
  const getShareableUrl = useCallback(() => {
    const params = filtersToSearchParams(filters);
    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
  }, [filters]);
  
  /**
   * Load filters from URL
   */
  const loadFromUrl = useCallback(() => {
    if (syncWithUrl) {
      const urlFilters = searchParamsToFilters(searchParams);
      setFilters({ ...DEFAULT_FILTERS, ...defaultFilters, ...urlFilters });
    }
  }, [syncWithUrl, searchParams, defaultFilters]);
  
  /**
   * Initialize hook and handle URL changes
   */
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      // Trigger initial search if there are meaningful filters
      if (filters.query || filters.key?.length || filters.difficulty?.length) {
        if (onSearch) {
          onSearch(filters);
        }
      }
    }
  }, [filters, onSearch]);
  
  /**
   * Cleanup debounce timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Handle browser back/forward navigation
   */
  useEffect(() => {
    if (syncWithUrl) {
      const urlFilters = searchParamsToFilters(searchParams);
      const urlString = JSON.stringify(urlFilters);
      const currentString = JSON.stringify(filters);
      
      if (urlString !== currentString) {
        setFilters({ ...DEFAULT_FILTERS, ...defaultFilters, ...urlFilters });
      }
    }
  }, [searchParams, syncWithUrl, defaultFilters, filters]);
  
  return {
    filters,
    setQuery,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    getShareableUrl,
    loadFromUrl
  };
}