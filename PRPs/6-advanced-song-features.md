# Advanced Song Features Implementation PRP

## Executive Summary
Implement advanced features including duplicate song detection with merge capabilities, rating system with review storage, arrangement creation within song forms, and admin tools for data management. These features enhance the song management system with professional-grade capabilities.

**Confidence Score: 9/10** - High confidence with comprehensive feature design and clear implementation path.

## Context and Research Findings

### Current State Analysis
**Existing Infrastructure:**
- Basic song CRUD operations complete
- Validation and duplicate detection utilities exist
- Rating method exists in backend but no review storage
- Arrangement model exists but not integrated with forms

**Missing Advanced Features:**
- No UI for duplicate detection warnings
- No review/rating persistence system
- No arrangement creation in song form
- No admin tools for merging duplicates
- No bulk operations for data management

### Requirements from Documentation
From `claude_md_files/song-form.md`:
- Duplicate detection with Levenshtein distance
- Admin merge tool for combining duplicates
- Review collection for rating persistence
- Arrangement data within song creation
- Theme and source management tools

### Vertical Slice Architecture
```
src/features/songs/
├── components/
│   ├── admin/
│   │   ├── DuplicateManager.tsx       # Duplicate detection/merge UI
│   │   ├── BulkOperations.tsx         # Bulk edit/delete
│   │   ├── ThemeManager.tsx           # Theme vocabulary management
│   │   └── AdminDashboard.tsx         # Admin overview
│   ├── arrangements/
│   │   ├── ArrangementForm.tsx        # Arrangement creation
│   │   ├── ArrangementList.tsx        # List arrangements
│   │   └── ChordEditor.tsx            # ChordPro editor
│   └── ratings/
│       ├── RatingWidget.tsx           # Star rating component
│       ├── ReviewForm.tsx             # Review submission
│       └── ReviewList.tsx             # Display reviews

server/features/
├── reviews/
│   ├── review.model.ts               # Review schema
│   ├── review.controller.ts          # Review endpoints
│   └── review.service.ts             # Review logic
└── admin/
    ├── admin.controller.ts            # Admin endpoints
    └── admin.service.ts               # Admin operations
```

## Implementation Blueprint

### Phase 1: Review System Backend

```typescript
// server/features/reviews/review.model.ts
import { Schema, model, Document } from 'mongoose'

export interface IReview extends Document {
  songId: Schema.Types.ObjectId
  arrangementId?: Schema.Types.ObjectId
  userId: string // Clerk ID
  userName?: string
  rating: number
  comment?: string
  helpful: number
  notHelpful: number
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>({
  songId: {
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
    index: true
  },
  arrangementId: {
    type: Schema.Types.ObjectId,
    ref: 'Arrangement',
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Compound index to prevent duplicate reviews
reviewSchema.index({ songId: 1, userId: 1 }, { unique: true })
reviewSchema.index({ arrangementId: 1, userId: 1 }, { 
  unique: true,
  partialFilterExpression: { arrangementId: { $exists: true } }
})

// Update song rating after review save
reviewSchema.post('save', async function(doc) {
  const Review = model('Review')
  const Song = model('Song')
  
  if (doc.songId) {
    const reviews = await Review.find({ songId: doc.songId })
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    
    await Song.findByIdAndUpdate(doc.songId, {
      'metadata.ratings': {
        average: Math.round(average * 10) / 10,
        count: reviews.length
      }
    })
  }
})

// Update song rating after review delete
reviewSchema.post('remove', async function(doc) {
  const Review = model('Review')
  const Song = model('Song')
  
  if (doc.songId) {
    const reviews = await Review.find({ songId: doc.songId })
    
    if (reviews.length > 0) {
      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await Song.findByIdAndUpdate(doc.songId, {
        'metadata.ratings': {
          average: Math.round(average * 10) / 10,
          count: reviews.length
        }
      })
    } else {
      await Song.findByIdAndUpdate(doc.songId, {
        'metadata.ratings': {
          average: 0,
          count: 0
        }
      })
    }
  }
})

export const Review = model<IReview>('Review', reviewSchema)

// server/features/reviews/review.controller.ts
import { Request, Response, NextFunction } from 'express'
import { reviewService } from './review.service'
import { AppError } from '@shared/utils/errors'

export const reviewController = {
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { songId } = req.params
      const { rating, comment } = req.body
      const userId = req.user?.id
      
      if (!userId) {
        throw new AppError('Authentication required', 401)
      }
      
      const review = await reviewService.createReview({
        songId,
        userId,
        userName: req.user?.name,
        rating,
        comment
      })
      
      res.status(201).json({
        success: true,
        data: review
      })
    } catch (error) {
      next(error)
    }
  },
  
  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { songId } = req.params
      const { page = 1, limit = 10, sort = '-createdAt' } = req.query
      
      const reviews = await reviewService.getReviews(songId, {
        page: Number(page),
        limit: Number(limit),
        sort: sort as string
      })
      
      res.json({
        success: true,
        data: reviews.docs,
        meta: {
          total: reviews.total,
          page: reviews.page,
          pages: reviews.pages
        }
      })
    } catch (error) {
      next(error)
    }
  },
  
  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params
      const { rating, comment } = req.body
      const userId = req.user?.id
      
      const review = await reviewService.updateReview(
        reviewId,
        userId,
        { rating, comment }
      )
      
      res.json({
        success: true,
        data: review
      })
    } catch (error) {
      next(error)
    }
  },
  
  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params
      const userId = req.user?.id
      
      await reviewService.deleteReview(reviewId, userId)
      
      res.json({
        success: true,
        message: 'Review deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  },
  
  async markHelpful(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params
      const { helpful } = req.body
      
      const review = await reviewService.markHelpful(reviewId, helpful)
      
      res.json({
        success: true,
        data: review
      })
    } catch (error) {
      next(error)
    }
  }
}
```

