export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  closeOnEsc?: boolean
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
  className?: string
  testId?: string
  animationDuration?: number
  initialFocusRef?: React.RefObject<HTMLElement>
  finalFocusRef?: React.RefObject<HTMLElement>
}

export interface ModalContextValue {
  openModals: Set<string>
  registerModal: (id: string) => void
  unregisterModal: (id: string) => void
  isTopModal: (id: string) => boolean
}

export interface UseModalFocusOptions {
  isOpen: boolean
  dialogRef: React.RefObject<HTMLDialogElement | null>
  initialFocusRef?: React.RefObject<HTMLElement>
  finalFocusRef?: React.RefObject<HTMLElement>
}