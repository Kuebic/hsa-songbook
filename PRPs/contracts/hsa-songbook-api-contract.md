# HSA Songbook API Contract Specification

## Version: 1.0.0
## Base URL: `/api/v1`

This document defines the complete API contract between the backend and frontend for the HSA Songbook application.

---

## 1. Songs API

### Endpoints

```yaml
Base URL: /api/v1/songs

Endpoints:
- GET /api/v1/songs
  Query params: 
    - page: number (default: 0)
    - size: number (default: 20, max: 100)
    - sort: string (format: "field,direction")
    - search: string (full-text search)
    - themes: string[] (filter by themes)
    - difficulty: string (EASY|MEDIUM|HARD)
  Response: Page<SongResponse>

- GET /api/v1/songs/{id}
  Path param: id (string - MongoDB ObjectId)
  Response: SongResponse

- GET /api/v1/songs/slug/{slug}
  Path param: slug (string)
  Response: SongResponse

- POST /api/v1/songs
  Body: SongRequest
  Response: SongResponse (201 Created)
  Required role: USER

- PATCH /api/v1/songs/{id}
  Path param: id (string)
  Body: Partial<SongRequest>
  Response: SongResponse
  Required role: USER (owner) or MODERATOR

- DELETE /api/v1/songs/{id}
  Path param: id (string)
  Response: 204 No Content
  Required role: ADMIN

- POST /api/v1/songs/{id}/rate
  Path param: id (string)
  Body: { rating: number }
  Response: { avgRating: number, totalRatings: number }
  Required role: USER

- GET /api/v1/songs/search
  Query params:
    - q: string (search query)
    - limit: number (default: 10)
  Response: SongSearchResult[]
```

### Data Transfer Objects (DTOs)

```typescript
// Request DTO (for POST/PATCH)
interface SongRequest {
  title: string;               // required, min: 1, max: 200
  artist?: string;             // optional, max: 100
  slug?: string;               // auto-generated if not provided
  compositionYear?: number;    // 1900-current year
  ccli?: string;               // CCLI number
  themes?: string[];           // normalized theme tags
  source?: string;             // max: 200
  notes?: string;              // max: 2000
  defaultArrangementId?: string;
  isPublic?: boolean;          // default: true
}

// Response DTO (for GET)
interface SongResponse {
  id: string;                  // MongoDB ObjectId
  title: string;
  artist?: string;
  slug: string;
  compositionYear?: number;
  ccli?: string;
  themes: string[];
  source?: string;
  notes?: string;
  defaultArrangementId?: string;
  createdBy: string;           // User ID
  createdByName?: string;      // User display name
  lastModifiedBy?: string;
  isPublic: boolean;
  ratings: {
    average: number;           // 0-5
    count: number;
  };
  views: number;
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
}

// Search result DTO
interface SongSearchResult {
  id: string;
  title: string;
  artist?: string;
  slug: string;
  themes: string[];
  matchScore: number;          // Search relevance score
}
```

---

## 2. Arrangements API

### Endpoints

```yaml
Base URL: /api/v1/arrangements

Endpoints:
- GET /api/v1/arrangements
  Query params:
    - page: number
    - size: number
    - songId: string (filter by song)
    - key: string (musical key)
    - difficulty: string
    - tags: string[]
  Response: Page<ArrangementResponse>

- GET /api/v1/arrangements/{id}
  Path param: id (string)
  Response: ArrangementResponse

- GET /api/v1/arrangements/slug/{slug}
  Path param: slug (string)
  Response: ArrangementResponse

- GET /api/v1/arrangements/song/{songId}
  Path param: songId (string)
  Response: ArrangementResponse[]

- POST /api/v1/arrangements
  Body: ArrangementRequest
  Response: ArrangementResponse (201 Created)
  Required role: USER

- PATCH /api/v1/arrangements/{id}
  Path param: id (string)
  Body: Partial<ArrangementRequest>
  Response: ArrangementResponse
  Required role: USER (owner) or MODERATOR

- DELETE /api/v1/arrangements/{id}
  Path param: id (string)
  Response: 204 No Content
  Required role: ADMIN

- POST /api/v1/arrangements/{id}/rate
  Path param: id (string)
  Body: { rating: number }
  Response: { avgRating: number, totalRatings: number }
  Required role: USER

- POST /api/v1/arrangements/{id}/transpose
  Path param: id (string)
  Body: { targetKey: string, preferSharps: boolean }
  Response: { chordData: string }
```

