# UI Integration & Triggers Implementation PRP

## Executive Summary
Integrate song form functionality into the UI by adding a plus button to the header for song creation, edit buttons to song cards, implementing permission-based visibility, and creating success/error notifications. This connects all previous components into a cohesive user experience.

**Confidence Score: 9.5/10** - Very high confidence due to existing UI patterns and clear integration points.

## Context and Research Findings

### Current State Analysis
**Existing UI Components:**
- `Layout.tsx` with header structure
- `SongCard.tsx` for song display
- `SongList.tsx` for song listings
- `useAuth` hook for user permissions
- Inline styles pattern established

**Missing UI Elements:**
- No plus button in header for song creation
- No edit/delete buttons on song cards
- No permission-based UI visibility
- No toast/notification system
- No loading states during operations

### UI/UX Requirements
From documentation and existing patterns:
- Plus button (➕) in header for quick access
- Edit button (✏️) on song cards for owners/admins
- Delete button (🗑️) with confirmation
- Permission-based visibility (owner + admin can edit/delete)
- Success/error notifications for all operations
- Loading states during async operations

### Vertical Slice Architecture
```
src/shared/components/
├── notifications/
│   ├── NotificationProvider.tsx  # Notification context
│   ├── NotificationContainer.tsx # Notification display
│   ├── useNotification.ts       # Notification hook
│   └── Notification.types.ts    # Type definitions

src/features/songs/components/
├── ui/
│   ├── AddSongButton.tsx        # Header plus button
│   ├── EditSongButton.tsx       # Card edit button  
│   ├── DeleteSongButton.tsx     # Card delete button
│   └── SongActions.tsx          # Combined actions

Updates to existing:
├── Layout.tsx                   # Add plus button
├── SongCard.tsx                 # Add action buttons
└── SongList.tsx                 # Handle mutations
```

## Implementation Blueprint

### Phase 1: Notification System

```typescript
// src/shared/components/notifications/Notification.types.ts
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export interface NotificationContextValue {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

// src/shared/components/notifications/NotificationProvider.tsx
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { Notification, NotificationContextValue } from './Notification.types'
import { NotificationContainer } from './NotificationContainer'

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  const addNotification = useCallback((
    notification: Omit<Notification, 'id'>
  ): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-dismiss after duration
    if (newNotification.duration && newNotification.duration > 0) {
      const timeout = setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
      
      timeoutsRef.current.set(id, timeout)
    }
    
    return id
  }, [])
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])
  
  const clearNotifications = useCallback(() => {
    setNotifications([])
    
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current.clear()
  }, [])
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

// src/shared/components/notifications/NotificationContainer.tsx
import { useNotification } from './useNotification'
import type { Notification, NotificationType } from './Notification.types'

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()
  
  if (notifications.length === 0) return null
  
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px',
    pointerEvents: 'none'
  }
  
  return (
    <div style={containerStyles} role="region" aria-label="Notifications">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onDismiss
}: {
  notification: Notification
  onDismiss: () => void
}) {
  const getTypeStyles = (type: NotificationType): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'slideIn 0.3s ease-out',
      pointerEvents: 'auto',
      minWidth: '300px'
    }
    
    const typeStyles: Record<NotificationType, React.CSSProperties> = {
      success: {
        backgroundColor: '#10b981',
        color: 'white'
      },
      error: {
        backgroundColor: '#ef4444',
        color: 'white'
      },
      warning: {
        backgroundColor: '#f59e0b',
        color: 'white'
      },
      info: {
        backgroundColor: '#3b82f6',
        color: 'white'
      }
    }
    
    return { ...baseStyles, ...typeStyles[type] }
  }
  
  const getIcon = (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }
    return icons[type]
  }
  
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div
        style={getTypeStyles(notification.type)}
        role="alert"
        aria-live="polite"
      >
        <span style={{ fontSize: '20px' }}>{getIcon(notification.type)}</span>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {notification.title}
          </div>
          {notification.message && (
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {notification.message}
            </div>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {notification.action.label}
            </button>
          )}
        </div>
        
        {notification.dismissible && (
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0',
              opacity: 0.8
            }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    </>
  )
}
```

### Phase 2: Add Song Button for Header

```typescript
// src/features/songs/components/ui/AddSongButton.tsx
import { useState } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { SongFormModal } from '../forms/SongFormModal'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'
import { useNotification } from '@shared/components/notifications'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

export function AddSongButton() {
  const { isSignedIn, user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const { createSong } = useSongMutations()
  const { addNotification } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  if (!isSignedIn) return null
  
  const handleSubmit = async (data: SongFormData) => {
    setIsSubmitting(true)
    
    try {
      const song = await createSong(data)
      
      addNotification({
        type: 'success',
        title: 'Song created successfully',
        message: `"${song.title}" has been added to the songbook`,
        action: {
          label: 'View Song',
          onClick: () => {
            window.location.href = `/songs/${song.slug}`
          }
        }
      })
      
      setShowModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const buttonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s'
  }
  
  const iconStyles: React.CSSProperties = {
    fontSize: '18px'
  }
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={buttonStyles}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#2563eb'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#3b82f6'
        }}
        aria-label="Add new song"
        title="Add new song"
      >
        <span style={iconStyles}>➕</span>
        <span>Add Song</span>
      </button>
      
      <SongFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
```

