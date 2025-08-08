import { createContext } from 'react'
import type { ModalContextValue } from './types/modal.types'

export const ModalContext = createContext<ModalContextValue | null>(null)