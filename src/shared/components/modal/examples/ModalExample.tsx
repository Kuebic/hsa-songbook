import { useState } from 'react'
import { Modal } from '../Modal'
import { ModalProvider } from '../ModalProvider'

/**
 * Example demonstrating the Modal component usage
 */
export function ModalExample() {
  const [isOpen, setIsOpen] = useState(false)
  const [isNestedOpen, setIsNestedOpen] = useState(false)

  return (
    <ModalProvider>
      <div style={{ padding: '20px' }}>
        <h1>Modal Infrastructure Example</h1>
        
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Open Modal
        </button>

        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Example Modal"
          description="This is a demonstration of the modal component"
          size="medium"
        >
          <div style={{ marginTop: '20px' }}>
            <p>This modal demonstrates:</p>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>✓ Native dialog element usage</li>
              <li>✓ Proper focus management</li>
              <li>✓ ESC key to close</li>
              <li>✓ Click outside to close</li>
              <li>✓ Smooth animations</li>
              <li>✓ Accessibility features</li>
            </ul>
            
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={() => setIsNestedOpen(true)}
                style={{
                  padding: '8px 16px',
                  marginRight: '10px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Open Nested Modal
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>

          <Modal
            isOpen={isNestedOpen}
            onClose={() => setIsNestedOpen(false)}
            title="Nested Modal"
            size="small"
          >
            <p>This is a nested modal demonstrating modal stacking.</p>
            <p style={{ marginTop: '10px' }}>Only this modal will respond to ESC key.</p>
            <button
              onClick={() => setIsNestedOpen(false)}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close Nested
            </button>
          </Modal>
        </Modal>
      </div>
    </ModalProvider>
  )
}