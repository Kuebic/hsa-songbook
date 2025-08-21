    title: 'In Christ Alone',
    artist: 'Keith Getty & Stuart Townend',
    slug: 'in-christ-alone',
    compositionYear: 2001,
    themes: [ 'salvation', 'Christ', 'contemporary', 'doctrine' ],
    source: 'Modern Hymns',
    ccli: '3350395',
    notes: 'Modern hymn with rich theological content',
    metadata: {
      isPublic: true, (default true, admin can set to false)
      views: 1450,
      createdBy: 'system-seed-user',
      lastModifiedBy: 'system-seed-user'
    },

Song Form Design & Duplicate Prevention Strategy

  ### 1. Song Title Duplicate Prevention

  Current Issue: No duplicate detection exists. Songs like "As the Deer" vs "As The Deer"
  will create duplicates.

  Solution: Implement fuzzy matching with normalization:
  ```
  // Normalize titles for comparison
  const normalizeTitle = (title: string) =>
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')         // Normalize spaces
      .trim()

  // Check for similar titles using Levenshtein distance
  const findSimilarSongs = async (title: string) => {
    const normalized = normalizeTitle(title)
    const allSongs = await Song.find()

    return allSongs.filter(song => {
      const songNormalized = normalizeTitle(song.title)
      // Check exact match or very similar (< 3 character difference)
      return songNormalized === normalized ||
             levenshteinDistance(songNormalized, normalized) < 3
    })
  }
```
  UI Warning: Show potential duplicates during form submission:
  - "Similar songs found: 'As the Deer' by John Doe"
  - Admin can merge duplicates post-creation

###  2. Slug Uniqueness System

  Current Problem: Basic slug generation in song.model.ts:114 doesn't handle collisions!

  Your SLUG.md already defines the solution:
  /songs/see-through-childrens-eyes-jc-9x3f1

  Implementation needed:
  ```
  // Generate unique slug with artist initials + random ID
  const generateUniqueSlug = async (title: string, artist?: string) => {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const initials = artist ?
      artist.split(' ').map(w => w[0]).join('').toLowerCase() : ''

    let slug, attempts = 0
    do {
      const randomId = Math.random().toString(36).substring(2, 7)
      slug = `${baseSlug}${initials ? `-${initials}` : ''}-${randomId}`
      attempts++
    } while (await Song.findOne({ slug }) && attempts < 10)

    return slug
  }
```

 ###  3. Theme/Tag Normalization

  Solution: Controlled vocabulary with autocomplete
```
  // Normalized theme list based on SONG-CATEGORIES.md
  const NORMALIZED_THEMES = {
    'christmas': ['Christmas', 'xmas', 'x-mas', 'Xmas', 'X-mas'],
    'easter': ['Easter', 'resurrection'],
    'worship': ['Worship', 'praise', 'adoration'],
    // ... more mappings
  }

  // Theme normalization function
  const normalizeTheme = (input: string): string => {
    const lower = input.toLowerCase().trim()
    for (const [normalized, variants] of Object.entries(NORMALIZED_THEMES)) {
      if (variants.some(v => v.toLowerCase() === lower)) {
        return normalized
      }
    }
    return lower // Keep as-is if not in mapping
  }
```
  UI Component: Use shadcn's Combobox with:
  - Pre-populated suggestions from existing themes
  - "Create new theme" option (admin-only)
  - Visual tags showing selected themes

###  4. Rating System Implementation

  Current: updateRating() method exists but no review storage!

  Solution: Create a separate Reviews collection:
```
  // reviews.model.ts
  const reviewSchema = new Schema({
    songId: { type: Schema.Types.ObjectId, ref: 'Song' },
    arrangementId: { type: Schema.Types.ObjectId, ref: 'Arrangement' },
    userId: { type: String, required: true }, // Clerk ID
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  })

  // Update rating on review creation
  reviewSchema.post('save', async function() {
    if (this.songId) {
      const song = await Song.findById(this.songId)
      await song.updateRating(this.rating)
    }
  })
```
###  5. Source Dropdown Implementation

  Based on SONG-CATEGORIES.md, sources should be:
```
  const SONG_SOURCES = [
    'Traditional-Holy',
    'New-Holy',
    'American-Pioneer',
    'Adapted-Secular',
    'Secular-General',
    'Contemporary-Christian',
    'Classic-Hymn',
    'Original-Interchurch'
  ]
```
###  6. Comprehensive Song Form Design
```
  interface SongFormData {
    // Basic Info
    title: string
    artist?: string
    compositionYear?: number
    ccli?: string

    // Categorization
    source: string // Dropdown from SONG_SOURCES
    themes: string[] // Combobox with normalization

    // Metadata
    notes?: string
    isPublic: boolean

    // Arrangement (if creating new)
    arrangement?: {
      name: string
      chordData: string
      key?: string
      tempo?: number
      difficulty: 'beginner' | 'intermediate' | 'advanced'
      tags: string[]
    }
  }
```
###  7. Permission System
```
  const canEditSong = (song: ISong, userId: string, isAdmin: boolean) => {
    return isAdmin || song.metadata.createdBy === userId
  }

  const canEditArrangement = (arrangement: IArrangement, userId: string, isAdmin: boolean)
  => {
    return isAdmin || arrangement.createdBy === userId
  }
```
### 8. Admin Tools for Fixing Duplicates

  Merge Songs Feature:
  // Admin endpoint to merge duplicate songs
  const mergeSongs = async (keepId: string, mergeIds: string[]) => {
    const keepSong = await Song.findById(keepId)
    const mergeSongs = await Song.find({ _id: { $in: mergeIds } })

    // Combine themes, keep unique
    const allThemes = new Set([
      ...keepSong.themes,
      ...mergeSongs.flatMap(s => s.themes)
    ])

    // Update arrangements to point to kept song
    await Arrangement.updateMany(
      { songIds: { $in: mergeIds } },
      { $set: { 'songIds.$': keepId } }
    )

    // Update kept song with combined data
    keepSong.themes = Array.from(allThemes).map(normalizeTheme)
    await keepSong.save()

    // Delete merged songs
    await Song.deleteMany({ _id: { $in: mergeIds } })
  }

  Implementation Recommendations

  1. Use shadcn-ui components:
    - Dialog for the form popup
    - Combobox for themes (with autocomplete)
    - Select for source dropdown
    - Form components for validation
  2. Add duplicate detection API:
  // Check for duplicates before save
  POST /api/songs/check-duplicates
  Body: { title, artist }
  Response: { duplicates: [...], suggestions: [...] }
  3. Implement theme management:
    - Admin page to manage normalized themes
    - Bulk update tool for existing data
  4. Add review system:
    - Separate reviews collection
    - Automatic rating recalculation on review add/delete
