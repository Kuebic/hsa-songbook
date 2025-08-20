// Song Data Hooks
export { useSongs, useSong } from './useSongs'
export { useSongMutations } from './useSongMutations'

// Song Management Hooks
export { useSongManagementModal } from './useSongManagementModal'
export { useInlineEdit } from './useInlineEdit'

// Arrangement Management Hooks
export { useArrangementManagementModal } from './useArrangementManagementModal'

// Arrangement Hooks
export { useArrangements } from './useArrangements'
export { useArrangement, useArrangementBySlug } from './useArrangement'
export { useArrangementManager } from './useArrangementManager'

// Song Mutation Hooks
export { useCreateSong } from './mutations/useCreateSong'
export { useUpdateSong } from './mutations/useUpdateSong'
export { useDeleteSong } from './mutations/useDeleteSong'
export { useRateSong } from './mutations/useRateSong'

// Arrangement Mutation Hooks
export { useCreateArrangement } from './mutations/useCreateArrangement'
export { useUpdateArrangement } from './mutations/useUpdateArrangement'
export { useDeleteArrangement } from './mutations/useDeleteArrangement'
export { useRateArrangement } from './mutations/useRateArrangement'

// Re-export all mutation hooks
export * from './mutations/useSongMutations'
export * from './mutations/useArrangementMutations'