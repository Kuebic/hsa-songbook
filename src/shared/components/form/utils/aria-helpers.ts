import { useId } from 'react'

/**
 * ARIA helper utilities for form accessibility
 * Ensures WCAG 2.1 AA compliance across all form components
 */

/**
 * Hook to generate consistent IDs for form fields and related elements
 */
export function useFormIds(baseName: string) {
  const baseId = useId()
  
  return {
    fieldId: `${baseName}-${baseId}`,
    labelId: `${baseName}-label-${baseId}`,
    errorId: `${baseName}-error-${baseId}`,
    helperId: `${baseName}-helper-${baseId}`,
    descriptionId: `${baseName}-desc-${baseId}`,
  }
}

/**
 * Get ARIA attributes for form fields
 */
export function getFieldAriaAttributes(
  fieldId: string,
  errorId?: string,
  helperId?: string,
  descriptionId?: string,
  options: {
    required?: boolean
    invalid?: boolean
    disabled?: boolean
    readOnly?: boolean
  } = {}
) {
  const describedByIds = [
    options.invalid && errorId,
    helperId,
    descriptionId
  ].filter(Boolean).join(' ')
  
  return {
    id: fieldId,
    'aria-required': options.required || undefined,
    'aria-invalid': options.invalid || undefined,
    'aria-disabled': options.disabled || undefined,
    'aria-readonly': options.readOnly || undefined,
    'aria-describedby': describedByIds || undefined,
  }
}

/**
 * Get ARIA attributes for form labels
 */
export function getLabelAriaAttributes(
  labelId: string,
  fieldId: string,
  required?: boolean
) {
  return {
    id: labelId,
    htmlFor: fieldId,
    'aria-label': required ? 'required field' : undefined,
  }
}

/**
 * Get ARIA attributes for error messages
 */
export function getErrorAriaAttributes(errorId: string, live: boolean = true) {
  return {
    id: errorId,
    role: 'alert' as const,
    'aria-live': live ? ('polite' as const) : undefined,
    'aria-atomic': true,
  }
}

/**
 * Get ARIA attributes for helper text
 */
export function getHelperAriaAttributes(helperId: string) {
  return {
    id: helperId,
    role: 'note',
  }
}

/**
 * Get ARIA attributes for form sections
 */
export function getSectionAriaAttributes(
  sectionId: string,
  title?: string,
  description?: string
) {
  return {
    id: sectionId,
    role: 'group',
    'aria-label': title,
    'aria-describedby': description ? `${sectionId}-desc` : undefined,
  }
}

/**
 * Get ARIA attributes for select dropdowns
 */
export function getSelectAriaAttributes(
  fieldId: string,
  expanded: boolean,
  listboxId?: string,
  activeDescendant?: string,
  errorId?: string,
  helperId?: string,
  options: {
    required?: boolean
    invalid?: boolean
    disabled?: boolean
    multiselectable?: boolean
  } = {}
) {
  const describedByIds = [
    options.invalid && errorId,
    helperId,
  ].filter(Boolean).join(' ')
  
  return {
    id: fieldId,
    role: 'combobox' as const,
    'aria-expanded': expanded,
    'aria-haspopup': 'listbox' as const,
    'aria-controls': listboxId,
    'aria-activedescendant': activeDescendant,
    'aria-required': options.required || undefined,
    'aria-invalid': options.invalid || undefined,
    'aria-disabled': options.disabled || undefined,
    'aria-multiselectable': options.multiselectable || undefined,
    'aria-describedby': describedByIds || undefined,
  }
}

/**
 * Get ARIA attributes for select option lists
 */
export function getListboxAriaAttributes(listboxId: string, fieldId: string) {
  return {
    id: listboxId,
    role: 'listbox',
    'aria-labelledby': fieldId,
  }
}

/**
 * Get ARIA attributes for select options
 */
export function getOptionAriaAttributes(
  optionId: string,
  selected: boolean,
  focused: boolean,
  disabled?: boolean
) {
  return {
    id: optionId,
    role: 'option',
    'aria-selected': selected,
    'aria-disabled': disabled || undefined,
    tabIndex: focused ? 0 : -1,
  }
}

/**
 * Get ARIA attributes for radio groups
 */
export function getRadioGroupAriaAttributes(
  groupId: string,
  labelId?: string,
  errorId?: string,
  helperId?: string,
  options: {
    required?: boolean
    invalid?: boolean
    disabled?: boolean
  } = {}
) {
  const describedByIds = [
    options.invalid && errorId,
    helperId,
  ].filter(Boolean).join(' ')
  
  return {
    id: groupId,
    role: 'radiogroup',
    'aria-labelledby': labelId,
    'aria-required': options.required || undefined,
    'aria-invalid': options.invalid || undefined,
    'aria-disabled': options.disabled || undefined,
    'aria-describedby': describedByIds || undefined,
  }
}

/**
 * Get ARIA attributes for radio buttons
 */
export function getRadioAriaAttributes(
  radioId: string,
  checked: boolean,
  disabled?: boolean
) {
  return {
    id: radioId,
    type: 'radio',
    'aria-checked': checked,
    'aria-disabled': disabled || undefined,
  }
}

/**
 * Get ARIA attributes for checkboxes
 */
export function getCheckboxAriaAttributes(
  checkboxId: string,
  checked: boolean,
  indeterminate?: boolean,
  disabled?: boolean,
  errorId?: string,
  helperId?: string,
  options: {
    required?: boolean
    invalid?: boolean
  } = {}
) {
  const describedByIds = [
    options.invalid && errorId,
    helperId,
  ].filter(Boolean).join(' ')
  
  return {
    id: checkboxId,
    type: 'checkbox',
    'aria-checked': indeterminate ? 'mixed' : checked,
    'aria-required': options.required || undefined,
    'aria-invalid': options.invalid || undefined,
    'aria-disabled': disabled || undefined,
    'aria-describedby': describedByIds || undefined,
  }
}

/**
 * Get ARIA attributes for form buttons
 */
export function getButtonAriaAttributes(
  buttonId: string,
  type: 'submit' | 'reset' | 'button' = 'button',
  disabled?: boolean,
  pressed?: boolean
) {
  return {
    id: buttonId,
    type,
    'aria-disabled': disabled || undefined,
    'aria-pressed': pressed !== undefined ? pressed : undefined,
  }
}

/**
 * Screen reader announcement utility
 * For dynamic content changes that need to be announced
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  isNavigationKey: (key: string) => [
    'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown'
  ].includes(key),
  
  isActivationKey: (key: string) => ['Enter', ' '].includes(key),
  
  isEscapeKey: (key: string) => key === 'Escape',
  
  preventDefaultForKeys: (event: React.KeyboardEvent, keys: string[]) => {
    if (keys.includes(event.key)) {
      event.preventDefault()
    }
  }
}