### Phase 2: Rating & Review Components

```typescript
// src/features/songs/components/ratings/RatingWidget.tsx
import { useState, useCallback } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import type { Song } from '@features/songs/types/song.types'

interface RatingWidgetProps {
  song: Song
  onRate?: (rating: number) => void
  showAverage?: boolean
  size?: 'small' | 'medium' | 'large'
  readonly?: boolean
}

export function RatingWidget({
  song,
  onRate,
  showAverage = true,
  size = 'medium',
  readonly = false
}: RatingWidgetProps) {
  const { isSignedIn } = useAuth()
  const [hoveredRating, setHoveredRating] = useState(0)
  const [userRating, setUserRating] = useState(0)
  
  const canRate = isSignedIn && !readonly
  
  const handleRate = useCallback((rating: number) => {
    if (!canRate) return
    
    setUserRating(rating)
    onRate?.(rating)
  }, [canRate, onRate])
  
  const sizes = {
    small: { star: '16px', gap: '2px', text: '12px' },
    medium: { star: '20px', gap: '4px', text: '14px' },
    large: { star: '24px', gap: '6px', text: '16px' }
  }
  
  const currentSize = sizes[size]
  
  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px'
  }
  
  const starsStyles: React.CSSProperties = {
    display: 'flex',
    gap: currentSize.gap
  }
  
  const starStyles = (index: number): React.CSSProperties => ({
    fontSize: currentSize.star,
    cursor: canRate ? 'pointer' : 'default',
    transition: 'transform 0.2s',
    transform: hoveredRating >= index ? 'scale(1.1)' : 'scale(1)',
    color: '#fbbf24'
  })
  
  const averageStyles: React.CSSProperties = {
    fontSize: currentSize.text,
    color: '#64748b'
  }
  
  const currentRating = hoveredRating || userRating || song.metadata.ratings?.average || 0
  
  return (
    <div style={containerStyles}>
      <div 
        style={starsStyles}
        onMouseLeave={() => setHoveredRating(0)}
        role="group"
        aria-label={`Rate ${song.title}`}
      >
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => canRate && setHoveredRating(star)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              ...starStyles(star)
            }}
            disabled={!canRate}
            aria-label={`Rate ${star} stars`}
            title={`Rate ${star} stars`}
          >
            {star <= Math.round(currentRating) ? '⭐' : '☆'}
          </button>
        ))}
      </div>
      
      {showAverage && song.metadata.ratings && (
        <span style={averageStyles}>
          {song.metadata.ratings.average.toFixed(1)} 
          ({song.metadata.ratings.count} {song.metadata.ratings.count === 1 ? 'rating' : 'ratings'})
        </span>
      )}
    </div>
  )
}

// src/features/songs/components/ratings/ReviewForm.tsx
import { useState, useCallback } from 'react'
import { FormTextarea, SubmitButton, CancelButton } from '@shared/components/form'
import { RatingWidget } from './RatingWidget'
import type { Song } from '@features/songs/types/song.types'

interface ReviewFormProps {
  song: Song
  onSubmit: (rating: number, comment: string) => Promise<void>
  onCancel: () => void
  initialRating?: number
  initialComment?: string
}

export function ReviewForm({
  song,
  onSubmit,
  onCancel,
  initialRating = 0,
  initialComment = ''
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await onSubmit(rating, comment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }, [rating, comment, onSubmit])
  
  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '8px'
  }
  
  const errorStyles: React.CSSProperties = {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '4px'
  }
  
  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  }
  
  return (
    <form onSubmit={handleSubmit} style={formStyles}>
      <div>
        <div style={titleStyles}>Your Rating</div>
        <RatingWidget
          song={{ ...song, metadata: { ...song.metadata, ratings: { average: rating, count: 0 } } }}
          onRate={setRating}
          showAverage={false}
          size="large"
        />
        {error && rating === 0 && (
          <div style={errorStyles}>Please select a rating</div>
        )}
      </div>
      
      <FormTextarea
        label="Your Review (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={4}
        maxLength={1000}
        showCharacterCount
        placeholder="Share your thoughts about this song..."
      />
      
      {error && rating > 0 && (
        <div style={errorStyles}>{error}</div>
      )}
      
      <div style={actionsStyles}>
        <CancelButton onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </CancelButton>
        <SubmitButton disabled={isSubmitting || rating === 0}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </SubmitButton>
      </div>
    </form>
  )
}
```

