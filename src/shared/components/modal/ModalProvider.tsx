import { useState, useCallback } from 'react'
import { ModalContext } from './ModalContext'

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set())
  
  const registerModal = useCallback((id: string) => {
    setOpenModals(prev => new Set(prev).add(id))
  }, [])
  
  const unregisterModal = useCallback((id: string) => {
    setOpenModals(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])
  
  const isTopModal = useCallback((id: string) => {
    const modals = Array.from(openModals)
    return modals[modals.length - 1] === id
  }, [openModals])
  
  return (
    <ModalContext.Provider value={{ openModals, registerModal, unregisterModal, isTopModal }}>
      {children}
    </ModalContext.Provider>
  )
}