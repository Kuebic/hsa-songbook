import { describe, it, expect } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { ModalProvider } from './ModalProvider'
import { ModalContext } from './ModalContext'
import { useModal } from './hooks/useModal'
import { useContext } from 'react'

describe('ModalProvider', () => {
  describe('Context Provider', () => {
    it('provides modal context to children', () => {
      const TestComponent = () => {
        const context = useContext(ModalContext)
        return <div>{context ? 'Context available' : 'No context'}</div>
      }
      
      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      )
      
      expect(screen.getByText('Context available')).toBeInTheDocument()
    })
    
    it('provides default values when not wrapped in provider', () => {
      const { result } = renderHook(() => useModal())
      
      expect(result.current.openModals).toEqual(new Set())
      expect(result.current.isTopModal('any-id')).toBe(true)
      
      // Functions should be no-ops but not throw
      expect(() => result.current.registerModal('test')).not.toThrow()
      expect(() => result.current.unregisterModal('test')).not.toThrow()
    })
  })
  
  describe('Modal Registration', () => {
    it('registers and unregisters modals', () => {
      const { result } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      expect(result.current.openModals.size).toBe(0)
      
      act(() => {
        result.current.registerModal('modal1')
      })
      
      expect(result.current.openModals.has('modal1')).toBe(true)
      expect(result.current.openModals.size).toBe(1)
      
      act(() => {
        result.current.registerModal('modal2')
      })
      
      expect(result.current.openModals.has('modal2')).toBe(true)
      expect(result.current.openModals.size).toBe(2)
      
      act(() => {
        result.current.unregisterModal('modal1')
      })
      
      expect(result.current.openModals.has('modal1')).toBe(false)
      expect(result.current.openModals.has('modal2')).toBe(true)
      expect(result.current.openModals.size).toBe(1)
    })
    
    it('handles duplicate registrations', () => {
      const { result } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      act(() => {
        result.current.registerModal('modal1')
        result.current.registerModal('modal1')
      })
      
      expect(result.current.openModals.size).toBe(1)
    })
    
    it('handles unregistering non-existent modal', () => {
      const { result } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      expect(() => {
        act(() => {
          result.current.unregisterModal('non-existent')
        })
      }).not.toThrow()
      
      expect(result.current.openModals.size).toBe(0)
    })
  })
  
  describe('Modal Stack Management', () => {
    it('correctly identifies top modal', () => {
      const { result } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      act(() => {
        result.current.registerModal('modal1')
        result.current.registerModal('modal2')
        result.current.registerModal('modal3')
      })
      
      expect(result.current.isTopModal('modal3')).toBe(true)
      expect(result.current.isTopModal('modal2')).toBe(false)
      expect(result.current.isTopModal('modal1')).toBe(false)
      
      act(() => {
        result.current.unregisterModal('modal3')
      })
      
      expect(result.current.isTopModal('modal2')).toBe(true)
      expect(result.current.isTopModal('modal1')).toBe(false)
    })
    
    it('returns false for non-existent modal in isTopModal', () => {
      const { result } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      act(() => {
        result.current.registerModal('modal1')
      })
      
      expect(result.current.isTopModal('non-existent')).toBe(false)
    })
    
    it('handles empty modal stack', () => {
      const { result } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      expect(result.current.isTopModal('any-modal')).toBe(false)
    })
  })
  
  describe('Integration', () => {
    it('works with multiple consumers', () => {
      const TestComponent1 = () => {
        const { registerModal, openModals } = useModal()
        return (
          <div>
            <button onClick={() => registerModal('comp1-modal')}>
              Register Modal 1
            </button>
            <span>Count: {openModals.size}</span>
          </div>
        )
      }
      
      const TestComponent2 = () => {
        const { registerModal, openModals } = useModal()
        return (
          <div>
            <button onClick={() => registerModal('comp2-modal')}>
              Register Modal 2
            </button>
            <span>Count: {openModals.size}</span>
          </div>
        )
      }
      
      const { rerender } = render(
        <ModalProvider>
          <TestComponent1 />
          <TestComponent2 />
        </ModalProvider>
      )
      
      const counts = screen.getAllByText('Count: 0')
      expect(counts).toHaveLength(2)
      
      // Click first button
      const button1 = screen.getByText('Register Modal 1')
      button1.click()
      
      rerender(
        <ModalProvider>
          <TestComponent1 />
          <TestComponent2 />
        </ModalProvider>
      )
      
      const updatedCounts = screen.getAllByText('Count: 1')
      expect(updatedCounts).toHaveLength(2)
    })
    
    it('maintains order of modal registration', () => {
      const { result } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      const modalIds = ['modal-a', 'modal-b', 'modal-c', 'modal-d']
      
      act(() => {
        modalIds.forEach(id => result.current.registerModal(id))
      })
      
      const registeredModals = Array.from(result.current.openModals)
      expect(registeredModals).toEqual(modalIds)
      
      // Last registered should be top
      expect(result.current.isTopModal('modal-d')).toBe(true)
    })
  })
  
  describe('Memory Management', () => {
    it('cleans up properly when provider unmounts', () => {
      const { result, unmount } = renderHook(() => useModal(), {
        wrapper: ({ children }) => <ModalProvider>{children}</ModalProvider>
      })
      
      act(() => {
        result.current.registerModal('modal1')
        result.current.registerModal('modal2')
      })
      
      expect(result.current.openModals.size).toBe(2)
      
      unmount()
      
      // After unmount, the hook should use default implementation
      const { result: newResult } = renderHook(() => useModal())
      expect(newResult.current.openModals.size).toBe(0)
    })
  })
})