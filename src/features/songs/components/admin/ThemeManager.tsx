import { useState, useMemo } from 'react'
import { useAuth } from '@features/auth'
import { useNotification } from '@shared/components/notifications'
import { useSongs } from '@features/songs/hooks/useSongs'
import { FormInput } from '@shared/components/form'
import { normalizeTheme } from '@features/songs/validation/utils/themeNormalization'

interface ThemeStats {
  theme: string
  count: number
  songs: Array<{ id: string; title: string }>
  variations: string[]
}

export function ThemeManager() {
  const { isAdmin, getToken } = useAuth()
  const { addNotification } = useNotification()
  const { songs, loading, refreshSongs } = useSongs()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<ThemeStats | null>(null)
  const [newThemeName, setNewThemeName] = useState('')
  const [operationInProgress, setOperationInProgress] = useState(false)
  
  // Analyze themes across all songs
  const themeAnalysis = useMemo(() => {
    const themeMap = new Map<string, ThemeStats>()
    
    songs.forEach(song => {
      song.themes.forEach(theme => {
        const normalized = normalizeTheme(theme)
        
        if (!themeMap.has(normalized)) {
          themeMap.set(normalized, {
            theme: normalized,
            count: 0,
            songs: [],
            variations: []
          })
        }
        
        const stats = themeMap.get(normalized)!
        stats.count++
        stats.songs.push({ id: song.id, title: song.title })
        
        // Track variations of the theme name
        if (!stats.variations.includes(theme)) {
          stats.variations.push(theme)
        }
      })
    })
    
    return Array.from(themeMap.values())
      .sort((a, b) => b.count - a.count)
  }, [songs])
  
  // Filter themes based on search
  const filteredThemes = useMemo(() => {
    if (!searchTerm) return themeAnalysis
    
    return themeAnalysis.filter(stats => 
      stats.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stats.variations.some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [themeAnalysis, searchTerm])
  
  if (!isAdmin) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#ef4444'
      }}>
        <h2>Access Denied</h2>
        <p>Administrator privileges required to access theme management.</p>
      </div>
    )
  }
  
  const handleMergeThemes = async (fromThemes: string[], toTheme: string) => {
    if (fromThemes.length === 0 || !toTheme.trim()) return
    
    setOperationInProgress(true)
    
    try {
      const token = await getToken()
      const response = await fetch('/api/v1/admin/merge-themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-role': 'ADMIN'
        },
        body: JSON.stringify({
          fromThemes,
          toTheme: normalizeTheme(toTheme)
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to merge themes')
      }
      
      const result = await response.json()
      
      addNotification({
        type: 'success',
        title: 'Themes merged successfully',
        message: `Merged ${fromThemes.length} theme variation(s) affecting ${result.affectedSongs} songs`
      })
      
      setSelectedTheme(null)
      setNewThemeName('')
      refreshSongs()
      
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Theme merge failed',
        message: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setOperationInProgress(false)
    }
  }
  
  const handleDeleteTheme = async (theme: string) => {
    if (!confirm(`Delete theme "${theme}" from all songs? This action cannot be undone.`)) {
      return
    }
    
    setOperationInProgress(true)
    
    try {
      const token = await getToken()
      const response = await fetch('/api/v1/admin/delete-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-role': 'ADMIN'
        },
        body: JSON.stringify({ theme })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete theme')
      }
      
      const result = await response.json()
      
      addNotification({
        type: 'success',
        title: 'Theme deleted successfully',
        message: `Removed "${theme}" from ${result.affectedSongs} songs`
      })
      
      setSelectedTheme(null)
      refreshSongs()
      
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Theme deletion failed',
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
  
  const mainContentStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: selectedTheme ? '1fr 400px' : '1fr',
    gap: '24px'
  }
  
  const themeListStyles: React.CSSProperties = {
    maxHeight: '600px',
    overflowY: 'auto'
  }
  
  const themeItemStyles = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
    borderRadius: '6px',
    marginBottom: '8px',
    border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  })
  
  const detailPanelStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  }
  
  const buttonStyles = (variant: 'primary' | 'danger' = 'primary'): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: operationInProgress ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    opacity: operationInProgress ? 0.6 : 1,
    backgroundColor: variant === 'danger' ? '#ef4444' : '#3b82f6',
    color: 'white'
  })
  
  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading theme data...
        </div>
      </div>
    )
  }
  
  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h2 style={titleStyles}>Theme Vocabulary Manager</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Manage and normalize theme names across your song library. Found <strong>{themeAnalysis.length}</strong> unique themes.
        </p>
      </div>
      
      <div style={mainContentStyles}>
        {/* Theme List */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <FormInput
              label="Search themes"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by theme name..."
            />
          </div>
          
          <div style={themeListStyles}>
            {filteredThemes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#64748b'
              }}>
                {searchTerm ? 'No themes match your search' : 'No themes found'}
              </div>
            ) : (
              filteredThemes.map(themeStats => (
                <div
                  key={themeStats.theme}
                  style={themeItemStyles(selectedTheme?.theme === themeStats.theme)}
                  onClick={() => setSelectedTheme(
                    selectedTheme?.theme === themeStats.theme ? null : themeStats
                  )}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      {themeStats.theme}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {themeStats.count} song{themeStats.count === 1 ? '' : 's'}
                      {themeStats.variations.length > 1 && (
                        <span style={{ 
                          marginLeft: '8px',
                          color: '#f59e0b',
                          fontWeight: 500
                        }}>
                          • {themeStats.variations.length} variations
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '24px', color: '#64748b' }}>
                    {themeStats.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Detail Panel */}
        {selectedTheme && (
          <div style={detailPanelStyles}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              marginBottom: '16px',
              color: '#1e293b'
            }}>
              Theme: "{selectedTheme.theme}"
            </h3>
            
            {/* Variations */}
            {selectedTheme.variations.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Variations found:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedTheme.variations.map(variation => (
                    <span
                      key={variation}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: variation === selectedTheme.theme ? '#dcfce7' : '#fef3c7',
                        color: variation === selectedTheme.theme ? '#166534' : '#92400e',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {variation}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Songs using this theme */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Songs using this theme ({selectedTheme.count}):
              </h4>
              <div style={{ 
                maxHeight: '150px', 
                overflowY: 'auto',
                fontSize: '12px',
                color: '#64748b'
              }}>
                {selectedTheme.songs.map(song => (
                  <div key={song.id} style={{ marginBottom: '4px' }}>
                    • {song.title}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            {selectedTheme.variations.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Normalize variations:
                </h4>
                <FormInput
                  label="New standardized theme name"
                  value={newThemeName}
                  onChange={e => setNewThemeName(e.target.value)}
                  placeholder={selectedTheme.theme}
                />
                <button
                  onClick={() => handleMergeThemes(
                    selectedTheme.variations.filter(v => v !== (newThemeName || selectedTheme.theme)),
                    newThemeName || selectedTheme.theme
                  )}
                  disabled={operationInProgress}
                  style={{
                    ...buttonStyles('primary'),
                    marginTop: '8px',
                    width: '100%'
                  }}
                >
                  {operationInProgress ? 'Processing...' : `Normalize ${selectedTheme.variations.length - 1} variation(s)`}
                </button>
              </div>
            )}
            
            {/* Delete theme */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#dc2626' }}>
                Danger Zone:
              </h4>
              <button
                onClick={() => handleDeleteTheme(selectedTheme.theme)}
                disabled={operationInProgress}
                style={{
                  ...buttonStyles('danger'),
                  width: '100%'
                }}
              >
                {operationInProgress ? 'Processing...' : `Delete theme from ${selectedTheme.count} song(s)`}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '14px', color: '#1e40af' }}>
          <strong>💡 Tips:</strong>
          <ul style={{ marginTop: '8px', marginLeft: '16px', lineHeight: '1.6' }}>
            <li>Click a theme to see details and manage variations</li>
            <li>Themes with multiple variations should be normalized</li>
            <li>Use consistent naming: lowercase, singular form (e.g., "grace" not "Grace" or "graces")</li>
            <li>All operations are permanent - be careful with deletions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}