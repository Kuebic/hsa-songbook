import { useState, useMemo } from 'react'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { useSongs } from '@features/songs/hooks/useSongs'
import { FormInput, FormSelect, FormCheckbox } from '@shared/components/form'
// import type { Song } from '@features/songs/types/song.types' // Temporarily commented out

interface BulkOperationResult {
  success: number
  failed: number
  errors: string[]
}

export function BulkOperations() {
  const { isAdmin, getToken } = useAuth()
  const { addNotification } = useNotification()
  const { songs, loading, refreshSongs } = useSongs()
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())
  const [operationInProgress, setOperationInProgress] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [themeFilter, setThemeFilter] = useState('')
  const [isPublicFilter, setIsPublicFilter] = useState<'all' | 'public' | 'private'>('all')
  
  // Filter songs based on criteria
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      const matchesSearch = !searchFilter || 
        song.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        song.artist?.toLowerCase().includes(searchFilter.toLowerCase())
      
      const matchesTheme = !themeFilter || 
        song.themes.some(theme => theme.toLowerCase().includes(themeFilter.toLowerCase()))
      
      const matchesPublic = isPublicFilter === 'all' ||
        (isPublicFilter === 'public' && song.metadata.isPublic) ||
        (isPublicFilter === 'private' && !song.metadata.isPublic)
      
      return matchesSearch && matchesTheme && matchesPublic
    })
  }, [songs, searchFilter, themeFilter, isPublicFilter])
  
  // Get unique themes from all songs
  const allThemes = useMemo(() => {
    const themes = new Set<string>()
    songs.forEach(song => {
      song.themes.forEach(theme => themes.add(theme))
    })
    return Array.from(themes).sort()
  }, [songs])
  
  if (!isAdmin) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#ef4444'
      }}>
        <h2>Access Denied</h2>
        <p>Administrator privileges required to access bulk operations.</p>
      </div>
    )
  }
  
  const handleSelectAll = () => {
    if (selectedSongs.size === filteredSongs.length) {
      // Deselect all
      setSelectedSongs(new Set())
    } else {
      // Select all filtered songs
      setSelectedSongs(new Set(filteredSongs.map(song => song.id)))
    }
  }
  
  const handleSelectSong = (songId: string) => {
    const newSelected = new Set(selectedSongs)
    if (newSelected.has(songId)) {
      newSelected.delete(songId)
    } else {
      newSelected.add(songId)
    }
    setSelectedSongs(newSelected)
  }
  
  const executeBulkOperation = async (
    operation: 'delete' | 'make-public' | 'make-private' | 'update-theme',
    data?: Record<string, unknown>
  ): Promise<BulkOperationResult> => {
    const token = await getToken()
    const selectedArray = Array.from(selectedSongs)
    const results: BulkOperationResult = { success: 0, failed: 0, errors: [] }
    
    for (const songId of selectedArray) {
      try {
        let response: Response
        
        switch (operation) {
          case 'delete':
            response = await fetch(`/api/v1/songs/${songId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'x-user-role': 'ADMIN'
              }
            })
            break
            
          case 'make-public':
          case 'make-private':
            response = await fetch(`/api/v1/songs/${songId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-user-role': 'ADMIN'
              },
              body: JSON.stringify({
                isPublic: operation === 'make-public'
              })
            })
            break
            
          case 'update-theme':
            response = await fetch(`/api/v1/songs/${songId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-user-role': 'ADMIN'
              },
              body: JSON.stringify({
                themes: data.themes
              })
            })
            break
            
          default:
            throw new Error(`Unknown operation: ${operation}`)
        }
        
        if (response.ok) {
          results.success++
        } else {
          const error = await response.json().catch(() => ({ message: 'Unknown error' }))
          results.failed++
          results.errors.push(`Song ${songId}: ${error.message}`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`Song ${songId}: ${error instanceof Error ? error.message : 'Network error'}`)
      }
    }
    
    return results
  }
  
  const handleBulkDelete = async () => {
    if (selectedSongs.size === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedSongs.size} song(s)?\n\n` +
                          'This action cannot be undone and will permanently remove the songs from the database.'
    
    if (!confirm(confirmMessage)) return
    
    setOperationInProgress(true)
    
    try {
      const results = await executeBulkOperation('delete')
      
      if (results.success > 0) {
        addNotification({
          type: 'success',
          title: 'Bulk delete completed',
          message: `Successfully deleted ${results.success} song(s)`
        })
        
        setSelectedSongs(new Set())
        refreshSongs()
      }
      
      if (results.failed > 0) {
        addNotification({
          type: 'error',
          title: `${results.failed} deletion(s) failed`,
          message: results.errors.slice(0, 3).join(', ') + (results.errors.length > 3 ? '...' : '')
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Bulk delete failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setOperationInProgress(false)
    }
  }
  
  const handleBulkVisibility = async (makePublic: boolean) => {
    if (selectedSongs.size === 0) return
    
    const operation = makePublic ? 'make-public' : 'make-private'
    const action = makePublic ? 'public' : 'private'
    
    setOperationInProgress(true)
    
    try {
      const results = await executeBulkOperation(operation)
      
      if (results.success > 0) {
        addNotification({
          type: 'success',
          title: `Bulk update completed`,
          message: `Successfully made ${results.success} song(s) ${action}`
        })
        
        refreshSongs()
      }
      
      if (results.failed > 0) {
        addNotification({
          type: 'error',
          title: `${results.failed} update(s) failed`,
          message: results.errors.slice(0, 3).join(', ')
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Bulk update failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setOperationInProgress(false)
    }
  }
  
  const containerStyles: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }
  
  const headerStyles: React.CSSProperties = {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e2e8f0'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '8px'
  }
  
  const filtersStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  }
  
  const actionsStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca'
  }
  
  const buttonStyles = (variant: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties => {
    const variants = {
      primary: { backgroundColor: '#3b82f6', color: 'white' },
      secondary: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
      danger: { backgroundColor: '#ef4444', color: 'white' }
    }
    
    return {
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: operationInProgress ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      opacity: operationInProgress ? 0.6 : 1,
      ...variants[variant]
    }
  }
  
  const songItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    marginBottom: '8px',
    border: '1px solid #e2e8f0'
  }
  
  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading songs...
        </div>
      </div>
    )
  }
  
  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>Bulk Operations</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Select multiple songs to perform bulk actions. Use filters to narrow down your selection.
        </p>
      </div>
      
      {/* Filters */}
      <div style={filtersStyles}>
        <FormInput
          label="Search by title or artist"
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          placeholder="Enter search term..."
        />
        
        <FormSelect
          label="Filter by theme"
          value={themeFilter}
          onChange={e => setThemeFilter(e.target.value)}
        >
          <option value="">All themes</option>
          {allThemes.map(theme => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
        </FormSelect>
        
        <FormSelect
          label="Visibility"
          value={isPublicFilter}
          onChange={e => setIsPublicFilter(e.target.value as 'all' | 'public' | 'private')}
        >
          <option value="all">All songs</option>
          <option value="public">Public only</option>
          <option value="private">Private only</option>
        </FormSelect>
      </div>
      
      {/* Selection summary and actions */}
      {filteredSongs.length > 0 && (
        <div style={actionsStyles}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>{selectedSongs.size}</strong> of <strong>{filteredSongs.length}</strong> song(s) selected
              {searchFilter || themeFilter || isPublicFilter !== 'all' ? (
                <span style={{ color: '#64748b' }}> (filtered from {songs.length} total)</span>
              ) : null}
            </div>
            
            <FormCheckbox
              label={selectedSongs.size === filteredSongs.length ? 'Deselect all' : 'Select all filtered'}
              checked={selectedSongs.size === filteredSongs.length}
              onChange={handleSelectAll}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleBulkVisibility(true)}
              disabled={selectedSongs.size === 0 || operationInProgress}
              style={buttonStyles('primary')}
            >
              Make Public
            </button>
            
            <button
              onClick={() => handleBulkVisibility(false)}
              disabled={selectedSongs.size === 0 || operationInProgress}
              style={buttonStyles('secondary')}
            >
              Make Private
            </button>
            
            <button
              onClick={handleBulkDelete}
              disabled={selectedSongs.size === 0 || operationInProgress}
              style={buttonStyles('danger')}
            >
              {operationInProgress ? 'Processing...' : `Delete (${selectedSongs.size})`}
            </button>
          </div>
        </div>
      )}
      
      {/* Song list */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredSongs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No songs found</div>
            <div style={{ fontSize: '14px' }}>Try adjusting your filters</div>
          </div>
        ) : (
          filteredSongs.map(song => (
            <div key={song.id} style={songItemStyles}>
              <input
                type="checkbox"
                checked={selectedSongs.has(song.id)}
                onChange={() => handleSelectSong(song.id)}
                style={{ marginRight: '12px', transform: 'scale(1.2)' }}
              />
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                  <strong>{song.title}</strong>
                  {song.artist && <span style={{ color: '#64748b' }}> by {song.artist}</span>}
                  
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 500,
                    backgroundColor: song.metadata.isPublic ? '#dcfce7' : '#fef3c7',
                    color: song.metadata.isPublic ? '#166534' : '#92400e'
                  }}>
                    {song.metadata.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {song.themes.length > 0 && (
                    <>
                      Themes: {song.themes.slice(0, 3).join(', ')}
                      {song.themes.length > 3 && ` +${song.themes.length - 3} more`}
                      <span style={{ margin: '0 8px' }}>•</span>
                    </>
                  )}
                  {song.metadata.views} views
                  <span style={{ margin: '0 8px' }}>•</span>
                  Created {new Date(song.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Warning */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '14px', color: '#dc2626' }}>
          <strong>⚠️ Warning:</strong> Bulk operations are permanent and cannot be undone. 
          Double-check your selections before proceeding.
        </div>
      </div>
    </div>
  )
}