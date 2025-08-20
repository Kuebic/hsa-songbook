import { useNavigate } from 'react-router-dom'
import { useSongManagementModal } from '../hooks/useSongManagementModal'
import { SongManagementModal } from '../components/SongManagementModal'
import { useSongs } from '../hooks/useSongs'
import type { Song } from '../types/song.types'

/**
 * Example implementation of the Song Management feature
 * This demonstrates how to integrate the song management form into a page
 */
export function SongManagementExample() {
  const navigate = useNavigate()
  const { songs, loading: isLoading } = useSongs()
  const { 
    isOpen, 
    selectedSong, 
    openCreateModal, 
    openEditModal, 
    closeModal 
  } = useSongManagementModal()
  
  const handleSongSuccess = (song: Song) => {
    console.log('Song saved successfully:', song)
    // Navigate to the song detail page
    navigate(`/songs/${song.slug}`)
  }
  
  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white'
  }
  
  const cardStyles: React.CSSProperties = {
    padding: '1rem',
    border: '1px solid var(--border-color, #d1d5db)',
    borderRadius: '8px',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--color-card)',
    transition: 'box-shadow 0.2s'
  }
  
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading songs...
      </div>
    )
  }
  
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Song Management</h1>
        <button
          onClick={openCreateModal}
          style={buttonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
          }}
        >
          Add New Song
        </button>
      </div>
      
      {/* Example Song List */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Existing Songs</h2>
        {!songs || songs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>
            No songs yet. Click "Add New Song" to get started!
          </p>
        ) : (
          <div>
            {(songs || []).slice(0, 10).map((song: Song) => (
              <div 
                key={song.id} 
                style={cardStyles}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem' }}>
                    {song.title}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {song.artist || 'Unknown Artist'}
                    {song.compositionYear && ` • ${song.compositionYear}`}
                  </p>
                  {song.themes && song.themes.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {song.themes.slice(0, 3).map((theme: string) => (
                        <span
                          key={theme}
                          style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: 'var(--color-accent, #e0f2fe)',
                            color: 'var(--text-accent, #0369a1)',
                            borderRadius: '12px',
                            fontSize: '0.75rem'
                          }}
                        >
                          {theme}
                        </span>
                      ))}
                      {song.themes.length > 3 && (
                        <span style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '0.75rem' 
                        }}>
                          +{song.themes.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openEditModal(song)}
                  style={{
                    ...buttonStyles,
                    backgroundColor: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#3b82f6'
                  }}
                >
                  Edit
                </button>
              </div>
            ))}
            {songs.length > 10 && (
              <p style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                marginTop: '1rem' 
              }}>
                Showing 10 of {songs.length} songs
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Song Management Modal */}
      <SongManagementModal
        isOpen={isOpen}
        onClose={closeModal}
        song={selectedSong}
        onSuccess={handleSongSuccess}
      />
    </div>
  )
}