import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size as floatingSize,
  FloatingPortal,
} from '@floating-ui/react'
import { ListPlus, Plus, Search, Loader2 } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useAuth } from '@features/auth'
import { useAddToSetlistDropdown } from '../../hooks/mutations/useAddToSetlistDropdown'
import { SetlistItem } from './SetlistItem'
import { CreateSetlistForm } from './CreateSetlistForm'
import type { 
  AddToSetlistDropdownProps, 
  DropdownState,
  CreateSetlistFormData
} from '../../types/dropdown.types'
import './AddToSetlistDropdown.css'

/**
 * Dropdown component for adding arrangements to setlists
 * Provides quick access to user's setlists with search and creation capabilities
 */
export function AddToSetlistDropdown({
  arrangement,
  variant = 'button',
  className,
  onSuccess,
  onOpen,
  onClose
}: AddToSetlistDropdownProps) {
  const { isSignedIn } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  
  // Component state
  const [state, setState] = useState<DropdownState>({
    isOpen: false,
    searchQuery: '',
    isCreating: false,
    focusedIndex: -1,
    selectedSetlists: new Set()
  })
  
  // Data fetching and mutations
  const {
    setlists,
    isLoadingSetlists,
    addToSetlist,
    createWithArrangement,
    isCreating
  } = useAddToSetlistDropdown(arrangement)
  
  // Floating UI setup
  const { refs, floatingStyles } = useFloating({
    open: state.isOpen,
    onOpenChange: (open) => {
      setState(prev => ({ ...prev, isOpen: open }))
      if (open) {
        onOpen?.()
      } else {
        onClose?.()
        // Reset state when closing
        setState(prev => ({
          ...prev,
          searchQuery: '',
          focusedIndex: -1,
          isCreating: false
        }))
      }
    },
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
      }),
      shift({ 
        padding: 8,
        crossAxis: true,
      }),
      floatingSize({
        apply({ availableHeight, elements }: { availableHeight: number; elements: { floating: { style: CSSStyleDeclaration } } }) {
          const maxHeight = Math.min(availableHeight - 10, 400)
          Object.assign(elements.floating.style, {
            maxHeight: `${maxHeight}px`,
          })
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  })
  
  // Filter setlists based on search
  const filteredSetlists = useMemo(() => {
    if (!setlists) return []
    
    if (!state.searchQuery) return setlists
    
    const query = state.searchQuery.toLowerCase()
    return setlists.filter(setlist => 
      setlist.name.toLowerCase().includes(query) ||
      setlist.description?.toLowerCase().includes(query)
    )
  }, [setlists, state.searchQuery])
  
  // Click outside detection
  useEffect(() => {
    if (!state.isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setState(prev => ({ ...prev, isOpen: false }))
      }
    }
    
    // Delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [state.isOpen])
  
  // Handle adding to setlist
  const handleAddToSetlist = useCallback(async (setlistId: string) => {
    const setlist = setlists?.find(s => s.id === setlistId)
    if (!setlist) return
    
    try {
      await addToSetlist(setlistId)
      onSuccess?.(setlist)
      // Keep dropdown open for multiple additions
    } catch (_error) {
      // Error handled by mutation hook
    }
  }, [setlists, addToSetlist, onSuccess])
  
  // Keyboard navigation
  useEffect(() => {
    if (!state.isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setState(prev => ({ ...prev, isOpen: false }))
          triggerRef.current?.focus()
          break
          
        case 'ArrowDown':
          e.preventDefault()
          setState(prev => ({
            ...prev,
            focusedIndex: Math.min(
              prev.focusedIndex + 1,
              filteredSetlists.length
            )
          }))
          break
          
        case 'ArrowUp':
          e.preventDefault()
          setState(prev => ({
            ...prev,
            focusedIndex: Math.max(prev.focusedIndex - 1, 0)
          }))
          break
          
        case 'Enter':
          e.preventDefault()
          if (state.focusedIndex === 0) {
            // Create new setlist option
            setState(prev => ({ ...prev, isCreating: true }))
          } else if (state.focusedIndex > 0 && state.focusedIndex <= filteredSetlists.length) {
            // Select setlist
            const setlist = filteredSetlists[state.focusedIndex - 1]
            handleAddToSetlist(setlist.id)
          }
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.isOpen, state.focusedIndex, filteredSetlists, handleAddToSetlist])
  
  // Handle creating new setlist
  const handleCreateSetlist = useCallback(async (data: CreateSetlistFormData) => {
    try {
      const newSetlist = await createWithArrangement(data)
      setState(prev => ({ ...prev, isCreating: false }))
      if (data.addArrangement) {
        onSuccess?.(newSetlist)
      }
      // Keep dropdown open to see the new setlist
    } catch (_error) {
      // Error is handled in the hook
    }
  }, [createWithArrangement, onSuccess])
  
  // Handle auth redirect
  const handleAuthRedirect = useCallback(() => {
    const currentPath = window.location.pathname
    window.location.href = `/sign-in?redirect=${encodeURIComponent(currentPath)}`
  }, [])
  
  // Handle trigger click
  const handleTriggerClick = useCallback(() => {
    if (!isSignedIn) {
      handleAuthRedirect()
      return
    }
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }, [isSignedIn, handleAuthRedirect])
  
  // Render trigger button
  const renderTrigger = () => {
    const triggerClasses = cn(
      'add-to-setlist-trigger',
      `trigger-${variant}`,
      state.isOpen && 'trigger-open',
      className
    )
    
    const content = (
      <>
        <ListPlus className="trigger-icon" />
        {variant !== 'icon' && <span>Add to Setlist</span>}
      </>
    )
    
    return (
      <button
        ref={(node) => {
          triggerRef.current = node
          refs.setReference(node)
        }}
        className={triggerClasses}
        onClick={handleTriggerClick}
        aria-expanded={state.isOpen}
        aria-haspopup="listbox"
        aria-label="Add to setlist"
      >
        {content}
      </button>
    )
  }
  
  return (
    <>
      {renderTrigger()}
      
      {state.isOpen && (
        <FloatingPortal>
          <div
            ref={(node) => {
              dropdownRef.current = node
              refs.setFloating(node)
            }}
            style={floatingStyles}
            className="add-to-setlist-dropdown"
            role="listbox"
            aria-label="Select a setlist"
          >
            {/* Search field - show when more than 10 setlists */}
            {setlists && setlists.length > 10 && (
              <div className="dropdown-search">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search setlists..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    searchQuery: e.target.value,
                    focusedIndex: -1
                  }))}
                  aria-label="Search setlists"
                  autoFocus
                />
              </div>
            )}
            
            {/* Create new option */}
            <button
              className={cn(
                'dropdown-item create-new',
                state.focusedIndex === 0 && 'focused'
              )}
              onClick={() => setState(prev => ({ ...prev, isCreating: true }))}
              onMouseEnter={() => setState(prev => ({ ...prev, focusedIndex: 0 }))}
              role="option"
              aria-selected={state.focusedIndex === 0}
            >
              <Plus className="item-icon" />
              <span>Create new setlist</span>
            </button>
            
            {/* Divider */}
            {filteredSetlists.length > 0 && <div className="dropdown-divider" />}
            
            {/* Setlist items */}
            <div className="dropdown-list">
              {isLoadingSetlists ? (
                <div className="dropdown-loading">
                  <Loader2 className="loading-spinner" />
                  <span>Loading setlists...</span>
                </div>
              ) : filteredSetlists.length === 0 ? (
                <div className="dropdown-empty">
                  {state.searchQuery ? 'No setlists found' : 'No setlists yet'}
                </div>
              ) : (
                filteredSetlists.map((setlist, index) => (
                  <SetlistItem
                    key={setlist.id}
                    setlist={setlist}
                    isFocused={state.focusedIndex === index + 1}
                    onClick={() => handleAddToSetlist(setlist.id)}
                    onMouseEnter={() => setState(prev => ({ 
                      ...prev, 
                      focusedIndex: index + 1 
                    }))}
                  />
                ))
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
      
      {/* Create setlist form modal */}
      {state.isCreating && (
        <CreateSetlistForm
          onSubmit={handleCreateSetlist}
          onCancel={() => setState(prev => ({ ...prev, isCreating: false }))}
          isSubmitting={isCreating}
        />
      )}
    </>
  )
}