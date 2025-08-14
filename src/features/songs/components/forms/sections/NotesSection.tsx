import { SimpleTextarea, SimpleCheckbox, SimpleSection } from '../utils/SimpleFormInputs'
import { useAuth } from '@features/auth/hooks/useAuth'
import type { SongFormData } from '../../../validation/schemas/songFormSchema'

interface NotesSectionProps {
  data: Partial<SongFormData>
  errors: Record<string, string>
  onChange: (field: keyof SongFormData, value: SongFormData[keyof SongFormData]) => void
  disabled?: boolean
}

export function NotesSection({ 
  data, 
  errors, 
  onChange,
  disabled = false
}: NotesSectionProps) {
  const { isAdmin } = useAuth()
  
  return (
    <SimpleSection title="Additional Information">
      <SimpleTextarea
        name="notes"
        label="Notes"
        value={data.notes || ''}
        onChange={(value) => onChange('notes', value)}
        error={errors.notes}
        rows={4}
        maxLength={2000}
        showCharacterCount
        autoResize
        placeholder="Any additional notes about this song..."
        helperText="Include performance notes, historical context, or special instructions"
        disabled={disabled}
      />
      
      {isAdmin && (
        <SimpleCheckbox
          name="isPublic"
          label="Make this song public"
          checked={data.isPublic || false}
          onChange={(value) => onChange('isPublic', value)}
          helperText="Public songs are visible to all users"
          disabled={disabled}
        />
      )}
    </SimpleSection>
  )
}