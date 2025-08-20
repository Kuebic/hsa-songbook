# Fuse.js Implementation Guide for TypeScript/React

## Installation
```bash
npm install fuse.js
```

## Core Concepts

### 1. Initialization
```typescript
import Fuse from 'fuse.js';

const options: Fuse.IFuseOptions<T> = {
  keys: ['title', 'artist'],           // Fields to search
  threshold: 0.3,                      // 0.0 = exact, 1.0 = match anything
  includeScore: true,                  // Include confidence scores
  includeMatches: true,                // For highlighting
  minMatchCharLength: 2,               // Min chars to trigger match
  shouldSort: true,                    // Sort by score
  findAllMatches: false,               // Stop at first match
  location: 0,                         // Expected position in string
  distance: 100,                       // Max distance from location
  useExtendedSearch: true              // Enable advanced search operators
};

const fuse = new Fuse(data, options);
```

### 2. Search Patterns

#### Basic Search
```typescript
const results = fuse.search('query');
// Returns: Array<{ item: T, score: number, matches: Array }>
```

#### Extended Search Operators
```typescript
// Exact match
fuse.search("'exact phrase");

// Include operator (AND)
fuse.search("music +lyrics");

// Exclude operator (NOT)  
fuse.search("song -instrumental");

// Fuzzy match
fuse.search("amzing");  // Will match "amazing"

// Logical OR
fuse.search("rock | jazz");

// Complex query
fuse.search({
  $and: [
    { title: "amazing" },
    { $or: [{ artist: "tomlin" }, { artist: "redman" }] }
  ]
});
```

### 3. React Hook Pattern

```typescript
import { useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { debounce } from 'lodash-es';

export function useFuzzySearch<T>(
  data: T[],
  options: Fuse.IFuseOptions<T>,
  debounceMs = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Fuse.FuseResult<T>[]>([]);

  const fuse = useMemo(
    () => new Fuse(data, options),
    [data, options]
  );

  const search = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      
      const searchResults = fuse.search(searchQuery);
      setResults(searchResults);
    }, debounceMs),
    [fuse, debounceMs]
  );

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    search(searchQuery);
  }, [search]);

  return {
    query,
    results,
    handleSearch,
    fuse
  };
}
```

### 4. Highlighting Matches

```typescript
interface HighlightProps {
  text: string;
  indices: ReadonlyArray<readonly [number, number]>;
}

export function HighlightedText({ text, indices }: HighlightProps) {
  if (!indices || indices.length === 0) {
    return <span>{text}</span>;
  }

  const chunks: JSX.Element[] = [];
  let lastIndex = 0;

  indices.forEach(([start, end], i) => {
    // Add non-highlighted text before match
    if (start > lastIndex) {
      chunks.push(
        <span key={`text-${i}`}>
          {text.substring(lastIndex, start)}
        </span>
      );
    }

    // Add highlighted match
    chunks.push(
      <mark key={`highlight-${i}`} className="bg-yellow-200">
        {text.substring(start, end + 1)}
      </mark>
    );

    lastIndex = end + 1;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    chunks.push(
      <span key="text-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{chunks}</>;
}
```

### 5. Performance Optimization

#### Indexing Large Datasets
```typescript
// Pre-build index for better performance
const fuseIndex = Fuse.createIndex(options.keys!, data);
const fuse = new Fuse(data, options, fuseIndex);

// Save index for later use
const serializedIndex = JSON.stringify(fuseIndex.toJSON());
localStorage.setItem('fuseIndex', serializedIndex);

// Load saved index
const savedIndex = localStorage.getItem('fuseIndex');
if (savedIndex) {
  const parsedIndex = JSON.parse(savedIndex);
  const index = Fuse.parseIndex(parsedIndex);
  const fuse = new Fuse(data, options, index);
}
```

#### Async Search for Large Datasets
```typescript
function useAsyncFuzzySearch<T>(
  data: T[],
  options: Fuse.IFuseOptions<T>
) {
  const [loading, setLoading] = useState(false);
  
  const searchAsync = useCallback(async (query: string) => {
    setLoading(true);
    
    // Run search in next tick to avoid blocking UI
    const results = await new Promise<Fuse.FuseResult<T>[]>((resolve) => {
      setTimeout(() => {
        const fuse = new Fuse(data, options);
        resolve(fuse.search(query));
      }, 0);
    });
    
    setLoading(false);
    return results;
  }, [data, options]);
  
  return { searchAsync, loading };
}
```

### 6. Weighted Search

```typescript
const options: Fuse.IFuseOptions<Song> = {
  keys: [
    { name: 'title', weight: 0.5 },      // 50% importance
    { name: 'artist', weight: 0.3 },     // 30% importance  
    { name: 'themes', weight: 0.2 }      // 20% importance
  ],
  // Nested property search
  keys: ['metadata.tags', 'arrangements.key']
};
```

### 7. Custom Scoring Function

```typescript
const options: Fuse.IFuseOptions<Song> = {
  // ... other options
  sortFn: (a, b) => {
    // Custom scoring logic
    const scoreA = a.score! * (a.item.popularity || 1);
    const scoreB = b.score! * (b.item.popularity || 1);
    return scoreA - scoreB;
  },
  // Get field value for custom logic
  getFn: (obj, path) => {
    // Custom getter for complex objects
    return path.reduce((o, p) => o?.[p], obj);
  }
};
```

## Common Gotchas

1. **Threshold Tuning**: Start with 0.3-0.4 for balanced results
2. **Key Selection**: More keys = slower search but better coverage
3. **Match Length**: Set `minMatchCharLength` to avoid single-char matches
4. **Array Searching**: Fuse handles arrays in keys automatically
5. **Case Sensitivity**: Default is case-insensitive (good for most use cases)

## TypeScript Types

```typescript
import Fuse from 'fuse.js';

// Result type
type FuseResult<T> = {
  item: T;
  refIndex: number;
  score?: number;
  matches?: Array<{
    indices: ReadonlyArray<readonly [number, number]>;
    value?: string;
    key?: string;
    arrayIndex?: number;
  }>;
};

// Options interface is already provided by Fuse
type FuseOptions<T> = Fuse.IFuseOptions<T>;
```

## References
- Official Docs: https://fusejs.io/
- GitHub: https://github.com/krisk/Fuse
- API Reference: https://fusejs.io/api/options.html