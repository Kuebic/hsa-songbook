// Main modal component
export { Modal } from './Modal'

// Provider for nested modals
export { ModalProvider } from './ModalProvider'

// Hooks
export { useModal } from './hooks/useModal'
export { useModalFocus } from './hooks/useModalFocus'

// Types
export type { 
  ModalProps, 
  ModalContextValue,
  UseModalFocusOptions 
} from './types/modal.types'