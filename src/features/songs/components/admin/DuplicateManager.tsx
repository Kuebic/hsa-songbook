import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { useSongs } from '@features/songs/hooks/useSongs'
import { findSimilarSongs } from '@features/songs/validation/utils/duplicateDetection'
import type { Song } from '@features/songs/types/song.types'
import type { SimilarSong } from '@features/songs/validation/utils/duplicateDetection'

interface DuplicateGroup {
  leadSong: Song
  duplicates: SimilarSong[]
  selectedForMerge: Set<string>
}

export function DuplicateManager() {
  const { isAdmin, getToken } = useAuth()
  const { addNotification } = useNotification()
  const { songs, loading } = useSongs()
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [mergeInProgress, setMergeInProgress] = useState<string | null>(null)
  const [showOnlyExact, setShowOnlyExact] = useState(false)
  
  // Find duplicate groups
  const foundGroups = useMemo(() => {
    if (!songs.length) return []
    
    const groups: DuplicateGroup[] = []
    const processed = new Set<string>()
    
    songs.forEach(song => {
      if (processed.has(song.id)) return
      
      const similar = findSimilarSongs(song.title, songs, song.artist)
        .filter(s => {
          const matchesFilter = showOnlyExact ? s.similarity === 'exact' : 
                               (s.similarity === 'exact' || s.similarity === 'very-similar')
          return matchesFilter && s.song.id !== song.id
        })
      
      if (similar.length > 0) {
        groups.push({
          leadSong: song,
          duplicates: similar,
          selectedForMerge: new Set<string>()
        })
        
        // Mark all songs in this group as processed
        processed.add(song.id)
        similar.forEach(s => processed.add(s.song.id))
      }
    })
    
    return groups.sort((a, b) => b.duplicates.length - a.duplicates.length)
  }, [songs, showOnlyExact])
  
  useEffect(() => {
    setDuplicateGroups(foundGroups)
  }, [foundGroups])
  
  if (!isAdmin) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#ef4444'
      }}>
        <h2>Access Denied</h2>
        <p>Administrator privileges required to access duplicate management.</p>
      </div>
    )
  }
  
  const handleMerge = async (groupIndex: number, keepId: string, mergeIds: string[]) => {
    if (mergeIds.length === 0) return
    
    setMergeInProgress(keepId)
    
    try {
      const response = await fetch('/api/v1/admin/merge-songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
          'x-user-role': 'ADMIN'
        },
        body: JSON.stringify({ keepId, mergeIds })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to merge songs')
      }
      
      addNotification({
        type: 'success',
        title: 'Songs merged successfully',
        message: `${mergeIds.length} duplicate(s) have been merged into the primary song`
      })
      
      // Remove merged group from state
      setDuplicateGroups(prev => prev.filter((_, index) => index !== groupIndex))
      
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Merge failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setMergeInProgress(null)
    }
  }
  
  const toggleSelection = (groupIndex: number, songId: string) => {
    setDuplicateGroups(prev => prev.map((group, index) => {
      if (index !== groupIndex) return group
      
      const newSelected = new Set(group.selectedForMerge)
      if (newSelected.has(songId)) {
        newSelected.delete(songId)
      } else {
        newSelected.add(songId)
      }
      
      return { ...group, selectedForMerge: newSelected }
    }))
  }
  
  const selectAll = (groupIndex: number) => {
    setDuplicateGroups(prev => prev.map((group, index) => {
      if (index !== groupIndex) return group
      
      const allDuplicateIds = group.duplicates.map(d => d.song.id)
      return { ...group, selectedForMerge: new Set(allDuplicateIds) }
    }))
  }
  
  const clearSelection = (groupIndex: number) => {
    setDuplicateGroups(prev => prev.map((group, index) => {
      if (index !== groupIndex) return group
      return { ...group, selectedForMerge: new Set() }
    }))
  }
  
  const getSimilarityColor = (similarity: string) => {
    switch (similarity) {
      case 'exact': return '#ef4444'
      case 'very-similar': return '#f59e0b'
      case 'similar': return '#10b981'
      default: return '#6b7280'
    }
  }
  
  const containerStyles: React.CSSProperties = {
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }
  
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e2e8f0'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1e293b'
  }
  
  const filterStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }
  
  const groupStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0'
  }
  
  const songItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    marginBottom: '8px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease'
  }
  
  const leadSongStyles: React.CSSProperties = {
    ...songItemStyles,
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    fontWeight: 600
  }
  
  const actionButtonStyles: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  }
  
  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ marginBottom: '12px', fontSize: '16px' }}>🔍 Analyzing songs for duplicates...</div>
          <div style={{ fontSize: '14px' }}>This may take a moment</div>
        </div>
      </div>
    )
  }
  
  if (duplicateGroups.length === 0) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h2 style={titleStyles}>Duplicate Song Manager</h2>
          <div style={filterStyles}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={showOnlyExact}
                onChange={e => setShowOnlyExact(e.target.checked)}
              />
              Show only exact matches
            </label>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>No duplicate songs detected!</div>
          <div style={{ fontSize: '14px' }}>
            {showOnlyExact ? 'Try unchecking "Show only exact matches" to see similar songs' : 'Your song library is clean'}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>
          Duplicate Song Manager ({duplicateGroups.length} groups found)
        </h2>
        
        <div style={filterStyles}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showOnlyExact}
              onChange={e => setShowOnlyExact(e.target.checked)}
            />
            Show only exact matches
          </label>
        </div>
      </div>
      
      {duplicateGroups.map((group, groupIndex) => (
        <div key={group.leadSong.id} style={groupStyles}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              color: '#1e293b',
              margin: 0
            }}>
              Group: "{group.leadSong.title}"
              <span style={{ 
                fontSize: '14px', 
                color: '#64748b', 
                fontWeight: 400,
                marginLeft: '8px'
              }}>
                ({group.duplicates.length} duplicates)
              </span>
            </h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => selectAll(groupIndex)}
                style={{
                  ...actionButtonStyles,
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
              >
                Select All
              </button>
              <button
                onClick={() => clearSelection(groupIndex)}
                style={{
                  ...actionButtonStyles,
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db'
                }}
              >
                Clear
              </button>
            </div>
          </div>
          
          {/* Lead song (keep this one) */}
          <div style={leadSongStyles}>
            <div style={{ marginRight: '12px' }}>
              <span style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                KEEP
              </span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                <strong>{group.leadSong.title}</strong>
                {group.leadSong.artist && <span style={{ color: '#64748b' }}> by {group.leadSong.artist}</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {group.leadSong.metadata.views} views • Created {new Date(group.leadSong.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Duplicate songs */}
          {group.duplicates.map(({ song, similarity, distance }) => (
            <div
              key={song.id}
              style={{
                ...songItemStyles,
                backgroundColor: group.selectedForMerge.has(song.id) ? '#fef2f2' : 'white',
                border: group.selectedForMerge.has(song.id) ? '1px solid #fca5a5' : '1px solid #e2e8f0'
              }}
            >
              <div style={{ marginRight: '12px' }}>
                <input
                  type="checkbox"
                  checked={group.selectedForMerge.has(song.id)}
                  onChange={() => toggleSelection(groupIndex, song.id)}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                  {song.title}
                  {song.artist && <span style={{ color: '#64748b' }}> by {song.artist}</span>}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span>{song.metadata.views} views</span>
                  <span>•</span>
                  <span>Created {new Date(song.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span style={{ 
                    color: getSimilarityColor(similarity),
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}>
                    {similarity.replace('-', ' ')} (distance: {distance})
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Merge actions */}
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {group.selectedForMerge.size} song(s) selected for merge
            </div>
            
            <button
              onClick={() => {
                const selected = Array.from(group.selectedForMerge)
                if (selected.length > 0) {
                  const confirmMessage = `Merge ${selected.length} duplicate song(s) into "${group.leadSong.title}"?\n\n` +
                                       `This action cannot be undone. The duplicate songs will be permanently deleted ` +
                                       `and their data will be merged into the primary song.`
                  
                  if (confirm(confirmMessage)) {
                    handleMerge(groupIndex, group.leadSong.id, selected)
                  }
                }
              }}
              disabled={group.selectedForMerge.size === 0 || mergeInProgress === group.leadSong.id}
              style={{
                ...actionButtonStyles,
                backgroundColor: group.selectedForMerge.size > 0 && mergeInProgress !== group.leadSong.id ? '#ef4444' : '#9ca3af',
                color: 'white',
                cursor: group.selectedForMerge.size > 0 && mergeInProgress !== group.leadSong.id ? 'pointer' : 'not-allowed'
              }}
            >
              {mergeInProgress === group.leadSong.id ? (
                <>⟳ Merging...</>
              ) : (
                `Merge ${group.selectedForMerge.size > 0 ? `(${group.selectedForMerge.size})` : ''}`
              )}
            </button>
          </div>
        </div>
      ))}
      
      {/* Summary */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '14px', color: '#92400e' }}>
          <strong>⚠️ Warning:</strong> Merging songs is permanent and cannot be undone. 
          The duplicate songs will be deleted and their metadata (views, ratings, etc.) will be combined with the primary song.
        </div>
      </div>
    </div>
  )
}