export const SONG_SOURCES = [
  'Traditional-Holy',
  'New-Holy',
  'American-Pioneer',
  'Adapted-Secular',
  'Secular-General',
  'Contemporary-Christian',
  'Classic-Hymn',
  'Original-Interchurch',
  'Modern-Worship',
  'Gospel',
  'Spiritual',
  'Custom-Arrangement'
] as const

export type SongSource = typeof SONG_SOURCES[number]

// Source metadata for display and categorization
export const SOURCE_METADATA: Record<SongSource, { label: string; category: string }> = {
  'Traditional-Holy': { label: 'Traditional Holy', category: 'Traditional' },
  'New-Holy': { label: 'New Holy', category: 'Modern' },
  'American-Pioneer': { label: 'American Pioneer', category: 'Traditional' },
  'Adapted-Secular': { label: 'Adapted from Secular', category: 'Adapted' },
  'Secular-General': { label: 'Secular General', category: 'Secular' },
  'Contemporary-Christian': { label: 'Contemporary Christian', category: 'Modern' },
  'Classic-Hymn': { label: 'Classic Hymn', category: 'Traditional' },
  'Original-Interchurch': { label: 'Original Interchurch', category: 'Original' },
  'Modern-Worship': { label: 'Modern Worship', category: 'Modern' },
  'Gospel': { label: 'Gospel', category: 'Traditional' },
  'Spiritual': { label: 'Spiritual', category: 'Traditional' },
  'Custom-Arrangement': { label: 'Custom Arrangement', category: 'Custom' }
}

// Get sources by category
export function getSourcesByCategory(category: string): SongSource[] {
  return SONG_SOURCES.filter(
    source => SOURCE_METADATA[source].category === category
  )
}

// Categories for grouping
export const SOURCE_CATEGORIES = Array.from(
  new Set(Object.values(SOURCE_METADATA).map(meta => meta.category))
).sort()