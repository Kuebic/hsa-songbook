import { useRef, useEffect, useId, useCallback } from 'react'
import { useModalFocus } from './hooks/useModalFocus'
import { useModal } from './hooks/useModal'
import { designTokens } from '@shared/styles/tokens'
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
      // Only show modal if it's not already open
      if (!dialog.open) {
        dialog.showModal()
      }
      registerModal(modalId)
      
      // Handle backdrop clicks
      const handleClick = (e: MouseEvent) => {
        if (closeOnOverlayClick && e.target === dialog) {
          // Click was on the dialog backdrop (outside the content)
          const rect = dialog.getBoundingClientRect()
          const clickedInDialog = (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          )
          
          // If click was outside the dialog bounds, it was on the backdrop
          if (!clickedInDialog) {
            onClose()
          }
        }
      }
      
      dialog.addEventListener('click', handleClick)
      
      return () => {
        dialog.removeEventListener('click', handleClick)
      }
    } else {
      // Only close if dialog is actually open
      if (dialog.open) {
        // Animate out before closing
        dialog.style.animation = `modalFadeOut ${animationDuration}ms ease-out`
        setTimeout(() => {
          if (dialog.open) {
            dialog.close()
          }
          dialog.style.animation = ''
        }, animationDuration)
      }
      unregisterModal(modalId)
    }
    
    return () => {
      unregisterModal(modalId)
    }
  }, [isOpen, modalId, animationDuration, registerModal, unregisterModal, closeOnOverlayClick, onClose])
  
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
    padding: '0', // Remove padding from dialog
    borderRadius: designTokens.radius.lg, // 12px for modern look
    border: 'none',
    boxShadow: designTokens.shadows.xl,
    animation: isOpen ? `modalFadeIn ${animationDuration}ms ease-out` : undefined,
    backgroundColor: 'var(--color-card)',
    color: 'var(--text-primary)',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: 'calc(100vh - 80px)', // Increased spacing from viewport edges
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
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
        onCancel={handleCancel}
        aria-labelledby={title ? `${testId}-title` : undefined}
        aria-describedby={description ? `${testId}-description` : undefined}
        aria-label={!title ? 'Dialog' : undefined}
        aria-modal="true"
        data-testid={testId}
      >
        <div 
          onClick={(e) => {
            // Prevent clicks inside the modal content from closing it
            e.stopPropagation()
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Fixed header */}
          <div style={{
            padding: designTokens.spacing.lg,
            paddingBottom: (title || description) ? '0' : designTokens.spacing.lg,
            flexShrink: 0,
            position: 'relative'
          }}>
            {showCloseButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onClose()
                }}
                style={{
                  position: 'absolute',
                  top: designTokens.spacing.md,
                  right: designTokens.spacing.md,
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: designTokens.spacing.xs,
                  lineHeight: 1,
                  color: 'var(--text-secondary)',
                  borderRadius: designTokens.radius.sm,
                  transition: designTokens.transitions.fast
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
                  margin: `0 0 ${designTokens.spacing.sm} 0`,
                  fontSize: designTokens.typography.fontSize.xl,
                  fontWeight: designTokens.typography.fontWeight.semibold,
                  color: 'var(--text-primary)',
                  paddingRight: showCloseButton ? designTokens.spacing.xl : '0'
                }}
              >
                {title}
              </h2>
            )}
            
            {description && (
              <p 
                id={`${testId}-description`}
                style={{
                  margin: `0 0 ${designTokens.spacing.lg} 0`,
                  fontSize: designTokens.typography.fontSize.sm,
                  color: 'var(--text-secondary)',
                  paddingRight: showCloseButton ? designTokens.spacing.xl : '0'
                }}
              >
                {description}
              </p>
            )}
          </div>
          
          {/* Scrollable content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: designTokens.spacing.lg,
            paddingTop: (title || description) ? designTokens.spacing.lg : '0',
            overscrollBehavior: 'contain'
          }}>
            {children}
          </div>
        </div>
      </dialog>
    </>
  )
}