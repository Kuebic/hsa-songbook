import { useCallback } from 'react'
import { FormProvider } from './context/FormContext'
import { useFormContext } from './hooks/useFormContext'
import { formStyles, mergeFormStyles } from './utils/style-converter'
import type { FormProviderProps } from './context/FormContext'
import './styles/tailwind.css'

export interface FormProps<T = unknown> extends Omit<FormProviderProps<T>, 'children'> {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  noValidate?: boolean
  autoComplete?: string
  id?: string
}

/**
 * Form wrapper component that provides semantic HTML and form context
 */
function FormInner<T = unknown>({
  children,
  className,
  style,
  noValidate = true,
  autoComplete = 'off',
  id,
}: Omit<FormProps<T>, keyof FormProviderProps>) {
  const { handleSubmit } = useFormContext<T>()
  
  const onSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSubmit?.(event)
  }, [handleSubmit])
  
  const formStyle = mergeFormStyles(formStyles.form.container, style)
  
  return (
    <div className="form-root">
      <form
        id={id}
        className={className}
        style={formStyle}
        onSubmit={onSubmit}
        noValidate={noValidate}
        autoComplete={autoComplete}
        role="form"
      >
        {children}
      </form>
    </div>
  )
}

/**
 * Complete Form component with provider and semantic HTML
 * Matches the existing pattern from CreateSetlistForm.tsx
 */
export function Form<T = unknown>({
  children,
  schema,
  initialValues,
  onSubmit,
  validateOnBlur = true,
  validateOnChange = false,
  className,
  style,
  noValidate = true,
  autoComplete = 'off',
  id,
}: FormProps<T>) {
  return (
    <FormProvider
      schema={schema}
      initialValues={initialValues}
      onSubmit={onSubmit}
      validateOnBlur={validateOnBlur}
      validateOnChange={validateOnChange}
    >
      <FormInner
        className={className}
        style={style}
        noValidate={noValidate}
        autoComplete={autoComplete}
        id={id}
      >
        {children}
      </FormInner>
    </FormProvider>
  )
}

/**
 * Form Section component for organizing related fields
 * Provides semantic grouping and consistent spacing
 */
export interface FormSectionProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  style?: React.CSSProperties
}

export function FormSection({ 
  children, 
  title, 
  description,
  className,
  style 
}: FormSectionProps) {
  const sectionStyle = mergeFormStyles(
    {
      marginBottom: '2rem',
    },
    style
  )
  
  return (
    <fieldset
      className={className}
      style={sectionStyle}
    >
      {title && (
        <legend style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: '#374151',
        }}>
          {title}
        </legend>
      )}
      {description && (
        <p style={{
          color: '#64748b',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          margin: '0 0 1rem 0',
        }}>
          {description}
        </p>
      )}
      {children}
    </fieldset>
  )
}

/**
 * Form Actions component for submit/cancel buttons
 * Consistent with existing CreateSetlistForm pattern
 */
export interface FormActionsProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function FormActions({ 
  children, 
  align = 'left',
  className,
  style 
}: FormActionsProps) {
  const alignmentStyles = {
    left: { justifyContent: 'flex-start' },
    center: { justifyContent: 'center' },
    right: { justifyContent: 'flex-end' },
  }
  
  const actionsStyle = mergeFormStyles(
    {
      ...formStyles.form.actions,
      ...alignmentStyles[align],
    },
    style
  )
  
  return (
    <div
      className={className}
      style={actionsStyle}
    >
      {children}
    </div>
  )
}

/**
 * Form Row component for side-by-side field layout
 */
export interface FormRowProps {
  children: React.ReactNode
  gap?: string
  className?: string
  style?: React.CSSProperties
}

export function FormRow({ 
  children, 
  gap = '1rem',
  className,
  style 
}: FormRowProps) {
  const rowStyle = mergeFormStyles(
    {
      display: 'flex',
      gap,
      alignItems: 'flex-start',
    },
    style
  )
  
  return (
    <div
      className={className}
      style={rowStyle}
    >
      {children}
    </div>
  )
}

/**
 * Form Group component for consistent field spacing
 */
export interface FormGroupProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function FormGroup({ 
  children, 
  className,
  style 
}: FormGroupProps) {
  const groupStyle = mergeFormStyles(
    formStyles.field.container,
    style
  )
  
  return (
    <div
      className={className}
      style={groupStyle}
    >
      {children}
    </div>
  )
}