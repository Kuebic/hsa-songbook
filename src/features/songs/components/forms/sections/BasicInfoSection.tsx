import { SimpleInput, SimpleRow, SimpleSection } from '../utils/SimpleFormInputs'
import type { SongFormData } from '../../../validation/schemas/songFormSchema'

interface BasicInfoSectionProps {
  data: Partial<SongFormData>
  errors: Record<string, string>
  onChange: (field: keyof SongFormData, value: any) => void
  disabled?: boolean
}

export function BasicInfoSection({ 
  data, 
  errors, 
  onChange,
  disabled = false
}: BasicInfoSectionProps) {
  const currentYear = new Date().getFullYear()
  
  return (
    <SimpleSection title="Basic Information">
      <SimpleInput
        name="title"
        label="Title"
        value={data.title || ''}
        onChange={(value) => onChange('title', value)}
        error={errors.title}
        required
        maxLength={200}
        showCharacterCount
        placeholder="Enter song title..."
        disabled={disabled}
      />
      
      <SimpleRow>
        <SimpleInput
          name="artist"
          label="Artist"
          value={data.artist || ''}
          onChange={(value) => onChange('artist', value)}
          error={errors.artist}
          maxLength={100}
          placeholder="Original artist or composer..."
          disabled={disabled}
        />
        
        <SimpleInput
          name="compositionYear"
          label="Year"
          type="number"
          value={data.compositionYear?.toString() || ''}
          onChange={(value) => onChange('compositionYear', 
            value ? parseInt(value) : undefined
          )}
          error={errors.compositionYear}
          min={1000}
          max={currentYear}
          placeholder="Year composed..."
          disabled={disabled}
        />
      </SimpleRow>
      
      <SimpleInput
        name="ccli"
        label="CCLI Number"
        value={data.ccli || ''}
        onChange={(value) => onChange('ccli', value)}
        error={errors.ccli}
        pattern="[0-9]{5,7}"
        placeholder="5-7 digit CCLI number..."
        helperText="Copyright Licensing International number (if applicable)"
        disabled={disabled}
      />
    </SimpleSection>
  )
}