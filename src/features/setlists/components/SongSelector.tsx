import type { Arrangement } from '@features/songs'

interface ArrangementSelectorProps {
  availableArrangements: Arrangement[]
  onSelectArrangement: (arrangement: Arrangement) => void
}

export function SongSelector({ availableArrangements, onSelectArrangement }: ArrangementSelectorProps) {
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'var(--color-secondary)',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Select an arrangement to add:</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {availableArrangements.map(arrangement => (
          <div
            key={arrangement.id}
            onClick={() => onSelectArrangement(arrangement)}
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              backgroundColor: 'var(--color-card)',
              borderRadius: '4px',
              cursor: 'pointer',
              border: '1px solid var(--color-border)'
            }}
          >
            <strong>{arrangement.name}</strong> - Key: {arrangement.key}
          </div>
        ))}
      </div>
    </div>
  )
}