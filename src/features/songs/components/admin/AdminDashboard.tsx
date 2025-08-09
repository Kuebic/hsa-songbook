import { useState, useMemo } from 'react'
import { useAuth } from '@features/auth'
import { useSongs } from '@features/songs/hooks/useSongs'
import { findSimilarSongs } from '@features/songs/validation/utils/duplicateDetection'
import { normalizeTheme } from '@features/songs/validation/utils/themeNormalization'
import { DuplicateManager } from './DuplicateManager'
import { BulkOperations } from './BulkOperations'
import { ThemeManager } from './ThemeManager'

type AdminView = 'overview' | 'duplicates' | 'bulk-operations' | 'themes'

export function AdminDashboard() {
  const { isAdmin } = useAuth()
  const { songs, loading: songsLoading } = useSongs()
  const [currentView, setCurrentView] = useState<AdminView>('overview')
  
  // Calculate various statistics
  const stats = useMemo(() => {
    if (songsLoading || !songs.length) {
      return {
        totalSongs: 0,
        publicSongs: 0,
        privateSongs: 0,
        duplicateGroups: 0,
        totalThemes: 0,
        themeVariations: 0,
        recentSongs: 0,
        averageViews: 0
      }
    }
    
    // Basic counts
    const totalSongs = songs.length
    const publicSongs = songs.filter(s => s.metadata.isPublic).length
    const privateSongs = totalSongs - publicSongs
    
    // Find duplicates
    const duplicateGroups = new Set<string>()
    songs.forEach(song => {
      const similar = findSimilarSongs(song.title, songs, song.artist)
        .filter(s => s.similarity === 'exact' || s.similarity === 'very-similar')
      
      if (similar.length > 0) {
        // Create a sorted key for this duplicate group
        const groupKey = [song.id, ...similar.map(s => s.song.id)].sort().join(',')
        duplicateGroups.add(groupKey)
      }
    })
    
    // Theme analysis
    const allThemes = new Set<string>()
    const themeVariations = new Map<string, Set<string>>()
    
    songs.forEach(song => {
      song.themes.forEach(theme => {
        allThemes.add(theme)
        const normalized = normalizeTheme(theme)
        
        if (!themeVariations.has(normalized)) {
          themeVariations.set(normalized, new Set())
        }
        themeVariations.get(normalized)!.add(theme)
      })
    })
    
    const variationsCount = Array.from(themeVariations.values())
      .reduce((sum, variations) => sum + (variations.size > 1 ? variations.size - 1 : 0), 0)
    
    // Recent songs (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentSongs = songs.filter(song => 
      new Date(song.createdAt) > thirtyDaysAgo
    ).length
    
    // Average views
    const totalViews = songs.reduce((sum, song) => sum + song.metadata.views, 0)
    const averageViews = totalSongs > 0 ? Math.round(totalViews / totalSongs) : 0
    
    return {
      totalSongs,
      publicSongs,
      privateSongs,
      duplicateGroups: duplicateGroups.size,
      totalThemes: themeVariations.size,
      themeVariations: variationsCount,
      recentSongs,
      averageViews
    }
  }, [songs, songsLoading])
  
  if (!isAdmin) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#ef4444'
      }}>
        <h2>Access Denied</h2>
        <p>Administrator privileges required to access the admin dashboard.</p>
      </div>
    )
  }
  
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'duplicates', label: 'Duplicates', icon: '🔍', badge: stats.duplicateGroups > 0 ? stats.duplicateGroups : undefined },
    { id: 'bulk-operations', label: 'Bulk Operations', icon: '⚡' },
    { id: 'themes', label: 'Theme Manager', icon: '🏷️', badge: stats.themeVariations > 0 ? stats.themeVariations : undefined }
  ] as const
  
  const containerStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '250px 1fr',
    gap: '24px',
    minHeight: '600px'
  }
  
  const sidebarStyles: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0'
  }
  
  const contentStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }
  
  const navItemStyles = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? 'white' : '#374151',
    marginBottom: '8px'
  })
  
  const statCardStyles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  }
  
  const renderOverview = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Manage your song library, handle duplicates, and maintain data quality.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={statCardStyles}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b82f6' }}>
            {songsLoading ? '...' : stats.totalSongs}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Total Songs
          </div>
        </div>
        
        <div style={statCardStyles}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981' }}>
            {songsLoading ? '...' : stats.publicSongs}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Public Songs
          </div>
        </div>
        
        <div style={statCardStyles}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>
            {songsLoading ? '...' : stats.privateSongs}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Private Songs
          </div>
        </div>
        
        <div style={statCardStyles}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 700, 
            color: stats.duplicateGroups > 0 ? '#ef4444' : '#10b981'
          }}>
            {songsLoading ? '...' : stats.duplicateGroups}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Duplicate Groups
          </div>
        </div>
        
        <div style={statCardStyles}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#8b5cf6' }}>
            {songsLoading ? '...' : stats.totalThemes}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Unique Themes
          </div>
        </div>
        
        <div style={statCardStyles}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 700, 
            color: stats.themeVariations > 0 ? '#f59e0b' : '#10b981'
          }}>
            {songsLoading ? '...' : stats.themeVariations}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Theme Variations
          </div>
        </div>
        
        <div style={statCardStyles}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#06b6d4' }}>
            {songsLoading ? '...' : stats.recentSongs}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Recent Songs (30d)
          </div>
        </div>
        
        <div style={statCardStyles}>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#64748b' }}>
            {songsLoading ? '...' : stats.averageViews}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Avg Views/Song
          </div>
        </div>
      </div>
      
      {/* Action Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          ...statCardStyles,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          ':hover': { transform: 'translateY(-2px)' }
        }} onClick={() => setCurrentView('duplicates')}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🔍</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              Duplicate Manager
            </h3>
            {stats.duplicateGroups > 0 && (
              <span style={{
                marginLeft: 'auto',
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {stats.duplicateGroups}
              </span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Find and merge duplicate songs to keep your library clean.
          </p>
        </div>
        
        <div style={{
          ...statCardStyles,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }} onClick={() => setCurrentView('bulk-operations')}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>⚡</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              Bulk Operations
            </h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Perform bulk actions on multiple songs at once.
          </p>
        </div>
        
        <div style={{
          ...statCardStyles,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }} onClick={() => setCurrentView('themes')}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🏷️</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
              Theme Manager
            </h3>
            {stats.themeVariations > 0 && (
              <span style={{
                marginLeft: 'auto',
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {stats.themeVariations}
              </span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Standardize and manage theme vocabulary across your library.
          </p>
        </div>
      </div>
      
      {/* System Health */}
      <div style={{
        marginTop: '32px',
        padding: '20px',
        backgroundColor: stats.duplicateGroups > 0 || stats.themeVariations > 0 ? '#fef3c7' : '#dcfce7',
        border: `1px solid ${stats.duplicateGroups > 0 || stats.themeVariations > 0 ? '#fcd34d' : '#a3e635'}`,
        borderRadius: '8px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '8px',
          color: stats.duplicateGroups > 0 || stats.themeVariations > 0 ? '#92400e' : '#365314'
        }}>
          {stats.duplicateGroups > 0 || stats.themeVariations > 0 ? '⚠️ Maintenance Needed' : '✅ System Health Good'}
        </h3>
        <div style={{ 
          fontSize: '14px', 
          color: stats.duplicateGroups > 0 || stats.themeVariations > 0 ? '#92400e' : '#365314'
        }}>
          {stats.duplicateGroups > 0 && (
            <div>• {stats.duplicateGroups} duplicate group(s) need attention</div>
          )}
          {stats.themeVariations > 0 && (
            <div>• {stats.themeVariations} theme variation(s) could be normalized</div>
          )}
          {stats.duplicateGroups === 0 && stats.themeVariations === 0 && (
            <div>Your song library is well-maintained with no duplicates or theme inconsistencies.</div>
          )}
        </div>
      </div>
    </div>
  )
  
  const renderContent = () => {
    switch (currentView) {
      case 'duplicates':
        return <DuplicateManager />
      case 'bulk-operations':
        return <BulkOperations />
      case 'themes':
        return <ThemeManager />
      default:
        return renderOverview()
    }
  }
  
  return (
    <div style={containerStyles}>
      {/* Sidebar Navigation */}
      <div style={sidebarStyles}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '16px',
          color: '#1e293b'
        }}>
          Admin Tools
        </h3>
        
        {navigationItems.map(item => (
          <div
            key={item.id}
            style={navItemStyles(currentView === item.id)}
            onClick={() => setCurrentView(item.id as AdminView)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            
            {item.badge && (
              <span style={{
                backgroundColor: currentView === item.id ? 'rgba(255, 255, 255, 0.2)' : '#ef4444',
                color: currentView === item.id ? 'white' : 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 500
              }}>
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div style={contentStyles}>
        {renderContent()}
      </div>
    </div>
  )
}