### Phase 3: Arrangement Form Integration

```typescript
// src/features/songs/components/arrangements/ArrangementForm.tsx
import { useState } from 'react'
import {
  FormSection,
  FormInput,
  FormSelect,
  FormTextarea,
  FormRow
} from '@shared/components/form'
import { MUSICAL_KEYS, TIME_SIGNATURES } from '@features/songs/validation/constants/musicalKeys'
import type { ArrangementFormData } from '@features/songs/validation/schemas/arrangementSchema'

interface ArrangementFormProps {
  data: Partial<ArrangementFormData>
  onChange: (field: keyof ArrangementFormData, value: any) => void
  errors?: Record<string, string>
  showInSongForm?: boolean
}

export function ArrangementForm({
  data,
  onChange,
  errors = {},
  showInSongForm = false
}: ArrangementFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const sectionTitle = showInSongForm 
    ? 'Add Arrangement (Optional)' 
    : 'Arrangement Details'
  
  return (
    <FormSection title={sectionTitle}>
      <FormInput
        label="Arrangement Name"
        value={data.name || ''}
        onChange={e => onChange('name', e.target.value)}
        error={errors.name}
        required={!showInSongForm}
        placeholder="e.g., Acoustic Version, Key of G..."
        helperText="A descriptive name for this arrangement"
      />
      
      <FormTextarea
        label="Chord Data (ChordPro Format)"
        value={data.chordData || ''}
        onChange={e => onChange('chordData', e.target.value)}
        error={errors.chordData}
        required={!showInSongForm}
        rows={10}
        fontFamily="monospace"
        placeholder={`{title: Song Title}
{artist: Artist Name}
{key: G}

[G]Amazing [D]grace how [Em]sweet the [C]sound...`}
        helperText="Enter chords in ChordPro format. Place chords in brackets before the syllable."
      />
      
      <FormRow>
        <FormSelect
          label="Musical Key"
          value={data.key || ''}
          onChange={e => onChange('key', e.target.value)}
          error={errors.key}
        >
          <option value="">Select key...</option>
          <optgroup label="Major Keys">
            {MUSICAL_KEYS.filter(k => !k.includes('m')).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </optgroup>
          <optgroup label="Minor Keys">
            {MUSICAL_KEYS.filter(k => k.includes('m')).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </optgroup>
        </FormSelect>
        
        <FormSelect
          label="Difficulty"
          value={data.difficulty || ''}
          onChange={e => onChange('difficulty', e.target.value)}
          error={errors.difficulty}
        >
          <option value="">Select difficulty...</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </FormSelect>
      </FormRow>
      
      {!showInSongForm && (
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px 0',
            textDecoration: 'underline'
          }}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      )}
      
      {(showAdvanced || !showInSongForm) && (
        <FormRow>
          <FormInput
            label="Tempo (BPM)"
            type="number"
            value={data.tempo?.toString() || ''}
            onChange={e => onChange('tempo', e.target.value ? Number(e.target.value) : undefined)}
            error={errors.tempo}
            min={40}
            max={300}
            placeholder="e.g., 120"
          />
          
          <FormSelect
            label="Time Signature"
            value={data.timeSignature || ''}
            onChange={e => onChange('timeSignature', e.target.value)}
            error={errors.timeSignature}
          >
            <option value="">Select time...</option>
            {TIME_SIGNATURES.map(sig => (
              <option key={sig} value={sig}>{sig}</option>
            ))}
          </FormSelect>
        </FormRow>
      )}
    </FormSection>
  )
}
```

