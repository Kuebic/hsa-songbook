# PRP: Enhanced Setlist Management Feature Implementation

## Executive Summary

Implement comprehensive setlist management with public sharing, drag-and-drop reordering, continuous playback mode, and social features for HSA Songbook. This PRP provides complete context for one-pass implementation following the existing vertical slice architecture.

**Confidence Score: 9/10** - All patterns exist in codebase, clear implementation path.

---

## 1. Context & Requirements

### Feature Overview
Based on PRD at `PRPs/setlist-feature-prd.md`, implement:
- Public shareable URLs (`/setlist/{shareId}`)
- Drag-and-drop arrangement reordering
- Per-arrangement key transposition
- Continuous playback mode
- "Add to Setlist" integration
- Social features (likes, profiles)

### Existing Infrastructure to Leverage
- **Vertical Slice Pattern**: `/src/features/setlists/` already exists with basic functionality
- **Modal System**: Robust modal infrastructure at `/src/shared/components/modal/`
- **Auth System**: Clerk integration with role-based access
- **API Contract**: Defined in `/PRPs/contracts/hsa-songbook-api-contract.md`
- **Drag-and-Drop**: Basic HTML5 implementation exists, needs upgrade
- **Stage Mode**: Fullscreen playback patterns in arrangements feature

---

## 2. Vertical Slice Architecture

### Feature Boundary Definition

```
src/features/setlists/
├── components/
│   ├── builder/                    # Setlist building UI
│   │   ├── SetlistBuilder.tsx     # Main builder component (exists, enhance)
│   │   ├── DraggableArrangementList.tsx
│   │   └── ArrangementItem.tsx
│   ├── player/                     # Playback mode
│   │   ├── SetlistPlayer.tsx
│   │   ├── PlayerControls.tsx
│   │   └── ProgressIndicator.tsx
│   ├── sharing/                    # Share functionality
│   │   ├── ShareButton.tsx
│   │   ├── ShareModal.tsx
│   │   └── QRCodeView.tsx
│   ├── selectors/                  # Add to setlist
│   │   ├── AddToSetlistButton.tsx
│   │   └── SetlistSelectorModal.tsx
│   ├── SetlistCard.tsx            # Exists
│   ├── SetlistGrid.tsx            # Exists
│   └── SetlistHeader.tsx          # Exists
├── hooks/
│   ├── queries/                    # React Query hooks
│   │   ├── useSetlistsQuery.ts
│   │   └── usePublicSetlist.ts
│   ├── mutations/
│   │   ├── useCreateSetlist.ts
│   │   ├── useUpdateSetlist.ts
│   │   └── useReorderArrangements.ts
│   ├── usePlaybackState.ts        # Playback context
│   ├── useDragAndDropEnhanced.ts  # Enhanced drag-drop
│   └── useSetlistShare.ts         # Share functionality
├── services/
│   ├── setlistService.ts          # API integration (enhance existing)
│   └── shareService.ts            # Public sharing
├── contexts/
│   ├── PlaybackContext.tsx        # Playback state management
│   └── AddToSetlistContext.tsx    # Add to setlist state
├── types/
│   └── setlist.types.ts           # Exists, enhance
├── pages/
│   ├── SetlistPage.tsx            # Exists
│   ├── SetlistDetailPage.tsx      # Exists, enhance
│   ├── PublicSetlistPage.tsx      # New
│   └── SetlistPlayerPage.tsx      # New
├── utils/
│   ├── shareIdGenerator.ts        # Nanoid integration
│   └── playbackHelpers.ts         # Navigation logic
└── index.ts                        # Public API exports
```

### Cross-Feature Dependencies
- `@features/auth` - User authentication
- `@features/songs` - Song data types
- `@features/arrangements` - Arrangement components and services
- `@shared/components/modal` - Modal infrastructure
- `@shared/components/notifications` - User feedback

---

## 3. Implementation Blueprint

### Phase 1: Enhanced Data Models & API Integration

#### 1.1 Update Types (`types/setlist.types.ts`)

