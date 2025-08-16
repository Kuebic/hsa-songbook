import { useState, useCallback, useMemo } from 'react'
import { Modal } from '@shared/components/modal'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { useSetlists } from '../../hooks/queries/useSetlistsQuery'
import { useCreateSetlist } from '../../hooks/mutations/useCreateSetlist'
import type { Arrangement } from '@features/songs'
import type { Setlist, SetlistArrangement } from '../../types/setlist.types'

interface SetlistSelectorModalProps {
  arrangement: Arrangement
  isOpen: boolean
  onClose: () => void
  onSelect: (setlistId: string, options?: Partial<SetlistArrangement>) => Promise<void>
}

export function SetlistSelectorModal({
  arrangement,
  isOpen,
  onClose,
  onSelect
}: SetlistSelectorModalProps) {
  const { userId } = useAuth()
  const { addNotification } = useNotification()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSetlistName, setNewSetlistName] = useState('')
  const [selectedSetlists, setSelectedSetlists] = useState<Set<string>>(new Set())

  const { data: setlistsData, isLoading } = useSetlists({ 
    userId: 'me',
    searchQuery: searchQuery || undefined
  })
  const createSetlist = useCreateSetlist()

  // Filter and sort setlists
  const filteredSetlists = useMemo(() => {
    if (!setlistsData?.content) return []
    
    return setlistsData.content
      .filter(setlist => 
        !searchQuery || 
        setlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by: already contains arrangement, then by name
        const aContains = a.arrangements.some(arr => arr.arrangementId === arrangement.id)
        const bContains = b.arrangements.some(arr => arr.arrangementId === arrangement.id)
        
        if (aContains && !bContains) return -1
        if (!aContains && bContains) return 1
        return a.name.localeCompare(b.name)
      })
  }, [setlistsData?.content, searchQuery, arrangement.id])

  const handleSetlistSelect = useCallback(async (setlist: Setlist) => {
    const alreadyInSetlist = setlist.arrangements.some(arr => arr.arrangementId === arrangement.id)
    
    if (alreadyInSetlist) {
      addNotification({
        type: 'info',
        title: 'Already in setlist',
        message: `"${arrangement.name}" is already in "${setlist.name}"`
      })
      return
    }

    try {
      await onSelect(setlist.id, {
        order: setlist.arrangements.length, // Add at the end
        addedAt: new Date(),
        addedBy: userId || ''
      })
      
      addNotification({
        type: 'success',
        title: 'Added to setlist',
        message: `"${arrangement.name}" was added to "${setlist.name}"`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to add',
        message: error instanceof Error ? error.message : 'An error occurred'
      })
    }
  }, [arrangement, onSelect, addNotification, userId])

  const handleCreateAndAdd = useCallback(async () => {
    if (!newSetlistName.trim()) {
      addNotification({
        type: 'error',
        title: 'Invalid name',
        message: 'Please enter a setlist name'
      })
      return
    }

    try {
      const newSetlist = await createSetlist.mutateAsync({
        name: newSetlistName.trim(),
        isPublic: true,
        arrangements: []
      })

      // Add arrangement to the new setlist
      await onSelect(newSetlist.id, {
        order: 0,
        addedAt: new Date(),
        addedBy: userId || ''
      })

      addNotification({
        type: 'success',
        title: 'Setlist created',
        message: `"${newSetlistName}" was created and "${arrangement.name}" was added`
      })

      setNewSetlistName('')
      setShowCreateForm(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to create',
        message: error instanceof Error ? error.message : 'An error occurred'
      })
    }
  }, [newSetlistName, createSetlist, onSelect, arrangement, addNotification, userId])

  const handleBulkAdd = useCallback(async () => {
    if (selectedSetlists.size === 0) return

    const promises = Array.from(selectedSetlists).map(async setlistId => {
      const setlist = filteredSetlists.find(s => s.id === setlistId)
      if (!setlist) return

      const alreadyInSetlist = setlist.arrangements.some(arr => arr.arrangementId === arrangement.id)
      if (alreadyInSetlist) return

      return onSelect(setlistId, {
        order: setlist.arrangements.length,
        addedAt: new Date(),
        addedBy: userId || ''
      })
    })

    try {
      await Promise.all(promises)
      addNotification({
        type: 'success',
        title: 'Added to setlists',
        message: `"${arrangement.name}" was added to ${selectedSetlists.size} setlist${selectedSetlists.size !== 1 ? 's' : ''}`
      })
      setSelectedSetlists(new Set())
    } catch (_error) {
      addNotification({
        type: 'error',
        title: 'Some additions failed',
        message: 'Please try again'
      })
    }
  }, [selectedSetlists, filteredSetlists, arrangement, onSelect, addNotification, userId])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Setlist"
      description={`Add "${arrangement.name}" to your setlists`}
      size="medium"
    >
      <div className="space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search setlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Create new setlist option */}
        <div className="border-b pb-4">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-md border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create new setlist
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter setlist name..."
                value={newSetlistName}
                onChange={(e) => setNewSetlistName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateAndAdd()
                  } else if (e.key === 'Escape') {
                    setShowCreateForm(false)
                    setNewSetlistName('')
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newSetlistName.trim() || createSetlist.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createSetlist.isPending ? 'Creating...' : 'Create & Add'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewSetlistName('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk actions */}
        {selectedSetlists.size > 0 && (
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedSetlists.size} setlist{selectedSetlists.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkAdd}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add to Selected
                </button>
                <button
                  onClick={() => setSelectedSetlists(new Set())}
                  className="px-3 py-1 text-blue-600 text-sm hover:bg-blue-100 rounded"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Setlist list */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading setlists...</div>
          ) : filteredSetlists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No setlists found matching your search' : 'No setlists found'}
            </div>
          ) : (
            filteredSetlists.map((setlist) => {
              const alreadyInSetlist = setlist.arrangements.some(arr => arr.arrangementId === arrangement.id)
              const isSelected = selectedSetlists.has(setlist.id)
              
              return (
                <div
                  key={setlist.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    alreadyInSetlist 
                      ? 'bg-green-50 border-green-200' 
                      : isSelected
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1"
                      onClick={() => {
                        if (!alreadyInSetlist) {
                          if (selectedSetlists.size > 0) {
                            // In bulk mode, toggle selection
                            const newSelected = new Set(selectedSetlists)
                            if (isSelected) {
                              newSelected.delete(setlist.id)
                            } else {
                              newSelected.add(setlist.id)
                            }
                            setSelectedSetlists(newSelected)
                          } else {
                            // Single add mode
                            handleSetlistSelect(setlist)
                          }
                        }
                      }}
                    >
                      <div className="flex items-center">
                        {selectedSetlists.size > 0 && !alreadyInSetlist && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mr-3"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{setlist.name}</h3>
                          {setlist.description && (
                            <p className="text-sm text-gray-600 mt-1">{setlist.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{setlist.arrangements.length} song{setlist.arrangements.length !== 1 ? 's' : ''}</span>
                            {setlist.isPublic && <span>Public</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-3">
                      {alreadyInSetlist ? (
                        <div className="flex items-center text-green-600">
                          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">Added</span>
                        </div>
                      ) : selectedSetlists.size === 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSetlists(new Set([setlist.id]))
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select Multiple
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}