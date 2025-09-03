import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const buttonVariants = cva(
  [
    'btn-base',
    'active:scale-[0.98]',
    'select-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-brand-500 text-white',
          'hover:bg-brand-600',
          'active:bg-brand-700',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-surface-secondary text-text-primary border border-border-primary',
          'hover:bg-surface-tertiary',
          'active:bg-border-primary',
        ],
        outline: [
          'border border-brand-500 text-brand-600',
          'hover:bg-brand-50 hover:border-brand-600',
          'active:bg-brand-100',
          'dark:text-brand-400 dark:hover:bg-brand-950 dark:active:bg-brand-900',
        ],
        ghost: [
          'text-text-primary',
          'hover:bg-surface-secondary',
          'active:bg-surface-tertiary',
        ],
        link: [
          'text-brand-600 underline-offset-4',
          'hover:underline hover:text-brand-700',
          'active:text-brand-800',
          'p-0 h-auto',
          'dark:text-brand-400 dark:hover:text-brand-300',
        ],
        destructive: [
          'bg-error text-white',
          'hover:bg-red-600',
          'active:bg-red-700',
          'shadow-sm hover:shadow-md',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-xs h-8',
        default: 'px-4 py-2 text-sm h-10',
        lg: 'px-6 py-3 text-base h-12',
        xl: 'px-8 py-4 text-lg h-14',
        icon: 'p-2 h-10 w-10',
      },
      loading: {
        true: 'cursor-wait',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(buttonVariants({ variant, size, loading }), className)}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }