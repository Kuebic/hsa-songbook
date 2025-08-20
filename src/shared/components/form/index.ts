// Core form components
export { Form, FormSection, FormActions, FormRow, FormGroup } from './Form'
export { FormField } from './FormField'

// Input components
export { 
  FormInput, 
  EmailInput, 
  PasswordInput, 
  NumberInput, 
  TelInput, 
  UrlInput, 
  SearchInput 
} from './FormInput'
export { 
  FormTextarea, 
  AutoResizeTextarea, 
  CodeTextarea, 
  LongTextarea 
} from './FormTextarea'
export { FormSelect } from './FormSelect'
export { FormCheckbox, FormCheckboxGroup } from './FormCheckbox'
export { FormRadioGroup } from './FormRadioGroup'

// Button components - now using shadcn Button wrappers
export { 
  SubmitButton, 
  CancelButton, 
  ResetButton, 
  DeleteButton
} from './ButtonWrappers'

// Support components
export { FormError, FormErrorList, FormInlineError } from './FormError'
export { FormLabel, FormLegend, FormFloatingLabel } from './FormLabel'
export { 
  FormHelperText, 
  FormCharacterCount, 
  FormDescription, 
  FormTooltip 
} from './FormHelperText'

// Context and hooks
export { FormProvider } from './context/FormContext'
export { useFormContext, useFormField, useFormFieldProps } from './hooks'

// Utilities
export { 
  createFormAdapter, 
  useFormValidation,
  getSchemaDefaults,
  validateSingleField,
  extractFormData 
} from './utils/validation-adapter'
export { 
  cn,
  designTokens,
  formStyles,
  getFormStyles,
  mergeFormStyles 
} from './utils/style-converter'
export { 
  useFormIds,
  getFieldAriaAttributes,
  getLabelAriaAttributes,
  getErrorAriaAttributes,
  getHelperAriaAttributes,
  announceToScreenReader,
  keyboardNavigation 
} from './utils/aria-helpers'

// Types
export type { 
  FormFieldValue,
  FormFieldProps,
  FormContextValue,
  ValidationAdapter,
  StyleMapping,
  SelectOption,
  RadioOption,
  FormSectionProps,
  FormActionsProps 
} from './types'
export type { FormProviderProps } from './context/FormContext'

// Re-export commonly used validation schemas from shared
export { 
  createSetlistSchema,
  setlistNameSchema,
  setlistDescriptionSchema,
  searchQuerySchema,
  songTitleSchema,
  songArtistSchema,
  songLyricsSchema,
  songNotesSchema 
} from '@shared/validation/schemas'