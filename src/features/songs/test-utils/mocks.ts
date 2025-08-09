import { vi } from 'vitest'

// Centralized mock functions
export const mockCheckDuplicates = vi.fn()
export const mockClearDuplicates = vi.fn()

// Duplicate detection mock object
export const mockDuplicateDetection = {
  duplicates: [],
  isChecking: false,
  error: null,
  checkDuplicates: mockCheckDuplicates,
  clearDuplicates: mockClearDuplicates,
  hasExactMatch: false,
  hasSimilar: false
}

// Reset function for beforeEach
export function resetDuplicateDetectionMocks() {
  mockCheckDuplicates.mockClear()
  mockClearDuplicates.mockClear()
  mockDuplicateDetection.duplicates = []
  mockDuplicateDetection.hasExactMatch = false
  mockDuplicateDetection.hasSimilar = false
}