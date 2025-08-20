import type { Arrangement } from '../../types/song.types'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'

export function createOptimisticArrangement(
  formData: ArrangementFormData,
  userId: string
): Arrangement {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const slug = `temp-${formData.name.toLowerCase().replace(/\s+/g, '-')}`
  
  return {
    id: tempId,
    name: formData.name,
    slug: formData.slug || slug,
    songIds: formData.songIds || [],
    key: formData.key || '',
    tempo: formData.tempo,
    timeSignature: formData.timeSignature || '4/4',
    difficulty: (formData.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
    tags: formData.tags || [],
    chordData: formData.chordData || formData.chordProText || '',
    description: formData.description,
    notes: formData.notes,
    capo: formData.capo,
    duration: formData.duration,
    createdBy: userId,
    metadata: {
      isPublic: true, // Default for now
      views: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function updateOptimisticArrangement(
  existing: Arrangement,
  updates: Partial<ArrangementFormData>
): Arrangement {
  // Convert form data updates to arrangement data
  const arrangementUpdates: Partial<Arrangement> = {}
  
  if (updates.name !== undefined) arrangementUpdates.name = updates.name
  if (updates.slug !== undefined) arrangementUpdates.slug = updates.slug
  if (updates.key !== undefined) arrangementUpdates.key = updates.key
  if (updates.tempo !== undefined) arrangementUpdates.tempo = updates.tempo
  if (updates.timeSignature !== undefined) arrangementUpdates.timeSignature = updates.timeSignature
  if (updates.difficulty !== undefined) arrangementUpdates.difficulty = updates.difficulty as 'beginner' | 'intermediate' | 'advanced'
  if (updates.tags !== undefined) arrangementUpdates.tags = updates.tags
  if (updates.chordData !== undefined) arrangementUpdates.chordData = updates.chordData
  if (updates.chordProText !== undefined) arrangementUpdates.chordData = updates.chordProText
  if (updates.description !== undefined) arrangementUpdates.description = updates.description
  if (updates.notes !== undefined) arrangementUpdates.notes = updates.notes
  if (updates.capo !== undefined) arrangementUpdates.capo = updates.capo
  if (updates.duration !== undefined) arrangementUpdates.duration = updates.duration
  if (updates.songIds !== undefined) arrangementUpdates.songIds = updates.songIds
  
  return {
    ...existing,
    ...arrangementUpdates,
    updatedAt: new Date().toISOString()
  }
}

export function isOptimisticArrangement(arrangement: Arrangement): boolean {
  return arrangement.id.startsWith('temp-')
}

export function replaceOptimisticArrangement(
  arrangements: Arrangement[],
  tempId: string,
  realArrangement: Arrangement
): Arrangement[] {
  return arrangements.map(arrangement => 
    arrangement.id === tempId ? realArrangement : arrangement
  )
}

export function removeOptimisticArrangement(
  arrangements: Arrangement[],
  tempId: string
): Arrangement[] {
  return arrangements.filter(arrangement => arrangement.id !== tempId)
}