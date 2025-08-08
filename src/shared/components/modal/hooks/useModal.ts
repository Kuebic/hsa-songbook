import { useContext } from 'react'
import { ModalContext } from '../ModalContext'
import type { ModalContextValue } from '../types/modal.types'

export function useModal(): ModalContextValue {
  const context = useContext(ModalContext)
  if (!context) {
    // Provide default implementation if not wrapped in provider
    return {
      openModals: new Set<string>(),
      registerModal: () => {},
      unregisterModal: () => {},
      isTopModal: () => true
    }
  }
  return context
}