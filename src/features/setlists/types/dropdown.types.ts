import type { Setlist } from './setlist.types'
import type { Arrangement } from '../../songs/types/song.types'

/**
 * Props for the AddToSetlistDropdown component
 */
export interface AddToSetlistDropdownProps {
  /** The arrangement to add to setlists */
  arrangement: Arrangement
  /** Visual variant of the trigger button */
  variant?: 'icon' | 'button' | 'text'
  /** Size of the trigger button */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Callback when arrangement is successfully added */
  onSuccess?: (setlist: Setlist) => void
  /** Callback when dropdown opens */
  onOpen?: () => void
  /** Callback when dropdown closes */
  onClose?: () => void
}

/**
 * State for the dropdown component
 */
export interface DropdownState {
  /** Whether the dropdown is open */
  isOpen: boolean
  /** Current search query */
  searchQuery: string
  /** Whether the create form is showing */
  isCreating: boolean
  /** Currently focused item index for keyboard navigation */
  focusedIndex: number
  /** Set of selected setlist IDs (for bulk operations) */
  selectedSetlists: Set<string>
}

/**
 * Extended setlist with arrangement status
 */
export interface SetlistWithStatus extends Setlist {
  /** Whether this setlist contains the current arrangement */
  containsArrangement: boolean
  /** Relative time since last update */
  lastModifiedRelative: string
  /** Number of arrangements in the setlist */
  arrangementCount: number
}

/**
 * Props for the SetlistItem component
 */
export interface SetlistItemProps {
  /** The setlist to display */
  setlist: SetlistWithStatus
  /** Whether this item is currently focused */
  isFocused: boolean
  /** Whether this item is selected (for bulk operations) */
  isSelected?: boolean
  /** Click handler */
  onClick: () => void
  /** Mouse enter handler for focus */
  onMouseEnter?: () => void
  /** Whether to show selection checkbox */
  showCheckbox?: boolean
}

/**
 * Form data for creating a new setlist
 */
export interface CreateSetlistFormData {
  /** Name of the new setlist */
  name: string
  /** Optional description */
  description?: string
  /** Whether the setlist should be public */
  isPublic: boolean
  /** Whether to immediately add the arrangement */
  addArrangement: boolean
}

/**
 * Props for the CreateSetlistForm component
 */
export interface CreateSetlistFormProps {
  /** Submit handler */
  onSubmit: (data: CreateSetlistFormData) => Promise<void>
  /** Cancel handler */
  onCancel: () => void
  /** Whether the form is submitting */
  isSubmitting?: boolean
  /** Error message to display */
  error?: string
}

/**
 * Options for adding an arrangement to a setlist
 */
export interface AddToSetlistOptions {
  /** Position in the setlist */
  order?: number
  /** Custom key override */
  keyOverride?: string
  /** Custom capo override */
  capoOverride?: number
  /** Custom tempo override */
  tempoOverride?: number
  /** Notes about this arrangement in this setlist */
  notes?: string
  /** Expected duration in seconds */
  duration?: number
  /** Timestamp when added */
  addedAt: Date
  /** User ID who added it */
  addedBy: string
}

/**
 * Return type for the useAddToSetlistDropdown hook
 */
export interface UseAddToSetlistDropdownReturn {
  /** List of setlists with status */
  setlists: SetlistWithStatus[] | undefined
  /** Whether setlists are loading */
  isLoadingSetlists: boolean
  /** Error from loading setlists */
  setlistsError: Error | null
  /** Add arrangement to a setlist */
  addToSetlist: (setlistId: string, options?: Partial<AddToSetlistOptions>) => Promise<void>
  /** Create a new setlist with the arrangement */
  createWithArrangement: (data: CreateSetlistFormData) => Promise<Setlist>
  /** Whether currently adding to a setlist */
  isAdding: boolean
  /** Whether currently creating a setlist */
  isCreating: boolean
  /** Refetch setlists */
  refetchSetlists: () => void
}