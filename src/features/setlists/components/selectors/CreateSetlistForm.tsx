import { useState, useRef, type FormEvent } from 'react'
import { Modal } from '@shared/components/modal/Modal'
import { Loader2 } from 'lucide-react'
import type { CreateSetlistFormProps, CreateSetlistFormData } from '../../types/dropdown.types'

/**
 * Form for creating a new setlist inline from the dropdown
 * Opens as a modal overlay
 */
export function CreateSetlistForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  error
}: CreateSetlistFormProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<CreateSetlistFormData>({
    name: '',
    description: '',
    isPublic: false,
    addArrangement: true
  })
  const [validationError, setValidationError] = useState<string>('')
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate
    if (!formData.name.trim()) {
      setValidationError('Setlist name is required')
      nameInputRef.current?.focus()
      return
    }
    
    if (formData.name.trim().length < 2) {
      setValidationError('Setlist name must be at least 2 characters')
      nameInputRef.current?.focus()
      return
    }
    
    if (formData.name.trim().length > 100) {
      setValidationError('Setlist name must be less than 100 characters')
      nameInputRef.current?.focus()
      return
    }
    
    setValidationError('')
    
    try {
      await onSubmit(formData)
    } catch (_error) {
      // Error handling is done in the parent component
    }
  }
  
  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Create New Setlist"
      description="Create a new setlist and optionally add the current arrangement to it"
      size="small"
    >
      <form onSubmit={handleSubmit} className="create-setlist-form">
        {/* Name field */}
        <div className="form-field">
          <label htmlFor="setlist-name" className="form-label">
            Name <span className="required">*</span>
          </label>
          <input
            ref={nameInputRef}
            id="setlist-name"
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Sunday Service, Practice Session"
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'name-error' : undefined}
          />
          {validationError && (
            <p id="name-error" className="form-error" role="alert">
              {validationError}
            </p>
          )}
        </div>
        
        {/* Description field */}
        <div className="form-field">
          <label htmlFor="setlist-description" className="form-label">
            Description
          </label>
          <textarea
            id="setlist-description"
            className="form-textarea"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description for this setlist"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Options */}
        <div className="form-options">
          {/* Add arrangement checkbox */}
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={formData.addArrangement}
              onChange={(e) => setFormData(prev => ({ ...prev, addArrangement: e.target.checked }))}
              disabled={isSubmitting}
            />
            <span>Add current arrangement to this setlist</span>
          </label>
          
          {/* Public checkbox */}
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              disabled={isSubmitting}
            />
            <span>Make this setlist public</span>
          </label>
        </div>
        
        {/* Error message from API */}
        {error && (
          <div className="form-api-error" role="alert">
            {error}
          </div>
        )}
        
        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="btn-icon spinning" />
                Creating...
              </>
            ) : (
              'Create Setlist'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}