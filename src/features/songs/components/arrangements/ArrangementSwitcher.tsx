import type { Arrangement } from '../../types/song.types'

interface ArrangementSwitcherProps {
  arrangements: Arrangement[]
  selectedId?: string
  onSelect: (id: string) => void
  loading?: boolean
}

export function ArrangementSwitcher({ 
  arrangements, 
  selectedId, 
  onSelect,
  loading = false
}: ArrangementSwitcherProps) {
  // Use tabs for ≤4 arrangements, dropdown for >4
  const useTabView = arrangements.length <= 4
  
  if (loading) {
    return (
      <div style={{ 
        padding: '0.75rem',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        Loading arrangements...
      </div>
    )
  }
  
  if (arrangements.length === 0) {
    return null
  }
  
  // If only one arrangement, don't show switcher
  if (arrangements.length === 1) {
    return null
  }
  
  const getArrangementLabel = (arr: Arrangement) => {
    if (arr.name) {
      return arr.name
    }
    const parts = []
    if (arr.key) parts.push(arr.key)
    if (arr.difficulty) parts.push(arr.difficulty)
    if (arr.tempo) parts.push(`${arr.tempo} BPM`)
    return parts.length > 0 ? parts.join(' • ') : 'Untitled Arrangement'
  }
  
  if (useTabView) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}
        role="tablist"
        aria-label="Select arrangement"
      >
        {arrangements.map(arr => (
          <button
            key={arr.id}
            onClick={() => onSelect(arr.id)}
            role="tab"
            aria-selected={selectedId === arr.id}
            aria-controls={`arrangement-panel-${arr.id}`}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedId === arr.id ? '#3b82f6' : '#f3f4f6',
              color: selectedId === arr.id ? 'white' : '#374151',
              border: selectedId === arr.id ? '1px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: selectedId === arr.id ? 500 : 400,
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedId !== arr.id) {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedId !== arr.id) {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {getArrangementLabel(arr)}
          </button>
        ))}
      </div>
    )
  }
  
  // Dropdown view for more than 4 arrangements
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label 
        htmlFor="arrangement-select"
        style={{
          display: 'block',
          marginBottom: '0.25rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#374151'
        }}
      >
        Select Arrangement
      </label>
      <select
        id="arrangement-select"
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        style={{
          width: '100%',
          maxWidth: '300px',
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #d1d5db',
          backgroundColor: 'white',
          fontSize: '0.875rem',
          color: '#374151',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 7l3 3 3-3' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '20px'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db'
          e.currentTarget.style.boxShadow = 'none'
        }}
        aria-label="Select arrangement"
      >
        {arrangements.map(arr => (
          <option key={arr.id} value={arr.id}>
            {getArrangementLabel(arr)}
          </option>
        ))}
      </select>
    </div>
  )
}