```typescript
import type { Arrangement } from '@features/songs'

export interface Setlist {
  // Existing fields
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  createdBy?: string
  
  // New fields
  shareId?: string              // Public sharing ID (nanoid)
  createdByName?: string        // Cached username
  likes: number                 // Like count
  likedBy: string[]            // User IDs
  lastPlayedAt?: Date
  defaultTransitionTime?: number
  allowDuplication: boolean
  
  // Enhanced arrangements
  arrangements: SetlistArrangement[]  // Renamed from 'songs'
}

export interface SetlistArrangement {
  arrangementId: string
  arrangement?: Arrangement    // Populated on fetch
  order: number
  
  // Customization
  keyOverride?: string
  capoOverride?: number
  tempoOverride?: number
  notes?: string
  duration?: number
  
  // Metadata
  addedAt: Date
  addedBy: string
}

export interface PlayableSetlist extends Setlist {
  arrangements: PopulatedSetlistArrangement[]
}

export interface PopulatedSetlistArrangement extends SetlistArrangement {
  arrangement: Arrangement
}
```

#### 1.2 Service Layer (`services/setlistService.ts`)

```typescript
import { fetchAPI, APIError } from '@shared/utils/api'
import type { Setlist, SetlistArrangement, CreateSetlistRequest } from '../types'

const API_BASE = '/api/v1'

class SetlistService {
  private cache = new Map<string, { data: Setlist; timestamp: number }>()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  async getSetlists(filters?: SetlistFilters): Promise<Page<Setlist>> {
    const params = new URLSearchParams()
    if (filters?.userId) params.append('userId', filters.userId)
    if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic))
    
    return fetchAPI<Page<Setlist>>(`${API_BASE}/setlists?${params.toString()}`)
  }

  async getSetlist(id: string, token?: string): Promise<Setlist> {
    // Check cache first
    const cached = this.cache.get(id)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const setlist = await fetchAPI<Setlist>(`${API_BASE}/setlists/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    
    // Cache the result
    this.cache.set(id, { data: setlist, timestamp: Date.now() })
    return setlist
  }

  async getPublicSetlist(shareId: string): Promise<Setlist> {
    return fetchAPI<Setlist>(`${API_BASE}/setlists/public/${shareId}`)
  }

  async createSetlist(data: CreateSetlistRequest, token: string): Promise<Setlist> {
    const setlist = await fetchAPI<Setlist>(`${API_BASE}/setlists`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    // Invalidate list cache
    this.cache.clear()
    return setlist
  }

  async updateSetlist(id: string, data: Partial<Setlist>, token: string): Promise<Setlist> {
    const setlist = await fetchAPI<Setlist>(`${API_BASE}/setlists/${id}`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    // Update cache
    this.cache.set(id, { data: setlist, timestamp: Date.now() })
    return setlist
  }

  async reorderArrangements(
    setlistId: string, 
    arrangements: SetlistArrangement[], 
    token: string
  ): Promise<Setlist> {
    return this.updateSetlist(setlistId, { arrangements }, token)
  }

  async addArrangement(
    setlistId: string,
    arrangementId: string,
    options: Partial<SetlistArrangement>,
    token: string
  ): Promise<Setlist> {
    return fetchAPI<Setlist>(`${API_BASE}/setlists/${setlistId}/arrangements`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ arrangementId, ...options })
    })
  }

  async likeSetlist(id: string, token: string): Promise<{ likes: number; liked: boolean }> {
    return fetchAPI(`${API_BASE}/setlists/${id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async duplicateSetlist(id: string, name: string, token: string): Promise<Setlist> {
    return fetchAPI<Setlist>(`${API_BASE}/setlists/${id}/duplicate`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })
  }

  clearCache() {
    this.cache.clear()
  }
}

export const setlistService = new SetlistService()
```

### Phase 2: React Query Integration

#### 2.1 Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools nanoid @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### 2.2 Query Hooks (`hooks/queries/useSetlistsQuery.ts`)

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { setlistService } from '../../services/setlistService'
import type { Setlist, SetlistFilters } from '../../types'

// Query key factory
export const setlistKeys = {
  all: ['setlists'] as const,
  lists: () => [...setlistKeys.all, 'list'] as const,
  list: (filters: string) => [...setlistKeys.lists(), { filters }] as const,
  details: () => [...setlistKeys.all, 'detail'] as const,
  detail: (id: string) => [...setlistKeys.details(), id] as const,
  public: (shareId: string) => [...setlistKeys.all, 'public', shareId] as const,
}

// Get user's setlists
export function useSetlists(filters?: SetlistFilters) {
  const { getToken } = useAuth()
  
  return useQuery({
    queryKey: setlistKeys.list(JSON.stringify(filters || {})),
    queryFn: async () => {
      const token = await getToken()
      return setlistService.getSetlists(filters)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get single setlist
export function useSetlist(id: string) {
  const { getToken } = useAuth()
  
  return useQuery({
    queryKey: setlistKeys.detail(id),
    queryFn: async () => {
      const token = await getToken()
      return setlistService.getSetlist(id, token || undefined)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get public setlist by shareId
export function usePublicSetlist(shareId: string) {
  return useQuery({
    queryKey: setlistKeys.public(shareId),
    queryFn: () => setlistService.getPublicSetlist(shareId),
    enabled: !!shareId,
    staleTime: 10 * 60 * 1000, // 10 minutes for public data
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 404) return false
      return failureCount < 3
    },
  })
}

// Infinite scrolling for large collections
export function useInfiniteSetlists(filters?: SetlistFilters) {
  const { getToken } = useAuth()
  
  return useInfiniteQuery({
    queryKey: ['setlists', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const token = await getToken()
      return setlistService.getSetlists({ ...filters, page: pageParam })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 
      lastPage.number < lastPage.totalPages - 1 ? lastPage.number + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  })
}
```

#### 2.3 Mutation Hooks (`hooks/mutations/useCreateSetlist.ts`)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { setlistService } from '../../services/setlistService'
import { setlistKeys } from '../queries/useSetlistsQuery'
import type { CreateSetlistRequest, Setlist } from '../../types'

export function useCreateSetlist() {
  const queryClient = useQueryClient()
  const { getToken, userId } = useAuth()
  const { addNotification } = useNotification()
  
  return useMutation({
    mutationFn: async (data: CreateSetlistRequest) => {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')
      return setlistService.createSetlist(data, token)
    },
    
    onMutate: async (data) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: setlistKeys.lists() })
      
      // Optimistic update
      const optimisticSetlist: Setlist = {
        id: `temp-${Date.now()}`,
        shareId: undefined,
        name: data.name,
        description: data.description,
        arrangements: data.arrangements || [],
        createdBy: userId || '',
        createdByName: 'You',
        isPublic: data.isPublic ?? true,
        likes: 0,
        likedBy: [],
        allowDuplication: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Add to cache optimistically
      queryClient.setQueryData(
        setlistKeys.lists(),
        (old: any) => ({
          ...old,
          content: [optimisticSetlist, ...(old?.content || [])]
        })
      )
      
      return { optimisticSetlist }
    },
    
    onError: (err, data, context) => {
      // Rollback on error
      if (context?.optimisticSetlist) {
        queryClient.setQueryData(
          setlistKeys.lists(),
          (old: any) => ({
            ...old,
            content: old?.content?.filter((s: Setlist) => 
              s.id !== context.optimisticSetlist.id
            ) || []
          })
        )
      }
      
      addNotification({
        type: 'error',
        title: 'Failed to create setlist',
        message: err.message
      })
    },
    
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: setlistKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Setlist created',
        message: `"${data.name}" has been created successfully`
      })
    }
  })
}
```

### Phase 3: Enhanced Drag-and-Drop

#### 3.1 Enhanced Drag-and-Drop Hook (`hooks/useDragAndDropEnhanced.ts`)

```typescript
import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import type { SetlistArrangement } from '../types'

interface UseDragAndDropEnhancedProps {
  items: SetlistArrangement[]
  onReorder: (items: SetlistArrangement[]) => void
  disabled?: boolean
}

export function useDragAndDropEnhanced({
  items,
  onReorder,
  disabled = false
}: UseDragAndDropEnhancedProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState(items)
  
  // Sync with prop changes
  useEffect(() => {
    setLocalItems(items)
  }, [items])
  
  // Configure sensors for pointer, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex(item => item.arrangementId === active.id)
      const newIndex = localItems.findIndex(item => item.arrangementId === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(localItems, oldIndex, newIndex)
          .map((item, index) => ({ ...item, order: index }))
        
        setLocalItems(newItems)
        onReorder(newItems)
      }
    }
    
    setActiveId(null)
  }, [localItems, onReorder])
  
  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])
  
  return {
    DndContext,
    sensors,
    modifiers: [restrictToVerticalAxis],
    collisionDetection: closestCenter,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeId,
    items: localItems,
    SortableContext,
    verticalListSortingStrategy,
    disabled,
  }
}
```

#### 3.2 Draggable Arrangement Component

```typescript
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SetlistArrangement } from '../../types'

interface DraggableArrangementItemProps {
  item: SetlistArrangement
  onRemove: () => void
  onUpdateKey: (key: string) => void
  disabled?: boolean
}

export function DraggableArrangementItem({ 
  item, 
  onRemove, 
  onUpdateKey,
  disabled 
}: DraggableArrangementItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.arrangementId,
    disabled 
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`arrangement-item ${isDragging ? 'dragging' : ''}`}
    >
      {!disabled && (
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          </svg>
        </button>
      )}
      
      <div className="arrangement-content flex-1">
        <h4>{item.arrangement?.song?.title || 'Loading...'}</h4>
        <div className="arrangement-meta">
          {item.keyOverride && (
            <span className="key-override">Key: {item.keyOverride}</span>
          )}
          {item.notes && (
            <span className="notes">{item.notes}</span>
          )}
        </div>
      </div>
      
      <button
        onClick={onRemove}
        className="remove-button"
        aria-label="Remove from setlist"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
```

### Phase 4: Public Sharing Implementation

#### 4.1 Share ID Generator (`utils/shareIdGenerator.ts`)

```typescript
import { nanoid, customAlphabet } from 'nanoid'

// Custom alphabet without ambiguous characters (no 0, O, l, I)
const generateShareId = customAlphabet(
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  12 // 12 characters for good collision resistance
)

export function createShareableId(): string {
  return generateShareId()
}

export function isValidShareId(id: string): boolean {
  return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{12}$/.test(id)
}

// Generate shareable URL
export function getShareableUrl(shareId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/share/setlist/${shareId}`
}

// QR code URL
export function getQRCodeUrl(shareId: string): string {
  const shareUrl = getShareableUrl(shareId)
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(shareUrl)}`
}
```

#### 4.2 Share Components (`components/sharing/ShareButton.tsx`)

```typescript
import { useState, useCallback } from 'react'
import { useNotification } from '@shared/components/notifications'
import { getShareableUrl } from '../../utils/shareIdGenerator'
import { ShareModal } from './ShareModal'
import type { Setlist } from '../../types'

interface ShareButtonProps {
  setlist: Setlist
  onGenerateShareId?: () => Promise<string>
}

export function ShareButton({ setlist, onGenerateShareId }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { addNotification } = useNotification()
  
  const handleShare = useCallback(async () => {
    if (!setlist.shareId && onGenerateShareId) {
      setIsGenerating(true)
      try {
        await onGenerateShareId()
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Failed to generate share link',
          message: error.message
        })
        return
      } finally {
        setIsGenerating(false)
      }
    }
    
    setIsModalOpen(true)
  }, [setlist.shareId, onGenerateShareId, addNotification])
  
  const handleCopyLink = useCallback(async () => {
    if (!setlist.shareId) return
    
    const url = getShareableUrl(setlist.shareId)
    
    try {
      await navigator.clipboard.writeText(url)
      addNotification({
        type: 'success',
        title: 'Link copied!',
        message: 'Share link has been copied to clipboard'
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      addNotification({
        type: 'success',
        title: 'Link copied!',
        message: 'Share link has been copied to clipboard'
      })
    }
  }, [setlist.shareId, addNotification])
  
  return (
    <>
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className="share-button flex items-center gap-2"
        aria-label="Share setlist"
      >
        {isGenerating ? (
          <>
            <span className="spinner" />
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </>
        )}
      </button>
      
      {isModalOpen && (
        <ShareModal
          setlist={setlist}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCopyLink={handleCopyLink}
        />
      )}
    </>
  )
}
```

### Phase 5: Playback Mode Implementation

#### 5.1 Playback Context (`contexts/PlaybackContext.tsx`)

```typescript
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlayableSetlist, SetlistArrangement } from '../types'

interface PlaybackContextType {
  // State
  setlist: PlayableSetlist | null
  currentIndex: number
  isPlaying: boolean
  isFullscreen: boolean
  
  // Navigation
  history: number[]
  canGoBack: boolean
  canGoForward: boolean
  
  // Customization
  currentKey?: string
  fontSize: number
  autoScroll: boolean
  scrollSpeed: number
  
  // Methods
  play: (setlist: PlayableSetlist) => void
  pause: () => void
  next: () => void
  previous: () => void
  jumpTo: (index: number) => void
  updateKey: (key: string) => void
  toggleFullscreen: () => void
  setFontSize: (size: number) => void
  setAutoScroll: (enabled: boolean) => void
  setScrollSpeed: (speed: number) => void
  exit: () => void
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [setlist, setSetlist] = useState<PlayableSetlist | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [currentKey, setCurrentKey] = useState<string>()
  const [fontSize, setFontSize] = useState(16)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!isPlaying) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          next()
          break
        case 'ArrowLeft':
          previous()
          break
        case ' ':
          e.preventDefault()
          setAutoScroll(prev => !prev)
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen()
          } else {
            exit()
          }
          break
        default:
          // Number keys for jumping
          if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1
            if (index < (setlist?.arrangements.length || 0)) {
              jumpTo(index)
            }
          }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isFullscreen, setlist])
  
  const play = useCallback((newSetlist: PlayableSetlist) => {
    setSetlist(newSetlist)
    setCurrentIndex(0)
    setHistory([0])
    setIsPlaying(true)
    navigate(`/setlist/${newSetlist.id}/play`)
  }, [navigate])
  
  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])
  
  const next = useCallback(() => {
    if (!setlist) return
    
    const nextIndex = Math.min(currentIndex + 1, setlist.arrangements.length - 1)
    if (nextIndex !== currentIndex) {
      setHistory(prev => [...prev, nextIndex])
      setCurrentIndex(nextIndex)
    }
  }, [setlist, currentIndex])
  
  const previous = useCallback(() => {
    if (!setlist) return
    
    const prevIndex = Math.max(currentIndex - 1, 0)
    if (prevIndex !== currentIndex) {
      setHistory(prev => [...prev, prevIndex])
      setCurrentIndex(prevIndex)
    }
  }, [setlist, currentIndex])
  
  const jumpTo = useCallback((index: number) => {
    if (!setlist || index < 0 || index >= setlist.arrangements.length) return
    
    setHistory(prev => [...prev, index])
    setCurrentIndex(index)
  }, [setlist])
  
  const updateKey = useCallback((key: string) => {
    setCurrentKey(key)
  }, [])
  
  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } catch (error) {
        console.error('Failed to enter fullscreen:', error)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (error) {
        console.error('Failed to exit fullscreen:', error)
      }
    }
  }, [isFullscreen])
  
  const exit = useCallback(() => {
    setSetlist(null)
    setCurrentIndex(0)
    setHistory([])
    setIsPlaying(false)
    setIsFullscreen(false)
    navigate(-1)
  }, [navigate])
  
  const value: PlaybackContextType = {
    setlist,
    currentIndex,
    isPlaying,
    isFullscreen,
    history,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < (setlist?.arrangements.length || 0) - 1,
    currentKey,
    fontSize,
    autoScroll,
    scrollSpeed,
    play,
    pause,
    next,
    previous,
    jumpTo,
    updateKey,
    toggleFullscreen,
    setFontSize,
    setAutoScroll,
    setScrollSpeed,
    exit,
  }
  
  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  )
}

export function usePlayback() {
  const context = useContext(PlaybackContext)
  if (!context) {
    throw new Error('usePlayback must be used within PlaybackProvider')
  }
  return context
}
```

#### 5.2 Player Component (`components/player/SetlistPlayer.tsx`)

```typescript
import { useEffect, useRef } from 'react'
import { Modal } from '@shared/components/modal'
import { ArrangementViewer } from '@features/arrangements'
import { usePlayback } from '../../contexts/PlaybackContext'
import { PlayerControls } from './PlayerControls'
import { ProgressIndicator } from './ProgressIndicator'

export function SetlistPlayer() {
  const {
    setlist,
    currentIndex,
    isPlaying,
    isFullscreen,
    currentKey,
    fontSize,
    autoScroll,
    scrollSpeed,
    next,
    previous,
    jumpTo,
    updateKey,
    toggleFullscreen,
    exit
  } = usePlayback()
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll implementation
  useEffect(() => {
    if (!autoScroll || !scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    let animationId: number
    
    const scroll = () => {
      container.scrollTop += scrollSpeed
      
      // Loop back to top when reaching bottom
      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        container.scrollTop = 0
      }
      
      animationId = requestAnimationFrame(scroll)
    }
    
    animationId = requestAnimationFrame(scroll)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [autoScroll, scrollSpeed])
  
  if (!setlist || !isPlaying) return null
  
  const currentArrangement = setlist.arrangements[currentIndex]
  if (!currentArrangement) return null
  
  return (
    <Modal
      isOpen={isPlaying}
      onClose={exit}
      size={isFullscreen ? 'fullscreen' : 'xl'}
      closeOnEsc={!isFullscreen}
      closeOnOverlayClick={false}
      showCloseButton={!isFullscreen}
      className="setlist-player"
    >
      <div className="player-container">
        {/* Header */}
        <div className="player-header">
          <button onClick={exit} className="back-button">
            ← Back
          </button>
          
          <div className="song-info">
            <h2>{currentArrangement.arrangement.song.title}</h2>
            <span className="position">
              {currentIndex + 1} of {setlist.arrangements.length}
            </span>
          </div>
          
          <button onClick={toggleFullscreen} className="fullscreen-button">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
        
        {/* Progress */}
        <ProgressIndicator
          current={currentIndex}
          total={setlist.arrangements.length}
          onJumpTo={jumpTo}
        />
        
        {/* Arrangement Info Bar */}
        {(currentArrangement.keyOverride || currentArrangement.notes) && (
          <div className="arrangement-info">
            {currentArrangement.keyOverride && (
              <span className="key-info">
                Key: {currentArrangement.arrangement.key} → {currentArrangement.keyOverride}
              </span>
            )}
            {currentArrangement.notes && (
              <div className="performance-notes">
                <strong>Notes:</strong> {currentArrangement.notes}
              </div>
            )}
          </div>
        )}
        
        {/* Arrangement Display */}
        <div 
          ref={scrollContainerRef}
          className="arrangement-display"
          style={{ fontSize: `${fontSize}px` }}
        >
          <ArrangementViewer
            arrangement={currentArrangement.arrangement}
            initialKey={currentArrangement.keyOverride || currentArrangement.arrangement.key}
            onKeyChange={updateKey}
            hideControls={isFullscreen}
          />
        </div>
        
        {/* Controls */}
        <PlayerControls
          onPrevious={previous}
          onNext={next}
          canGoPrevious={currentIndex > 0}
          canGoNext={currentIndex < setlist.arrangements.length - 1}
          autoScroll={autoScroll}
          onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          scrollSpeed={scrollSpeed}
          onScrollSpeedChange={setScrollSpeed}
        />
      </div>
    </Modal>
  )
}
```

### Phase 6: Add to Setlist Integration

#### 6.1 Add to Setlist Button (`components/selectors/AddToSetlistButton.tsx`)

```typescript
import { useState, useCallback } from 'react'
import { useAuth } from '@features/auth'
import { useSetlists } from '../../hooks/queries/useSetlistsQuery'
import { useAddToSetlist } from '../../hooks/mutations/useAddToSetlist'
import { SetlistSelectorModal } from './SetlistSelectorModal'
import type { Arrangement } from '@features/songs'

interface AddToSetlistButtonProps {
  arrangement: Arrangement
  variant?: 'icon' | 'button' | 'menu-item'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AddToSetlistButton({ 
  arrangement, 
  variant = 'button',
  size = 'md',
  className 
}: AddToSetlistButtonProps) {
  const { isSignedIn } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: setlists } = useSetlists({ userId: 'me' })
  const addToSetlist = useAddToSetlist()
  
  // Check if arrangement is already in setlists
  const setlistCount = setlists?.content?.filter(s => 
    s.arrangements.some(a => a.arrangementId === arrangement.id)
  ).length || 0
  
  const handleClick = useCallback(() => {
    if (!isSignedIn) {
      // Trigger sign-in flow
      window.location.href = '/sign-in?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    
    setIsModalOpen(true)
  }, [isSignedIn])
  
  const handleAddToSetlist = useCallback(async (setlistId: string, options?: any) => {
    await addToSetlist.mutateAsync({
      setlistId,
      arrangementId: arrangement.id,
      ...options
    })
    setIsModalOpen(false)
  }, [arrangement.id, addToSetlist])
  
  // Render based on variant
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`add-to-setlist-icon ${className}`}
          aria-label="Add to setlist"
          title={setlistCount > 0 ? `In ${setlistCount} setlists` : 'Add to setlist'}
        >
          {setlistCount > 0 ? (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        
        {isModalOpen && (
          <SetlistSelectorModal
            arrangement={arrangement}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelect={handleAddToSetlist}
          />
        )}
      </>
    )
  }
  
  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`menu-item ${className}`}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
          </svg>
          Add to Setlist
          {setlistCount > 0 && (
            <span className="ml-auto text-xs text-gray-500">({setlistCount})</span>
          )}
        </button>
        
        {isModalOpen && (
          <SetlistSelectorModal
            arrangement={arrangement}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelect={handleAddToSetlist}
          />
        )}
      </>
    )
  }
  
  // Default button variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`add-to-setlist-button ${size} ${className}`}
        disabled={addToSetlist.isPending}
      >
        {addToSetlist.isPending ? (
          <span className="spinner" />
        ) : setlistCount > 0 ? (
          <>
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            In {setlistCount} Setlist{setlistCount !== 1 ? 's' : ''}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
            </svg>
            Add to Setlist
          </>
        )}
      </button>
      
      {isModalOpen && (
        <SetlistSelectorModal
          arrangement={arrangement}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleAddToSetlist}
        />
      )}
    </>
  )
}
```

---

## 4. Validation Gates

All validation commands must pass for successful implementation:

```bash
# 1. Type checking
npm run type-check
# Expected: No TypeScript errors

# 2. Linting
npm run lint
# Expected: No ESLint errors

# 3. Unit tests
npm run test -- --run src/features/setlists
# Expected: All tests pass

# 4. Build validation
npm run build
# Expected: Build completes without errors

# 5. Bundle size check (if configured)
npm run analyze
# Expected: Bundle size within limits

# 6. Integration tests
npm run test:e2e -- setlist
# Expected: E2E tests pass

# 7. Accessibility audit
npm run test:a11y
# Expected: No critical accessibility issues

# 8. Performance check
npm run lighthouse
# Expected: Performance score > 90
```

---

## 5. Testing Strategy

### Unit Tests Example

```typescript
// src/features/setlists/__tests__/useSetlistsQuery.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSetlists } from '../hooks/queries/useSetlistsQuery'

describe('useSetlists', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  it('fetches setlists successfully', async () => {
    const { result } = renderHook(() => useSetlists(), { wrapper })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toBeDefined()
    expect(result.current.data.content).toBeInstanceOf(Array)
  })
})
```

### E2E Test Example

```typescript
// e2e/setlist.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Setlist Management', () => {
  test('should create and share a setlist', async ({ page }) => {
    // Navigate to setlists page
    await page.goto('/setlists')
    
    // Create new setlist
    await page.click('button:has-text("Create Setlist")')
    await page.fill('input[name="name"]', 'Sunday Service')
    await page.fill('textarea[name="description"]', 'Contemporary worship')
    await page.click('button:has-text("Create")')
    
    // Verify creation
    await expect(page.locator('h1:has-text("Sunday Service")')).toBeVisible()
    
    // Generate share link
    await page.click('button:has-text("Share")')
    await expect(page.locator('text=Share link generated')).toBeVisible()
    
    // Copy link
    await page.click('button:has-text("Copy Link")')
    await expect(page.locator('text=Link copied')).toBeVisible()
  })
  
  test('should support drag and drop reordering', async ({ page }) => {
    await page.goto('/setlists/test-setlist')
    
    // Drag first item to third position
    const firstItem = page.locator('.arrangement-item').first()
    const thirdItem = page.locator('.arrangement-item').nth(2)
    
    await firstItem.dragTo(thirdItem)
    
    // Verify reorder
    await expect(page.locator('.arrangement-item').first()).not.toContainText('First Song')
  })
})
```

---

## 6. Implementation Checklist

### Phase 1: Core Infrastructure ✅
- [ ] Install dependencies (@tanstack/react-query, @dnd-kit, nanoid)
- [ ] Update type definitions
- [ ] Enhance service layer
- [ ] Setup React Query

### Phase 2: Drag and Drop ✅
- [ ] Implement enhanced drag-and-drop hook
- [ ] Create draggable components
- [ ] Add touch support
- [ ] Test accessibility

### Phase 3: Public Sharing ✅
- [ ] Implement share ID generation
- [ ] Create share components
- [ ] Add public routes
- [ ] Test URL generation

### Phase 4: Playback Mode ✅
- [ ] Create playback context
- [ ] Implement player components
- [ ] Add keyboard shortcuts
- [ ] Test fullscreen mode

### Phase 5: Add to Setlist ✅
- [ ] Create add button component
- [ ] Implement selector modal
- [ ] Integrate across app
- [ ] Test user flows

### Phase 6: Social Features
- [ ] Implement like functionality
- [ ] Add to user profiles
- [ ] Create discovery page
- [ ] Test social interactions

---

## 7. Critical Implementation Notes

### Performance Considerations
1. **Use React.memo** for arrangement items in lists
2. **Implement virtual scrolling** for large setlists (>50 items)
3. **Prefetch arrangements** when viewing setlist
4. **Cache share URLs** in localStorage
5. **Debounce drag operations** to prevent excessive updates

### Security Requirements
1. **Validate share IDs** on both client and server
2. **Rate limit public endpoints** (20 req/min)
3. **Sanitize user inputs** in notes and descriptions
4. **Check permissions** for all mutations
5. **Use HTTPS only** for share URLs

### Accessibility Checklist
1. **Keyboard navigation** for all interactive elements
2. **ARIA labels** for icon buttons
3. **Focus management** in modals
4. **Screen reader announcements** for drag operations
5. **High contrast mode** support

### Mobile Optimization
1. **Touch-friendly drag handles** (44px minimum)
2. **Responsive modal layouts**
3. **Virtual keyboard handling**
4. **Swipe gestures** for next/previous in playback
5. **Progressive Web App** features

---

## 8. External Resources

### Documentation URLs
- **React Query v5**: https://tanstack.com/query/latest
- **@dnd-kit**: https://docs.dndkit.com/
- **Nanoid**: https://github.com/ai/nanoid
- **React Router v6**: https://reactrouter.com/en/main
- **Clerk Auth**: https://clerk.com/docs

### Referenced Files
- API Contract: `/PRPs/contracts/hsa-songbook-api-contract.md`
- PRD: `/PRPs/setlist-feature-prd.md`
- Existing Setlist Code: `/src/features/setlists/`
- Modal System: `/src/shared/components/modal/`
- Arrangement Viewer: `/src/features/arrangements/`

### Code Examples
- Optimistic Updates: See Phase 2.3
- Drag and Drop: See Phase 3.1-3.2
- Share Implementation: See Phase 4.1-4.2
- Playback Mode: See Phase 5.1-5.2

---

## 9. Success Metrics

Implementation is successful when:
1. All validation gates pass
2. User can create, share, and play setlists
3. Drag-and-drop works on desktop and mobile
4. Share URLs are accessible without auth
5. Playback mode supports all keyboard shortcuts
6. Add to Setlist appears on all arrangement views
7. Performance scores remain above 90
8. Zero critical accessibility issues

---

## 10. Troubleshooting Guide

### Common Issues and Solutions

1. **TypeScript errors with React Query**
   - Ensure `@tanstack/react-query` v5 is installed
   - Check `tsconfig.json` has `"strict": true`

2. **Drag and drop not working on mobile**
   - Verify TouchSensor is configured
   - Check touch-action CSS property

3. **Share URLs not generating**
   - Confirm nanoid is installed
   - Check API endpoint returns shareId

4. **Playback keyboard shortcuts not working**
   - Verify event listeners are cleaned up
   - Check focus is on player component

5. **Optimistic updates flickering**
   - Use local state during mutations
   - Implement proper cache invalidation

---

This PRP provides comprehensive context for implementing the enhanced setlist management feature in one pass. All patterns reference existing code, dependencies are clearly defined, and validation gates ensure quality.