### Data Transfer Objects (DTOs)

```typescript
// Request DTO
interface ArrangementRequest {
  name: string;                // required, min: 1, max: 100
  slug?: string;               // auto-generated if not provided
  songIds: string[];           // required, min: 1 song
  key?: string;                // musical key (C, G, D, etc.)
  tempo?: number;              // BPM, 40-240
  timeSignature?: string;      // e.g., "4/4", "3/4"
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
  chordData: string;           // required, ChordPro format (will be compressed)
  description?: string;        // max: 1000
  isMashup?: boolean;
  mashupSections?: MashupSection[];
  isPublic?: boolean;
}

interface MashupSection {
  songId: string;
  startMeasure: number;
  endMeasure: number;
  label?: string;
}

// Response DTO
interface ArrangementResponse {
  id: string;
  name: string;
  slug: string;
  songIds: string[];
  songs?: SongResponse[];      // Populated song objects
  key?: string;
  tempo?: number;
  timeSignature?: string;
  difficulty?: string;
  tags: string[];
  chordData: string;           // Decompressed ChordPro
  chordDataSize: number;       // Size in bytes (compressed)
  description?: string;
  createdBy: string;
  createdByName?: string;
  isMashup: boolean;
  mashupSections?: MashupSection[];
  isPublic: boolean;
  ratings: {
    average: number;
    count: number;
  };
  views: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Reviews API

### Endpoints

```yaml
Base URL: /api/v1/reviews

Endpoints:
- GET /api/v1/reviews
  Query params:
    - songId: string
    - arrangementId: string
    - userId: string
    - page: number
    - size: number
  Response: Page<ReviewResponse>

- POST /api/v1/reviews
  Body: ReviewRequest
  Response: ReviewResponse (201 Created)
  Required role: USER

- PATCH /api/v1/reviews/{id}
  Path param: id (string)
  Body: Partial<ReviewRequest>
  Response: ReviewResponse
  Required role: USER (owner)

- DELETE /api/v1/reviews/{id}
  Path param: id (string)
  Response: 204 No Content
  Required role: USER (owner) or MODERATOR

- POST /api/v1/reviews/{id}/vote
  Path param: id (string)
  Body: { type: 'helpful' | 'notHelpful' }
  Response: { helpful: number, notHelpful: number }
  Required role: USER
```

### Data Transfer Objects (DTOs)

```typescript
// Request DTO
interface ReviewRequest {
  songId?: string;             // Either songId or arrangementId required
  arrangementId?: string;
  rating: number;              // required, 1-5
  comment?: string;            // max: 2000
}

