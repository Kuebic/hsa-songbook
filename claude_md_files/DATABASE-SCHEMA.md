# HSA Songbook Database Schema - Technical Documentation

## Overview

The HSA Songbook uses MongoDB with Mongoose for a document-based database design optimized for worship music management. The schema follows a **separation of concerns** pattern where metadata and content are strategically separated for optimal performance and compression.

## Core Collections

### 1. Songs Collection (Metadata)

**Purpose**: Stores song metadata without chord data for fast queries and searches.

```typescript
interface SongDocument {
  title: string;           // Song title
  artist?: string;         // Original artist/writer
  slug: string;           // URL-friendly identifier (indexed)
  compositionYear?: number;
  ccli?: string;          // Christian Copyright Licensing International number
  themes: string[];       // Worship themes (embedded array)
  source?: string;        // Original source/hymnal
  notes?: string;         // General notes about the song
  defaultArrangement?: ObjectId; // Reference to primary arrangement
  metadata: {
    createdBy: ObjectId;   // User reference
    lastModifiedBy?: ObjectId;
    isPublic: boolean;
    ratings: { average: number; count: number };
    views: number;
  };
  documentSize: number;    // For MongoDB free tier monitoring
}
```

**Key Indexes:**
- `slug` (unique) - Fast song lookups
- `{ title: "text", artist: "text", themes: "text" }` - Full-text search
- `themes` - Category browsing
- `metadata.isPublic` - Public/private filtering

### 2. Arrangements Collection (Chord Data)

**Purpose**: Stores actual chord sheets and musical arrangements, separated for compression efficiency.

```typescript
interface ArrangementDocument {
  name: string;           // Arrangement name ("Key of G", "Acoustic Version")
  songIds: ObjectId[];    // Array of song references (enables mashups)
  slug: string;           // URL-friendly identifier (indexed) <referenced-song-name(s)>-<short-random-id>
  createdBy: ObjectId;    // User reference
  chordData: Buffer;      // Compressed ChordPro format using ZSTD
  key?: string;           // Musical key (C, G, D, etc.)
  tempo?: number;         // BPM
  timeSignature?: string; // 4/4, 3/4, etc.
  difficulty: "beginner" | "intermediate" | "advanced";
  description?: string;
  tags: string[];         // Style tags (acoustic, electric, simple, etc.)
  metadata: {
    isMashup: boolean;    // Flag for multi-song arrangements
    mashupSections?: Array<{
      songId: ObjectId;
      title: string;
    }>;
    isPublic: boolean;
    ratings?: { average: number; count: number };
    views: number;
  };
  documentSize: number;
}
```

**Key Design Decisions:**
- **Buffer storage for chordData**: Enables ZSTD compression (60-80% size reduction)
- **songIds array**: Single arrangement can contain multiple songs (mashups)
- **Separate metadata**: Allows querying without decompressing chord data

### 3. Users Collection

**Purpose**: User profiles and preferences, integrated with Clerk authentication.

```typescript
interface UserDocument {
  clerkId: string;        // External auth provider ID (indexed, unique)
  email: string;
  name?: string;          // Real/full name (optional) (from Clerk)
  username: string;       // Display name/username (unique, from Clerk)
  role: "USER" | "ADMIN" | "MODERATOR";
  preferences: {
    defaultKey?: string;   // Default transposition key
    fontSize: number;      // Display preferences
    theme: "light" | "dark" | "stage"; // UI theme
  };
  profile: {
    bio?: string;
    website?: string;
    location?: string;
  };
  stats: {               // Embedded stats for performance
    songsCreated: number;
    arrangementsCreated: number;
    setlistsCreated: number;
  };
  isActive: boolean;
  lastLoginAt?: Date;
}
```

### 4. Setlists Collection (Playlists)

**Purpose**: Ordered collections of songs/arrangements for worship services.

```typescript
interface SetlistDocument {
  name: string;
  description?: string;
  createdBy: ObjectId;
  createdAt: Date;        // Date when setlist was created
  updatedAt: Date;        // Last modified date (auto-updated)
  songs: Array<{          // Embedded array for atomic updates
    arrangementId?: ObjectId; // Specific arrangement version
    transposeBy: number;   // Key transposition (+2, -1, etc.)
    notes?: string;        // Per-song notes
    order: number;         // Sort order
  }>;
  tags: string[];         // For categorization ("sunday-service", "youth", "practice", etc.)
  metadata: {
    date?: Date;           // Service date
    venue?: string;        // Location
    isPublic: boolean;     // false = private/personal, true = public
    shareToken?: string;   // Public sharing UUID
    duration?: number;     // Estimated minutes
    category?: "worship" | "practice" | "event" | "personal"; // Setlist type
  };
}
```

