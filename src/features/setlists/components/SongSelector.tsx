import type { Song } from '@features/songs'

interface SongSelectorProps {
  availableSongs: Song[]
  onSelectSong: (song: Song) => void
}

export function SongSelector({ availableSongs, onSelectSong }: SongSelectorProps) {
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Select a song to add:</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {availableSongs.map(song => (
          <div
            key={song.id}
            onClick={() => onSelectSong(song)}
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              border: '1px solid #e2e8f0'
            }}
          >
            <strong>{song.title}</strong> - {song.artist}
          </div>
        ))}
      </div>
    </div>
  )
}