import { useRef, useEffect, useId, useCallback } from 'react'
import { useModalFocus } from './hooks/useModalFocus'
import { useModal } from './hooks/useModal'
import type { ModalProps } from './types/modal.types'

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'medium',
  closeOnEsc = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  testId = 'modal',
  animationDuration = 200,
  initialFocusRef,
  finalFocusRef
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const modalId = useId()
  const { registerModal, unregisterModal, isTopModal } = useModal()
  
  // Focus management
  useModalFocus({
    isOpen,
    dialogRef,
    initialFocusRef,
    finalFocusRef
  })
  
  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    
    if (isOpen) {
      dialog.showModal()
      registerModal(modalId)
    } else {
      // Animate out before closing
      dialog.style.animation = `modalFadeOut ${animationDuration}ms ease-out`
      setTimeout(() => {
        dialog.close()
        dialog.style.animation = ''
      }, animationDuration)
      unregisterModal(modalId)
    }
    
    return () => {
      unregisterModal(modalId)
    }
  }, [isOpen, modalId, animationDuration, registerModal, unregisterModal])
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }, [closeOnOverlayClick, onClose])
  
  // Handle ESC key
  const handleCancel = useCallback((e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault() // Prevent default close
    if (closeOnEsc && isTopModal(modalId)) {
      onClose()
    }
  }, [closeOnEsc, isTopModal, modalId, onClose])
  
  const sizeStyles: Record<typeof size, React.CSSProperties> = {
    small: { maxWidth: '400px', width: '90%' },
    medium: { maxWidth: '600px', width: '90%' },
    large: { maxWidth: '900px', width: '90%' },
    fullscreen: { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }
  }
  
  const styles: React.CSSProperties = {
    ...sizeStyles[size],
    padding: '24px',
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    animation: isOpen ? `modalFadeIn ${animationDuration}ms ease-out` : undefined,
    backgroundColor: 'var(--color-card)',
    color: 'var(--text-primary)',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '90vh',
    overflow: 'auto'
  }
  
  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes modalFadeOut {
          from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
        }
        
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.5);
          animation: backdropFadeIn ${animationDuration}ms ease-out;
        }
      `}</style>
      
      <dialog
        ref={dialogRef}
        style={styles}
        className={className}
        onClick={handleBackdropClick}
        onCancel={handleCancel}
        aria-labelledby={title ? `${testId}-title` : undefined}
        aria-describedby={description ? `${testId}-description` : undefined}
        aria-label={!title ? 'Dialog' : undefined}
        aria-modal="true"
        data-testid={testId}
      >
        <div onClick={e => e.stopPropagation()}>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
                color: 'var(--text-secondary)'
              }}
              aria-label="Close dialog"
              data-testid={`${testId}-close`}
            >
              ×
            </button>
          )}
          
          {title && (
            <h2 
              id={`${testId}-title`}
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              {title}
            </h2>
          )}
          
          {description && (
            <p 
              id={`${testId}-description`}
              style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}
            >
              {description}
            </p>
          )}
          
          {children}
        </div>
      </dialog>
    </>
  )
}