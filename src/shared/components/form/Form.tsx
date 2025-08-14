import { useCallback } from 'react'
import { FormProvider } from './context/FormContext'
import { useFormContext } from './hooks/useFormContext'
import { formStyles, mergeFormStyles } from './utils/style-converter'
import { designTokens } from '@shared/styles/tokens'
import type { FormProviderProps } from './context/FormContext'
import './styles/tailwind.css'
import '@shared/styles/animations.css'

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
  
  const enhancedFormStyle = mergeFormStyles(
    {
      ...formStyles.form.container,
      display: 'flex',
      flexDirection: 'column',
      gap: designTokens.spacing.xl, // Increased from 24px to 32px
      maxWidth: '100%',
      animation: 'formFadeIn 300ms ease-out'
    },
    style
  )
  
  return (
    <div className="form-root">
      <style>{`
        @keyframes formFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <form
        id={id}
        className={className}
        style={enhancedFormStyle}
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
      padding: designTokens.spacing.lg,
      backgroundColor: designTokens.colors.background.secondary,
      borderRadius: designTokens.radius.md,
      border: `1px solid ${designTokens.colors.border.default}`,
      marginBottom: designTokens.spacing.xl,
      transition: designTokens.transitions.normal,
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
          fontSize: designTokens.typography.fontSize.lg,
          fontWeight: designTokens.typography.fontWeight.semibold,
          color: designTokens.colors.text.primary,
          marginBottom: designTokens.spacing.md,
          paddingBottom: designTokens.spacing.sm,
          borderBottom: `1px solid ${designTokens.colors.border.default}`,
          width: '100%'
        }}>
          {title}
        </legend>
      )}
      {description && (
        <p style={{
          color: designTokens.colors.text.secondary,
          fontSize: designTokens.typography.fontSize.sm,
          marginBottom: designTokens.spacing.md,
          margin: `0 0 ${designTokens.spacing.md} 0`,
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
  gap = designTokens.spacing.md,
  className,
  style 
}: FormRowProps) {
  const rowStyle = mergeFormStyles(
    {
      display: 'flex',
      gap,
      alignItems: 'flex-start',
      '@media (max-width: 640px)': {
        flexDirection: 'column'
      }
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
    {
      ...formStyles.field.container,
      marginBottom: designTokens.spacing.lg
    },
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