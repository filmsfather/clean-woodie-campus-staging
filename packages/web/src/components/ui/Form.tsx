import React from 'react'
import { cn } from '../../utils/cn'

// Form Root
export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => (
    <form
      ref={ref}
      className={cn('space-y-6', className)}
      {...props}
    >
      {children}
    </form>
  )
)
Form.displayName = 'Form'

// Form Field Container
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: boolean
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, error, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-2', className)}
      {...props}
    >
      {children}
    </div>
  )
)
FormField.displayName = 'FormField'

// Form Label
export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block text-sm font-medium text-text-primary',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-error ml-1" aria-label="Required">
          *
        </span>
      )}
    </label>
  )
)
FormLabel.displayName = 'FormLabel'

// Form Error Message
export interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    
    return (
      <p
        ref={ref}
        className={cn('text-xs text-error', className)}
        role="alert"
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormError.displayName = 'FormError'

// Form Helper Text
export interface FormHelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormHelperText = React.forwardRef<HTMLParagraphElement, FormHelperTextProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null
    
    return (
      <p
        ref={ref}
        className={cn('text-xs text-text-tertiary', className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormHelperText.displayName = 'FormHelperText'

// Form Section
export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-4', className)}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-text-primary">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-text-secondary">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
)
FormSection.displayName = 'FormSection'

// Form Actions (for buttons)
export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right'
}

const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, align = 'left', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex gap-3 pt-6',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
FormActions.displayName = 'FormActions'

// Form Group (for grouping related fields horizontally)
export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, columns = 2, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 md:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
FormGroup.displayName = 'FormGroup'

// Field wrapper that combines label, input, error, and helper text
export interface FieldWrapperProps {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  children: React.ReactNode
  className?: string
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className,
}) => (
  <FormField className={className} error={Boolean(error)}>
    {label && (
      <FormLabel required={required}>
        {label}
      </FormLabel>
    )}
    {children}
    <FormError>{error}</FormError>
    <FormHelperText>{helperText}</FormHelperText>
  </FormField>
)

export {
  Form,
  FormField,
  FormLabel,
  FormError,
  FormHelperText,
  FormSection,
  FormActions,
  FormGroup,
  FieldWrapper,
}