### Phase 3: Song Card Action Buttons

```typescript
// src/features/songs/components/ui/SongActions.tsx
import { useState } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { SongFormModal } from '../forms/SongFormModal'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'
import { useNotification } from '@shared/components/notifications'
import type { Song } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

interface SongActionsProps {
  song: Song
  onDelete?: (songId: string) => void
  onUpdate?: (song: Song) => void
}

export function SongActions({ song, onDelete, onUpdate }: SongActionsProps) {
  const { isSignedIn, user } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { updateSong, deleteSong } = useSongMutations()
  const { addNotification } = useNotification()
  
  // Check permissions
  const isOwner = user?.id === song.metadata.createdBy
  const isAdmin = user?.role === 'ADMIN'
  const canEdit = isSignedIn && (isOwner || isAdmin)
  const canDelete = isSignedIn && (isOwner || isAdmin)
  
  if (!canEdit && !canDelete) return null
  
  const handleUpdate = async (data: SongFormData) => {
    setIsSubmitting(true)
    
    try {
      const updatedSong = await updateSong(song.id, data)
      
      addNotification({
        type: 'success',
        title: 'Song updated successfully',
        message: `"${updatedSong.title}" has been updated`
      })
      
      onUpdate?.(updatedSong)
      setShowEditModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to update song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await deleteSong(song.id)
      
      addNotification({
        type: 'success',
        title: 'Song deleted',
        message: `"${song.title}" has been removed from the songbook`
      })
      
      onDelete?.(song.id)
      setShowDeleteConfirm(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to delete song',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsDeleting(false)
    }
  }
  
  const actionContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  }
  
  const buttonStyles: React.CSSProperties = {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s'
  }
  
  const editButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    color: '#3b82f6'
  }
  
  const deleteButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    color: '#ef4444'
  }
  
  const confirmDialogStyles: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    maxWidth: '400px'
  }
  
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999
  }
  
  return (
    <>
      <div style={actionContainerStyles}>
        {canEdit && (
          <button
            onClick={() => setShowEditModal(true)}
            style={editButtonStyles}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#eff6ff'
              e.currentTarget.style.borderColor = '#3b82f6'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = '#e2e8f0'
            }}
            aria-label={`Edit ${song.title}`}
            disabled={isSubmitting}
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        )}
        
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={deleteButtonStyles}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#fef2f2'
              e.currentTarget.style.borderColor = '#ef4444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = '#e2e8f0'
            }}
            aria-label={`Delete ${song.title}`}
            disabled={isDeleting}
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        )}
      </div>
      
      {showEditModal && (
        <SongFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdate}
          song={song}
          isSubmitting={isSubmitting}
        />
      )}
      
      {showDeleteConfirm && (
        <>
          <div style={overlayStyles} onClick={() => setShowDeleteConfirm(false)} />
          <div style={confirmDialogStyles} role="alertdialog">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Delete Song
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>
              Are you sure you want to delete "{song.title}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
```

### Phase 4: Update Existing Components

```typescript
// Updates to src/shared/components/Layout.tsx
import { AddSongButton } from '@features/songs/components/ui/AddSongButton'

export function Layout({ children }: { children: React.ReactNode }) {
  // ... existing code ...
  
  return (
    <div style={layoutStyles}>
      <header style={headerStyles}>
        <div style={headerContentStyles}>
          <h1 style={titleStyles}>HSA Songbook</h1>
          
          <nav style={navStyles}>
            {/* ... existing navigation ... */}
          </nav>
          
          <div style={actionsStyles}>
            <AddSongButton />
            {/* ... existing user menu ... */}
          </div>
        </div>
      </header>
      
      <main style={mainStyles}>
        {children}
      </main>
    </div>
  )
}

// Updates to src/features/songs/components/SongCard.tsx
import { SongActions } from './ui/SongActions'

interface SongCardProps {
  song: Song
  onUpdate?: (song: Song) => void
  onDelete?: (songId: string) => void
}

export function SongCard({ song, onUpdate, onDelete }: SongCardProps) {
  // ... existing card rendering ...
  
  return (
    <div style={cardStyles}>
      {/* ... existing song content ... */}
      
      <SongActions 
        song={song}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  )
}

// Updates to src/features/songs/components/SongList.tsx
export function SongList() {
  const { songs, setSongs } = useSongs()
  
  const handleSongUpdate = (updatedSong: Song) => {
    setSongs(prev => prev.map(s => 
      s.id === updatedSong.id ? updatedSong : s
    ))
  }
  
  const handleSongDelete = (songId: string) => {
    setSongs(prev => prev.filter(s => s.id !== songId))
  }
  
  return (
    <div style={listStyles}>
      {songs.map(song => (
        <SongCard
          key={song.id}
          song={song}
          onUpdate={handleSongUpdate}
          onDelete={handleSongDelete}
        />
      ))}
    </div>
  )
}
```

### Phase 5: App-level Integration

```typescript
// Updates to src/app/App.tsx
import { NotificationProvider } from '@shared/components/notifications'

function App() {
  // ... existing code ...
  
  return (
    <ErrorBoundary level="app">
      <NotificationProvider>
        <BrowserRouter>
          <Layout>
            {/* ... existing routes ... */}
          </Layout>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  )
}
```

### Phase 6: Comprehensive Tests

```typescript
// src/features/songs/components/ui/__tests__/AddSongButton.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddSongButton } from '../AddSongButton'

// Mock dependencies
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    isSignedIn: true,
    user: { id: 'test-user', role: 'USER' }
  })
}))

vi.mock('@features/songs/hooks/mutations/useSongMutations', () => ({
  useSongMutations: () => ({
    createSong: vi.fn().mockResolvedValue({ 
      id: '123', 
      title: 'Test Song',
      slug: 'test-song'
    })
  })
}))

describe('AddSongButton', () => {
  it('renders when user is signed in', () => {
    render(<AddSongButton />)
    expect(screen.getByRole('button', { name: /add new song/i })).toBeInTheDocument()
  })
  
  it('opens modal when clicked', async () => {
    const user = userEvent.setup()
    render(<AddSongButton />)
    
    await user.click(screen.getByRole('button', { name: /add new song/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/add new song/i)).toBeInTheDocument()
    })
  })
  
  it('shows success notification on successful creation', async () => {
    const user = userEvent.setup()
    render(<AddSongButton />)
    
    await user.click(screen.getByRole('button', { name: /add new song/i }))
    
    // Fill form and submit
    await user.type(screen.getByLabelText(/title/i), 'Test Song')
    await user.click(screen.getByRole('button', { name: /create song/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/song created successfully/i)).toBeInTheDocument()
    })
  })
})

// src/features/songs/components/ui/__tests__/SongActions.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SongActions } from '../SongActions'

const mockSong = {
  id: '123',
  title: 'Test Song',
  metadata: { createdBy: 'test-user' }
}

describe('SongActions', () => {
  it('shows edit and delete buttons for owner', () => {
    vi.mock('@features/auth/hooks/useAuth', () => ({
      useAuth: () => ({
        isSignedIn: true,
        user: { id: 'test-user', role: 'USER' }
      })
    }))
    
    render(<SongActions song={mockSong} />)
    
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
  
  it('shows buttons for admin even if not owner', () => {
    vi.mock('@features/auth/hooks/useAuth', () => ({
      useAuth: () => ({
        isSignedIn: true,
        user: { id: 'other-user', role: 'ADMIN' }
      })
    }))
    
    render(<SongActions song={mockSong} />)
    
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
  
  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup()
    render(<SongActions song={mockSong} />)
    
    await user.click(screen.getByRole('button', { name: /delete/i }))
    
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
  })
})
```

## Validation Gates

### Level 1: Type Checking & Linting
```bash
npm run lint
npm run type-check
```

### Level 2: Component Tests
```bash
npm run test -- src/features/songs/components/ui/
npm run test -- src/shared/components/notifications/
```

### Level 3: Integration Tests
```bash
npm run test -- --run --coverage
```

### Level 4: E2E User Flows
- [ ] Click plus button in header
- [ ] Fill and submit form
- [ ] See success notification
- [ ] Edit existing song
- [ ] Delete song with confirmation
- [ ] Verify permission-based visibility

### Level 5: Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces notifications
- [ ] Focus management correct
- [ ] ARIA attributes present

## File Creation Order

1. `src/shared/components/notifications/Notification.types.ts`
2. `src/shared/components/notifications/NotificationProvider.tsx`
3. `src/shared/components/notifications/NotificationContainer.tsx`
4. `src/shared/components/notifications/useNotification.ts`
5. `src/shared/components/notifications/index.ts`
6. `src/features/songs/components/ui/AddSongButton.tsx`
7. `src/features/songs/components/ui/SongActions.tsx`
8. Update `Layout.tsx`, `SongCard.tsx`, `SongList.tsx`, `App.tsx`
9. Test files for all components

## Success Metrics

- ✅ Plus button visible in header
- ✅ Edit/delete buttons show for authorized users
- ✅ Modal opens/closes correctly
- ✅ Notifications display properly
- ✅ Actions complete successfully
- ✅ Permission checks work
- ✅ Loading states display
- ✅ Mobile responsive

## Common Pitfalls to Avoid

1. **Permission checks** - Always verify user permissions
2. **Race conditions** - Handle rapid button clicks
3. **Notification overflow** - Limit number of visible notifications
4. **Focus management** - Return focus after modal closes
5. **Memory leaks** - Clear notification timeouts
6. **Error boundaries** - Catch and display errors gracefully
7. **Loading states** - Disable buttons during operations

## External Resources

- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [React Notification Patterns](https://www.patterns.dev/posts/notifications)
- [Accessible Modal Dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Conclusion

This implementation seamlessly integrates song management into the UI with proper permissions, notifications, and user feedback, creating an intuitive and accessible experience.

**Confidence Score: 9.5/10** - Clear integration points with existing components and established patterns.