**Key Features:**
- **Flexible references**: Can reference songs, arrangements, or both
- **Per-song transposition**: Individual key changes within setlist
- **Embedded song array**: Atomic updates for reordering
- **Tag-based filtering**: Support for personal/public and custom categorization
- **Automatic timestamps**: Track creation and modification dates

### 5. Reviews Collection

**Purpose**: User-generated ratings and reviews for arrangements.

```typescript
interface ReviewDocument {
  arrangementId: ObjectId; // What's being reviewed
  userId: ObjectId;        // Who wrote it
  userDisplayName: string; // Denormalized for performance
  rating: number;          // 1-5 scale
  comment?: string;
  helpfulVotes: string[];  // Array of user IDs (upvotes)
  reportedBy: string[];    // Moderation system
  reportCategory?: "off-topic" | "inappropriate" | "fake" | "other"; // Type of report
  reportReason?: string;   // Additional details for the report
  isPublic: boolean;
}
```

### 6. Verses Collection

**Purpose**: Biblical references and quotes related to songs.

```typescript
interface VerseDocument {
  songId: ObjectId;
  reference: string;       // "John 3:16", "Psalm 23:1"
  text: string;           // Verse text
  relevance: string;      // Why this verse relates to the song
  submittedBy: ObjectId;
  upvotes: string[];      // Community validation
  isApproved: boolean;    // Moderation workflow
  approvedBy?: ObjectId;
  approvedAt?: Date;
}
```

## Relationship Patterns

### 1. One-to-Many Relationships
- **Song → Arrangements**: One song can have multiple chord arrangements
- **User → Songs/Arrangements/Setlists**: Ownership tracking

### 2. Many-to-Many via Arrays
- **Setlists ↔ Songs**: Embedded array with additional metadata (transposition, notes)
- **Arrangements ↔ Songs**: Array enables mashup functionality

### 3. Denormalization Strategies
- **userDisplayName in Reviews**: Avoid joins for common queries
- **Embedded stats in Users**: Fast profile loading
- **ratings embedded in Songs/Arrangements**: Avoid aggregation queries

## Performance Optimizations

### 1. Compression Strategy
```javascript
// ZSTD compression for chord data
chordData: Buffer.from(zstd.compress(chordProString))
```

### 2. Query Patterns
- **List queries**: Use metadata collections (Songs) without chord data
- **Detail queries**: Join with Arrangements only when needed
- **Search queries**: Text indexes on Songs collection

### 3. Index Strategy
```javascript
// Compound indexes for common query patterns
{ "metadata.isPublic": 1, "themes": 1, "title": 1 }  // Browse by theme
{ "createdBy": 1, "createdAt": -1 }                  // User's content
{ "slug": 1 }                                        // Unique song lookup
```

## Scalability Considerations

### 1. Document Size Monitoring
- `documentSize` field in each collection
- MongoDB free tier: 512MB limit
- Compression reduces storage by 60-80%

### 2. Sharding Preparation
- `_id` fields suitable as shard keys
- Even distribution across users and content

### 3. Aggregation Pipeline Optimization
- Embedded arrays reduce need for `$lookup` operations
- Pre-calculated fields (ratings, stats) avoid expensive aggregations

## Data Integrity

### 1. Referential Integrity
- Application-level enforcement (Mongoose middleware)
- Cascade deletes for dependent documents

### 2. Validation Rules
- Required fields enforced at schema level
- Enum validation for difficulty, themes, roles
- Custom validators for slug uniqueness, rating ranges

### 3. Audit Trail
- `createdAt`/`updatedAt` timestamps
- `lastModifiedBy` tracking for content changes

## Migration Strategy

### 1. Schema Versioning
- Version field in documents for future migrations
- Backward-compatible changes preferred

### 2. Index Management
- Background index creation for production
- Monitor index usage with MongoDB profiler

This schema design prioritizes performance, scalability, and maintainability while supporting the complex relationships required for a comprehensive worship songbook application.