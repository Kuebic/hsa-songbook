import { SimpleSection } from '../utils/SimpleFormInputs'
import { ThemeCombobox } from '../fields/ThemeCombobox'
import { SourceSelect } from '../fields/SourceSelect'
import type { SongFormData } from '../../../validation/schemas/songFormSchema'

interface CategorizationSectionProps {
  data: Partial<SongFormData>
  errors: Record<string, string>
  onChange: (field: keyof SongFormData, value: SongFormData[keyof SongFormData]) => void
  disabled?: boolean
}

export function CategorizationSection({ 
  data, 
  errors, 
  onChange,
  disabled = false
}: CategorizationSectionProps) {
  return (
    <SimpleSection title="Categorization">
      <SourceSelect
        value={data.source}
        onChange={value => onChange('source', value)}
        error={errors.source}
        disabled={disabled}
      />
      
      <ThemeCombobox
        value={data.themes || []}
        onChange={themes => onChange('themes', themes)}
        error={errors.themes}
        required
        maxThemes={10}
        disabled={disabled}
      />
    </SimpleSection>
  )
}