### Phase 4: Admin Duplicate Management

```typescript
// src/features/songs/components/admin/DuplicateManager.tsx
import { useState, useEffect } from 'react'
import { useSongs } from '@features/songs/hooks/useSongs'
import { findSimilarSongs } from '@features/songs/validation/utils/duplicateDetection'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '@features/songs/types/song.types'
import type { SimilarSong } from '@features/songs/validation/utils/duplicateDetection'

export function DuplicateManager() {
  const { songs } = useSongs()
  const { addNotification } = useNotification()
  const [duplicateGroups, setDuplicateGroups] = useState<Map<string, SimilarSong[]>>(new Map())
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [mergeInProgress, setMergeInProgress] = useState(false)
  
  useEffect(() => {
    // Find all duplicate groups
    const groups = new Map<string, SimilarSong[]>()
    const processed = new Set<string>()
    
    songs.forEach(song => {
      if (processed.has(song.id)) return
      
      const similar = findSimilarSongs(song.title, songs, song.artist)
        .filter(s => s.similarity === 'exact' || s.similarity === 'very-similar')
      
      if (similar.length > 0) {
        groups.set(song.id, similar)
        similar.forEach(s => processed.add(s.song.id))
      }
    })
    
    setDuplicateGroups(groups)
  }, [songs])
  
  const handleMerge = async (keepId: string, mergeIds: string[]) => {
    setMergeInProgress(true)
    
    try {
      const response = await fetch('/api/v1/admin/merge-songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ keepId, mergeIds })
      })
      
      if (!response.ok) {
        throw new Error('Failed to merge songs')
      }
      
      addNotification({
        type: 'success',
        title: 'Songs merged successfully',
        message: `${mergeIds.length} duplicate(s) have been merged`
      })
      
      // Refresh songs list
      window.location.reload()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Merge failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setMergeInProgress(false)
    }
  }
  
  const containerStyles: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }
  
  const headerStyles: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1e293b'
  }
  
  const groupStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0'
  }
  
  const songItemStyles: React.CSSProperties = {
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '4px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
  
  if (duplicateGroups.size === 0) {
    return (
      <div style={containerStyles}>
        <h2 style={headerStyles}>Duplicate Song Manager</h2>
        <p style={{ color: '#64748b' }}>No duplicate songs detected.</p>
      </div>
    )
  }
  
  return (
    <div style={containerStyles}>
      <h2 style={headerStyles}>
        Duplicate Song Manager ({duplicateGroups.size} groups found)
      </h2>
      
      {Array.from(duplicateGroups.entries()).map(([leadId, similar]) => {
        const leadSong = songs.find(s => s.id === leadId)
        if (!leadSong) return null
        
        return (
          <div key={leadId} style={groupStyles}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              Group: "{leadSong.title}"
            </h3>
            
            <div style={songItemStyles}>
              <div>
                <input
                  type="radio"
                  name={`keep-${leadId}`}
                  value={leadId}
                  defaultChecked
                  style={{ marginRight: '8px' }}
                />
                <strong>{leadSong.title}</strong>
                {leadSong.artist && ` by ${leadSong.artist}`}
                <span style={{ marginLeft: '8px', color: '#10b981' }}>(Keep)</span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {leadSong.metadata.views} views
              </span>
            </div>
            
            {similar.map(({ song, similarity, distance }) => (
              <div key={song.id} style={songItemStyles}>
                <div>
                  <input
                    type="checkbox"
                    name={`merge-${leadId}`}
                    value={song.id}
                    style={{ marginRight: '8px' }}
                  />
                  {song.title}
                  {song.artist && ` by ${song.artist}`}
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#ef4444' }}>
                    ({similarity}, distance: {distance})
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {song.metadata.views} views
                </span>
              </div>
            ))}
            
            <button
              onClick={() => {
                const checkboxes = document.querySelectorAll<HTMLInputElement>(
                  `input[name="merge-${leadId}"]:checked`
                )
                const mergeIds = Array.from(checkboxes).map(cb => cb.value)
                
                if (mergeIds.length > 0) {
                  if (confirm(`Merge ${mergeIds.length} song(s) into "${leadSong.title}"?`)) {
                    handleMerge(leadId, mergeIds)
                  }
                }
              }}
              disabled={mergeInProgress}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: mergeInProgress ? 'not-allowed' : 'pointer',
                opacity: mergeInProgress ? 0.5 : 1
              }}
            >
              {mergeInProgress ? 'Merging...' : 'Merge Selected'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
```

