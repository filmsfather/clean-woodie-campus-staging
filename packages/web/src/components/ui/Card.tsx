import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const cardVariants = cva(
  ['card-base', 'transition-all duration-200'],
  {
    variants: {
      size: {
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      interactive: {
        true: [
          'hover:shadow-medium cursor-pointer',
          'hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-soft',
        ],
        false: '',
      },
      variant: {
        default: '',
        elevated: 'shadow-medium',
        outlined: 'border-2',
        ghost: 'border-none shadow-none bg-transparent',
      },
    },
    defaultVariants: {
      size: 'default',
      interactive: false,
      variant: 'default',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, size, interactive, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ size, interactive, variant }), className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

// Card Header
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4 pb-3 border-b border-border-primary last:border-none last:pb-0 last:mb-0', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

// Card Title
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn('text-lg font-semibold text-text-primary leading-tight', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

// Card Description
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-text-secondary mt-1', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

// Card Content
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'

// Card Footer
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 pt-3 border-t border-border-primary flex items-center', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }