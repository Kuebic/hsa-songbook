# HSA Songbook Database Schema - Technical Documentation

## Overview

The HSA Songbook uses **Supabase (PostgreSQL)** for a relational database design optimized for worship music management. The schema follows a **separation of concerns** pattern where metadata and content are strategically separated for optimal performance and efficient querying.

## Core Tables

### 1. Songs Table (Metadata)

**Purpose**: Stores song metadata without chord data for fast queries and searches.

```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  composition_year INTEGER,
  ccli VARCHAR(50),
  themes TEXT[],  -- PostgreSQL array
  source VARCHAR(255),
  notes TEXT,
  default_arrangement_id UUID REFERENCES arrangements(id),
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  rating_average DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_songs_slug ON songs(slug);
CREATE INDEX idx_songs_public ON songs(is_public);
CREATE INDEX idx_songs_themes ON songs USING GIN(themes);
CREATE INDEX idx_songs_search ON songs USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(artist, ''))
);
```

### 2. Arrangements Table (Chord Data)

**Purpose**: Stores actual chord sheets and musical arrangements, separated for compression efficiency.

```sql
CREATE TABLE arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  chord_data TEXT NOT NULL,  -- ChordPro format (can be compressed at app level)
  
  -- Musical metadata
  key VARCHAR(10),
  tempo INTEGER,
  time_signature VARCHAR(10) DEFAULT '4/4',
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  tags TEXT[],
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_arrangements_song ON arrangements(song_id);
CREATE INDEX idx_arrangements_slug ON arrangements(slug);
CREATE INDEX idx_arrangements_public ON arrangements(is_public);
```

### 3. Users Table

**Purpose**: User profiles and preferences, integrated with Supabase Auth.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
  
  -- Preferences (JSON)
  preferences JSONB DEFAULT '{
    "defaultKey": null,
    "fontSize": 16,
    "theme": "light"
  }',
  
  -- Profile
  bio TEXT,
  website VARCHAR(255),
  location VARCHAR(255),
  
  -- Stats
  songs_created INTEGER DEFAULT 0,
  arrangements_created INTEGER DEFAULT 0,
  setlists_created INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 4. Setlists Table (Playlists)

**Purpose**: Ordered collections of songs/arrangements for worship services.

```sql
CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  tags TEXT[],
  
  -- Metadata
  service_date DATE,
  venue VARCHAR(255),
  is_public BOOLEAN DEFAULT false,
  share_token VARCHAR(100) UNIQUE,
  estimated_duration INTEGER,  -- in minutes
  category VARCHAR(20) CHECK (category IN ('worship', 'practice', 'event', 'personal')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for setlist items
CREATE TABLE setlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  arrangement_id UUID REFERENCES arrangements(id),
  song_id UUID REFERENCES songs(id),
  position INTEGER NOT NULL,
  transpose_by INTEGER DEFAULT 0,
  notes TEXT,
  
  UNIQUE(setlist_id, position)
);

-- Indexes
CREATE INDEX idx_setlists_user ON setlists(created_by);
CREATE INDEX idx_setlists_public ON setlists(is_public);
CREATE INDEX idx_setlist_items_setlist ON setlist_items(setlist_id);
```

### 5. Reviews Table

**Purpose**: User-generated ratings and reviews for arrangements.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID NOT NULL REFERENCES arrangements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Community moderation
  helpful_votes UUID[],  -- Array of user IDs who found this helpful
  reported_by UUID[],    -- Array of user IDs who reported this
  report_category VARCHAR(20),
  report_reason TEXT,
  
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(arrangement_id, user_id)  -- One review per user per arrangement
);

-- Indexes
CREATE INDEX idx_reviews_arrangement ON reviews(arrangement_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

### 6. Verses Table

**Purpose**: Biblical references and quotes related to songs.

```sql
CREATE TABLE verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  reference VARCHAR(100) NOT NULL,  -- "John 3:16", "Psalm 23:1"
  text TEXT NOT NULL,
  relevance TEXT,
  
  submitted_by UUID REFERENCES users(id),
  upvotes UUID[],  -- Array of user IDs
  
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_verses_song ON verses(song_id);
CREATE INDEX idx_verses_approved ON verses(is_approved);
```

## Relationship Patterns

### 1. One-to-Many Relationships
- **Song → Arrangements**: One song can have multiple chord arrangements
- **User → Songs/Arrangements/Setlists**: Ownership tracking via foreign keys

### 2. Many-to-Many via Junction Tables
- **Setlists ↔ Songs/Arrangements**: Through `setlist_items` with additional metadata
- **Users ↔ Reviews**: One review per user per arrangement

### 3. Array Columns for Flexibility
- **themes, tags**: PostgreSQL arrays for efficient multi-value storage
- **helpful_votes, upvotes**: User ID arrays for voting systems

## Row Level Security (RLS) Policies

### Key RLS Policies

```sql
-- Songs: Public songs visible to all, private visible to creator
CREATE POLICY songs_select ON songs FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

-- Songs: Only authenticated users can create
CREATE POLICY songs_insert ON songs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Songs: Only creator or admin can update
CREATE POLICY songs_update ON songs FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Similar patterns for other tables...
```

## Performance Optimizations

### 1. Full-Text Search
```sql
-- PostgreSQL native full-text search
CREATE INDEX idx_songs_fts ON songs 
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(artist, '')));

-- Query example
SELECT * FROM songs 
WHERE to_tsvector('english', title || ' ' || artist) @@ plainto_tsquery('amazing grace');
```

### 2. Query Patterns
- **List queries**: Direct table queries with indexed columns
- **Detail queries**: Single JOIN operations when needed
- **Search queries**: Native PostgreSQL full-text search

### 3. Index Strategy
- Primary key indexes (automatic)
- Foreign key indexes for JOINs
- GIN indexes for array columns and full-text search
- Composite indexes for common query patterns

## Supabase-Specific Features

### 1. Realtime Subscriptions
```javascript
// Subscribe to song updates
const subscription = supabase
  .channel('songs')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'songs' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe()
```

### 2. Storage Integration
- Chord sheets can be stored in Supabase Storage for large files
- Images and media files in dedicated buckets

### 3. Edge Functions
- Custom business logic for complex operations
- Scheduled tasks for maintenance

## Data Integrity

### 1. Foreign Key Constraints
- Cascading deletes where appropriate
- Restrict operations to maintain referential integrity

### 2. Check Constraints
- Enum validation for roles, difficulty levels, categories
- Range validation for ratings

### 3. Unique Constraints
- Prevent duplicate slugs
- One review per user per arrangement

## Migration Strategy

### 1. Supabase Migrations
```sql
-- Example migration file: 001_initial_schema.sql
-- All CREATE TABLE statements above
-- Plus initial seed data
```

### 2. Version Control
- SQL migration files in version control
- Rollback scripts for each migration

## Authentication Integration

### Current Implementation (Supabase Auth)
- Email/password authentication
- OAuth providers (Google, GitHub)
- Magic link authentication
- Session management via Supabase client

### Future Enhancement
- Anonymous authentication support
- Guest user conversion flow
- Social login expansion

## Offline Support (Future Enhancement)

### Planned PWA Features
- IndexedDB for local storage
- Service Worker for offline access
- Sync mechanism when online
- Conflict resolution strategies

This schema design leverages PostgreSQL's powerful features while maintaining simplicity and performance for the HSA Songbook application.