// Response DTO
interface ReviewResponse {
  id: string;
  songId?: string;
  song?: SongResponse;         // Populated if songId present
  arrangementId?: string;
  arrangement?: ArrangementResponse; // Populated if arrangementId present
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  helpful: number;
  notHelpful: number;
  userVote?: 'helpful' | 'notHelpful'; // Current user's vote
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. Setlists API

### Endpoints

```yaml
Base URL: /api/v1/setlists

Endpoints:
- GET /api/v1/setlists
  Query params:
    - page: number
    - size: number
    - createdBy: string
    - isPublic: boolean
  Response: Page<SetlistResponse>

- GET /api/v1/setlists/{id}
  Path param: id (string)
  Response: SetlistResponse

- POST /api/v1/setlists
  Body: SetlistRequest
  Response: SetlistResponse (201 Created)
  Required role: USER

- PATCH /api/v1/setlists/{id}
  Path param: id (string)
  Body: Partial<SetlistRequest>
  Response: SetlistResponse
  Required role: USER (owner)

- DELETE /api/v1/setlists/{id}
  Path param: id (string)
  Response: 204 No Content
  Required role: USER (owner) or ADMIN

- POST /api/v1/setlists/{id}/duplicate
  Path param: id (string)
  Body: { name: string }
  Response: SetlistResponse (201 Created)
  Required role: USER

- GET /api/v1/setlists/{id}/export
  Path param: id (string)
  Query params:
    - format: 'pdf' | 'docx' | 'txt'
  Response: File download
```

### Data Transfer Objects (DTOs)

```typescript
// Request DTO
interface SetlistRequest {
  name: string;                // required, min: 1, max: 200
  description?: string;        // max: 1000
  date?: string;               // ISO 8601 date
  songs: SetlistSongRequest[]; // required, min: 1
  isPublic?: boolean;          // default: false
  tags?: string[];
}

interface SetlistSongRequest {
  songId: string;              // required
  arrangementId?: string;      // optional specific arrangement
  order: number;               // required, position in setlist
  keyOverride?: string;        // transpose to different key
  notes?: string;              // performance notes, max: 500
}

// Response DTO
interface SetlistResponse {
  id: string;
  name: string;
  description?: string;
  date?: string;
  songs: SetlistSongResponse[];
  createdBy: string;
  createdByName: string;
  isPublic: boolean;
  tags: string[];
  totalDuration?: number;      // Estimated in minutes
  createdAt: string;
  updatedAt: string;
}

interface SetlistSongResponse {
  song: SongResponse;
  arrangement?: ArrangementResponse;
  order: number;
  keyOverride?: string;
  notes?: string;
}
```

---

## 5. Common Response Formats

### Pagination Response

```typescript
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;              // Current page (0-indexed)
  first: boolean;
  last: boolean;
  numberOfElements: number;
  pageable: {
    sort: {
      field: string;
      direction: 'ASC' | 'DESC';
    }[];
    offset: number;
    pageNumber: number;
    pageSize: number;
  };
}
```

### Error Response

```typescript
interface ErrorResponse {
  timestamp: string;           // ISO 8601
  status: number;              // HTTP status code
  error: string;               // Error category
  message: string;             // User-friendly message
  path: string;                // Request path
  requestId?: string;          // For tracking
  errors?: ValidationError[];  // Field-level errors
}

interface ValidationError {
  field: string;               // Field name
  value?: any;                 // Invalid value (sanitized)
  message: string;             // Validation message
  code?: string;               // Error code
}
```

---

## 6. HTTP Status Codes

### Success Codes
- **200 OK**: Successful GET, PATCH operations
- **201 Created**: Successful POST operations
- **204 No Content**: Successful DELETE operations

### Client Error Codes
- **400 Bad Request**: Invalid request data or validation failure
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource or conflicting state
- **422 Unprocessable Entity**: Business logic validation failure
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Upstream service failure
- **503 Service Unavailable**: Service temporarily unavailable

---

## 7. Validation Rules

### Common Validation Patterns

```typescript
// String fields
title: required, min: 1, max: 200, trim
description: optional, max: 1000, trim
slug: lowercase, alphanumeric with hyphens, unique

// Numeric fields
rating: integer, min: 1, max: 5
tempo: integer, min: 40, max: 240
year: integer, min: 1900, max: current year

// Arrays
themes: max 10 items, each max 50 chars
tags: max 20 items, each max 30 chars

// Special formats
email: valid email format (RFC 5322)
date: ISO 8601 format (YYYY-MM-DD)
datetime: ISO 8601 with timezone
mongoId: valid MongoDB ObjectId (24 hex chars)
```

### Field-Specific Validations

```typescript
// Songs
{
  title: z.string().min(1).max(200).trim(),
  artist: z.string().max(100).optional(),
  themes: z.array(z.string().max(50)).max(10),
  ccli: z.string().regex(/^\d{7}$/).optional()
}

// Arrangements
{
  name: z.string().min(1).max(100).trim(),
  chordData: z.string().min(10).max(100000), // ChordPro format
  key: z.enum(['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'])
}

// Reviews
{
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional()
}
```

---

## 8. Authentication & Authorization

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
X-User-Id: <user_id>
X-User-Role: <role>
```

### Role-Based Access Control (RBAC)

```yaml
Roles:
  USER:
    - Create own content
    - Edit own content
    - View public content
    - Rate and review

