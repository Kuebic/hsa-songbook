/**
 * Type-only tests to ensure arrangement types are properly defined
 * These tests verify type compatibility and structure
 */

import type {
  ArrangementWithTitle,
  CreateArrangementPayload,
  UpdateArrangementPayload,
  ArrangementFormState,
  ArrangementValidationErrors,
  ArrangementManagementFormProps,
  ArrangementSearchParams,
  ArrangementSearchResponse,
  ArrangementRow,
  ArrangementInsert,
  ArrangementUpdate,
  ArrangementFieldName,
  ArrangementDifficulty,
  ArrangementModalMode
} from '../arrangement.types'

import type { Arrangement } from '../song.types'

// Test that arrangement types extend base Arrangement correctly
const testArrangementWithTitle: ArrangementWithTitle = {
  id: 'test-id',
  name: 'Test Arrangement',
  slug: 'test-arrangement',
  songIds: ['song-1'],
  key: 'C', // Required field
  tempo: 120,
  timeSignature: '4/4',
  difficulty: 'intermediate',
  tags: ['acoustic', 'contemporary'],
  chordData: '{title: Test Song}',
  description: 'A test arrangement',
  notes: 'Some notes',
  capo: 2,
  duration: 240,
  createdBy: 'user-123',
  metadata: {
    isPublic: true,
    views: 0
  },
  title: 'Amazing Grace - Test Arrangement', // Auto-generated title
  songTitle: 'Amazing Grace',
  songArtist: 'Traditional'
}

// Test that ArrangementWithTitle is compatible with base Arrangement
const baseArrangement: Arrangement = testArrangementWithTitle

// Test CreateArrangementPayload structure
const createPayload: CreateArrangementPayload = {
  name: 'New Arrangement',
  songIds: ['song-1'],
  key: 'G', // Required for transposition
  tempo: 140,
  difficulty: 'beginner',
  tags: ['worship'],
  chordProText: '{title: Test}\n[C]Amazing grace',
  metadata: {
    isPublic: true
  }
}

// Test UpdateArrangementPayload structure
const updatePayload: UpdateArrangementPayload = {
  id: 'arrangement-123',
  name: 'Updated Name',
  key: 'D',
  tempo: 130
}

// Test form state structure
const formState: ArrangementFormState = {
  name: 'Test Form',
  key: 'C',
  tempo: '120', // String for form input
  timeSignature: '4/4',
  difficulty: 'intermediate',
  tags: ['tag1', 'tag2'],
  chordProText: '',
  description: '',
  notes: '',
  capo: '0', // String for form input
  duration: '240', // String for form input
  isPublic: true,
  isMashup: false,
  mashupSections: []
}

// Test validation errors structure
const validationErrors: ArrangementValidationErrors = {
  name: 'Name is required',
  key: 'Please select a key',
  tempo: 'Invalid tempo',
  general: 'Some general error'
}

// Test component props structure
const formProps: ArrangementManagementFormProps = {
  songId: 'song-123',
  song: {
    id: 'song-123',
    title: 'Amazing Grace',
    artist: 'Traditional'
  },
  onSuccess: (arrangement) => {
    // arrangement should be of type Arrangement
    console.log(arrangement.id)
  },
  onCancel: () => {},
  isModal: true,
  showAdvancedOptions: false
}

// Test search parameters
const searchParams: ArrangementSearchParams = {
  query: 'amazing',
  songId: 'song-123',
  key: 'C',
  difficulty: 'intermediate',
  tags: ['worship'],
  tempoRange: { min: 80, max: 140 },
  timeSignature: '4/4',
  page: 1,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc'
}

// Test search response
const searchResponse: ArrangementSearchResponse = {
  arrangements: [testArrangementWithTitle],
  total: 1,
  page: 1,
  pages: 1,
  hasMore: false
}

// Test database mapping types
const dbRow: ArrangementRow = {
  id: 'arr-123',
  name: 'Test DB Row',
  slug: 'test-db-row',
  song_ids: ['song-1'],
  key: 'C',
  tempo: 120,
  time_signature: '4/4',
  difficulty: 'intermediate',
  tags: ['acoustic'],
  chord_data: '{title: Test}',
  chord_pro_text: null,
  description: null,
  notes: null,
  capo: null,
  duration: null,
  created_by: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  metadata: {
    is_public: true,
    views: 0
  }
}

const dbInsert: ArrangementInsert = {
  name: 'New Arrangement',
  slug: 'new-arrangement',
  song_ids: ['song-1'],
  key: 'G',
  difficulty: 'beginner',
  created_by: 'user-123'
}

const dbUpdate: ArrangementUpdate = {
  name: 'Updated Arrangement',
  key: 'D',
  tempo: 130
}

// Test union types
const fieldName: ArrangementFieldName = 'name'
const difficulty: ArrangementDifficulty = 'advanced'
const modalMode: ArrangementModalMode = 'edit'

// Type assertion tests to ensure proper inheritance
type _TestCreatePayloadRequiredKey = CreateArrangementPayload['key'] // Should be string (required)
type _TestFormStateStringFields = ArrangementFormState['tempo'] // Should be string
type _TestArrangementWithTitleExtends = ArrangementWithTitle extends Arrangement ? true : false // Should be true

// Ensure compilation
export const arrangementTypesTests = {
  testArrangementWithTitle,
  baseArrangement,
  createPayload,
  updatePayload,
  formState,
  validationErrors,
  formProps,
  searchParams,
  searchResponse,
  dbRow,
  dbInsert,
  dbUpdate,
  fieldName,
  difficulty,
  modalMode
}

export {}