### Phase 5: Integration with Song Form

```typescript
// Updates to src/features/songs/components/forms/SongForm.tsx
import { ArrangementForm } from '../arrangements/ArrangementForm'

export function SongForm({ initialData, onSubmit, onCancel, isSubmitting }: SongFormProps) {
  const [formData, setFormData] = useState<Partial<SongFormData>>({
    // ... existing fields ...
    arrangement: initialData?.defaultArrangement ? {
      name: 'Default Arrangement',
      chordData: '',
      // ... load from arrangement
    } : undefined
  })
  
  const [includeArrangement, setIncludeArrangement] = useState(false)
  
  // ... existing code ...
  
  return (
    <form onSubmit={handleSubmit} style={formStyles}>
      {/* ... existing sections ... */}
      
      <FormSection>
        <FormCheckbox
          label="Include arrangement with this song"
          checked={includeArrangement}
          onChange={e => setIncludeArrangement(e.target.checked)}
          helperText="Add chord charts and musical notation"
        />
      </FormSection>
      
      {includeArrangement && (
        <ArrangementForm
          data={formData.arrangement || {}}
          onChange={(field, value) => {
            setFormData(prev => ({
              ...prev,
              arrangement: {
                ...prev.arrangement,
                [field]: value
              }
            }))
          }}
          errors={arrangementErrors}
          showInSongForm={true}
        />
      )}
      
      {/* ... form actions ... */}
    </form>
  )
}
```

## Validation Gates

### Level 1: Type Checking & Linting
```bash
npm run lint
npm run type-check
cd server && npm run lint && npm run type-check
```

### Level 2: Backend Tests
```bash
cd server && npm run test -- features/reviews/
cd server && npm run test -- features/admin/
```

### Level 3: Frontend Tests
```bash
npm run test -- src/features/songs/components/ratings/
npm run test -- src/features/songs/components/admin/
```

### Level 4: Integration Tests
- [ ] Create song with arrangement
- [ ] Submit review and verify rating update
- [ ] Detect and merge duplicates
- [ ] Admin bulk operations

### Level 5: Performance Tests
- [ ] Rating calculation < 100ms
- [ ] Duplicate detection < 500ms for 1000 songs
- [ ] Merge operation < 2s
- [ ] Review pagination working

## File Creation Order

1. `server/features/reviews/review.model.ts`
2. `server/features/reviews/review.service.ts`
3. `server/features/reviews/review.controller.ts`
4. `server/features/reviews/review.routes.ts`
5. `src/features/songs/components/ratings/RatingWidget.tsx`
6. `src/features/songs/components/ratings/ReviewForm.tsx`
7. `src/features/songs/components/arrangements/ArrangementForm.tsx`
8. `src/features/songs/components/admin/DuplicateManager.tsx`
9. Update existing components for integration
10. Test files for all components

## Success Metrics

- ✅ Reviews persist in database
- ✅ Ratings update automatically
- ✅ Arrangements can be created with songs
- ✅ Duplicates detected accurately
- ✅ Admin can merge duplicates
- ✅ Bulk operations work
- ✅ Performance targets met
- ✅ No data loss during merges

## Common Pitfalls to Avoid

1. **Rating recalculation** - Use database hooks for consistency
2. **Duplicate false positives** - Tune Levenshtein threshold
3. **Merge data loss** - Combine all metadata carefully
4. **Review spam** - Implement rate limiting
5. **Arrangement size** - Compress large chord data
6. **Admin permissions** - Double-check authorization
7. **Bulk operation limits** - Batch large operations

## External Resources

- [MongoDB Aggregation for Ratings](https://www.mongodb.com/docs/manual/aggregation/)
- [ChordPro Format Specification](https://www.chordpro.org/)
- [Levenshtein Algorithm Optimization](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [React Admin Patterns](https://marmelab.com/react-admin/)

## Conclusion

These advanced features transform the song management system into a professional-grade platform with duplicate management, comprehensive reviews, and powerful admin tools.

**Confidence Score: 9/10** - Comprehensive feature set with clear implementation path and existing infrastructure support.