  MODERATOR:
    - All USER permissions
    - Edit any content
    - Delete reviews
    - Manage themes/tags

  ADMIN:
    - All MODERATOR permissions
    - Delete any content
    - Manage users
    - System configuration
```

### Protected Endpoints

| Method | Endpoint | Required Role |
|--------|----------|--------------|
| POST | /songs | USER |
| PATCH | /songs/{id} | USER (owner) or MODERATOR |
| DELETE | /songs/{id} | ADMIN |
| POST | /arrangements | USER |
| PATCH | /arrangements/{id} | USER (owner) or MODERATOR |
| DELETE | /arrangements/{id} | ADMIN |
| POST | /reviews | USER |
| DELETE | /reviews/{id} | USER (owner) or MODERATOR |

---

## 9. Request/Response Headers

### Required Request Headers

```http
Content-Type: application/json
Accept: application/json
X-Request-Id: <uuid>         # For request tracking
```

### Response Headers

```http
Content-Type: application/json
X-Request-Id: <uuid>
X-Response-Time: <ms>
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: <timestamp>
```

---

## 10. Integration Requirements

### CORS Configuration

```javascript
{
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}
```

### Rate Limiting

```yaml
Default limits:
  - Anonymous: 60 requests/hour
  - Authenticated: 600 requests/hour
  - Admin: 6000 requests/hour

Endpoint-specific:
  - Search: 30 requests/minute
  - Create: 10 requests/minute
  - Export: 5 requests/minute
```

### Caching Strategy

```yaml
Cache-Control headers:
  - Songs list: max-age=300 (5 minutes)
  - Song detail: max-age=3600 (1 hour)
  - Arrangements: max-age=300
  - Static content: max-age=86400 (1 day)

ETags:
  - Enabled for all GET endpoints
  - Based on content hash
```

---

## 11. Backend Implementation Notes

### Database Schema Considerations

```javascript
// Mongoose schema features
- Timestamps: automatic createdAt/updatedAt
- Virtuals: computed fields (e.g., ratings.average)
- Indexes: on slug, createdBy, themes
- Text indexes: for full-text search
- Middleware: pre-save validation and normalization
```

### Service Layer Patterns

```javascript
// Use repository pattern
songRepository.findById(id)
songRepository.findBySlug(slug)
songRepository.search(query, options)

// Use DTO mapping (e.g., MapStruct equivalent)
toSongResponse(songDocument)
toSongDocument(songRequest)

// Transaction support for multi-document operations
session.startTransaction()
```

### Compression

```javascript
// Chord data compression
- Algorithm: ZSTD (Zstandard)
- Compression level: 3 (balanced)
- Store both compressed and original size
- Decompress on-demand for API responses
```

---

## 12. Frontend Implementation Notes

### API Client Configuration

```typescript
// Base configuration
const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### React Query Hooks

```typescript
// Query hooks
export const useSongs = (params?: SongQueryParams) => {
  return useQuery({
    queryKey: ['songs', params],
    queryFn: () => songService.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks with optimistic updates
export const useCreateSong = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: songService.create,
    onMutate: async (newSong) => {
      await queryClient.cancelQueries(['songs']);
      // Optimistic update
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['songs']);
    },
  });
};
```

### Error Handling

```typescript
// Global error handler
const handleApiError = (error: AxiosError<ErrorResponse>) => {
  if (error.response?.data?.errors) {
    // Handle validation errors
    return error.response.data.errors;
  }
  
  // Handle other errors
  const message = error.response?.data?.message || 'An error occurred';
  toast.error(message);
};
```

### Form Validation (Zod)

```typescript
// Match backend validation
const songSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(100).optional(),
  themes: z.array(z.string().max(50)).max(10),
  ccli: z.string().regex(/^\d{7}$/).optional(),
});

// Use with react-hook-form
const form = useForm<SongRequest>({
  resolver: zodResolver(songSchema),
});
```

---

## 13. Testing Considerations

### Backend Testing

```javascript
// Unit tests for validators
describe('SongValidator', () => {
  it('should validate required fields', () => {
    const result = validateSong({ title: '' });
    expect(result.errors).toContainEqual({
      field: 'title',
      message: 'Title is required'
    });
  });
});

// Integration tests for endpoints
describe('POST /api/v1/songs', () => {
  it('should create a song with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/songs')
      .set('Authorization', `Bearer ${token}`)
      .send(validSongData);
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(validSongData);
  });
});
```

### Frontend Testing

```typescript
// Component tests
describe('SongForm', () => {
  it('should validate required fields', async () => {
    render(<SongForm />);
    
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });
});

// API hook tests
describe('useSongs', () => {
  it('should fetch songs list', async () => {
    const { result } = renderHook(() => useSongs());
    
    await waitFor(() => {
      expect(result.current.data?.content).toHaveLength(10);
    });
  });
});
```

---

## 14. Migration & Versioning

### API Versioning Strategy

```yaml
Version in URL: /api/v1/, /api/v2/
Deprecation notice: 6 months
Sunset period: 12 months

Breaking changes require new version:
- Removing fields
- Changing field types
- Changing validation rules
- Removing endpoints

Non-breaking changes allowed:
- Adding optional fields
- Adding new endpoints
- Loosening validation
- Adding response fields
```

### Database Migration

```javascript
// Migration scripts
migrations/
  001-initial-schema.js
  002-add-reviews.js
  003-add-setlists.js

// Backward compatibility
- Keep deprecated fields for transition period
- Use field aliases for renamed fields
- Provide data transformation utilities
```

---

## 15. Performance Optimization

### Query Optimization

```yaml
Pagination:
  - Default page size: 20
  - Maximum page size: 100
  - Use cursor-based pagination for large datasets

Projections:
  - List views: return minimal fields
  - Detail views: return complete objects
  - Use field selection query params

Eager Loading:
  - Population of related documents configurable
  - Use DataLoader pattern to avoid N+1 queries
```

### Caching Layers

```yaml
Client-side:
  - React Query cache: 5 minutes default
  - LocalStorage: user preferences
  - IndexedDB: offline chord sheets

Server-side:
  - Redis: session data, rate limiting
  - MongoDB query cache: frequently accessed data
  - CDN: static assets
```

---

## Appendix A: ChordPro Format Specification

The `chordData` field uses ChordPro format:

```chordpro
{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 72}
{time: 3/4}

{start_of_verse}
A[G]mazing [G/B]grace how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
{end_of_verse}

{start_of_chorus}
[G]I once was [G/B]lost but [C]now am [G]found
Was [Em]blind but [D]now I [G]see
{end_of_chorus}
```

---

## Appendix B: Example API Calls

### Create a Song

```bash
curl -X POST https://api.example.com/api/v1/songs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing Grace",
    "artist": "John Newton",
    "themes": ["grace", "redemption"],
    "compositionYear": 1772
  }'
```

### Search Songs

```bash
curl -X GET "https://api.example.com/api/v1/songs?search=grace&themes=redemption&page=0&size=10" \
  -H "Authorization: Bearer <token>"
```

### Create Arrangement with Chord Data

```bash
curl -X POST https://api.example.com/api/v1/arrangements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contemporary Version",
    "songIds": ["507f1f77bcf86cd799439011"],
    "key": "G",
    "tempo": 72,
    "difficulty": "EASY",
    "chordData": "{title: Amazing Grace}\\n{key: G}\\n\\n[G]Amazing [C]grace..."
  }'
```

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-20 | Initial API contract specification |

---

## Contact & Support

- **Backend Team**: backend@hsasongbook.com
- **Frontend Team**: frontend@hsasongbook.com
- **API Documentation**: https://api.hsasongbook.com/docs
- **Issue Tracking**: https://github.com/hsasongbook/api-issues