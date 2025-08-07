import type { Setlist } from '../types/setlist.types'
import { SetlistCard } from './SetlistCard'

interface SetlistGridProps {
  title: string
  setlists: Setlist[]
  onSetlistClick: (setlist: Setlist) => void
  onDelete?: (id: string) => void
}

export function SetlistGrid({ title, setlists, onSetlistClick, onDelete }: SetlistGridProps) {
  if (setlists.length === 0) return null

  return (
    <>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{title}</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {setlists.map(setlist => (
          <SetlistCard
            key={setlist.id}
            setlist={setlist}
            onClick={onSetlistClick}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  )
}