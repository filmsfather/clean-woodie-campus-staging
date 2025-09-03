import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const textareaVariants = cva(
  [
    'block',
    'w-full',
    'px-3',
    'py-2',
    'text-sm',
    'bg-surface-primary',
    'border',
    'border-border-primary',
    'rounded-lg',
    'placeholder-text-tertiary',
    'focus:border-brand-500',
    'focus:ring-1',
    'focus:ring-brand-500',
    'transition-colors',
    'duration-200',
    'disabled:bg-surface-secondary',
    'disabled:text-text-tertiary',
    'disabled:cursor-not-allowed',
    'resize-y',
  ],
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs min-h-[80px]',
        default: 'px-3 py-2 text-sm min-h-[100px]',
        lg: 'px-4 py-3 text-base min-h-[120px]',
      },
      variant: {
        default: '',
        error: 'border-error focus:border-error focus:ring-error',
        success: 'border-success focus:border-success focus:ring-success',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
      resize: 'vertical',
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  error?: string
  helperText?: string
  maxLength?: number
  showCharCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size,
      variant,
      resize,
      error,
      helperText,
      maxLength,
      showCharCount = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const hasError = error || variant === 'error'
    const textareaVariant = hasError ? 'error' : variant
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(textareaVariants({ size, variant: textareaVariant, resize }), className)}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          {...props}
        />
        
        <div className="flex items-center justify-between mt-1">
          <div>
            {error && (
              <p className="text-xs text-error">
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-xs text-text-tertiary">
                {helperText}
              </p>
            )}
          </div>
          
          {(showCharCount || maxLength) && (
            <p
              className={cn(
                'text-xs',
                maxLength && currentLength > maxLength * 0.9
                  ? currentLength >= maxLength
                    ? 'text-error'
                    : 'text-warning'
                  : 'text-text-tertiary'
              )}
            >
              {showCharCount && maxLength
                ? `${currentLength}/${maxLength}`
                : showCharCount
                ? currentLength
                : maxLength
                ? `${maxLength - currentLength} remaining`
                : ''
              }
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }