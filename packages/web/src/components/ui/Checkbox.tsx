/**
 * Checkbox 컴포넌트 - 체크박스 입력 컴포넌트
 * 
 * 기능:
 * - 기본 체크박스 기능
 * - 중간 상태(indeterminate) 지원
 * - 라벨 및 설명 텍스트 지원
 * - 에러 상태 표시
 * - 다양한 크기 (sm, default, lg)
 * - 다양한 변형 (default, error, success)
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const checkboxVariants = cva(
  [
    'rounded',
    'border-2',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-brand-500',
    'focus:ring-offset-2',
    'focus:ring-offset-surface-primary',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'cursor-pointer',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      variant: {
        default: [
          'border-border-primary',
          'text-white',
          'checked:bg-brand-500',
          'checked:border-brand-500',
          'hover:border-brand-400',
          'indeterminate:bg-brand-500',
          'indeterminate:border-brand-500',
        ],
        error: [
          'border-error',
          'text-white',
          'checked:bg-error',
          'checked:border-error',
          'hover:border-red-400',
        ],
        success: [
          'border-success',
          'text-white',
          'checked:bg-success',
          'checked:border-success',
          'hover:border-green-400',
        ],
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

// Checkbox 컴포넌트 Props 타입 정의
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof checkboxVariants> {
  label?: string           // 체크박스 라벨 텍스트
  description?: string     // 설명 텍스트 (라벨 아래 표시)
  error?: string          // 에러 메시지
  indeterminate?: boolean // 중간 상태 여부 (일부 선택된 상태)
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size,
      variant,
      label,
      description,
      error,
      indeterminate = false,
      checked,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
    const hasError = error || variant === 'error'
    const checkboxVariant = hasError ? 'error' : variant

    // Handle indeterminate state
    React.useEffect(() => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.indeterminate = indeterminate
      }
    }, [indeterminate, ref])

    return (
      <div className="flex items-start space-x-2">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              checkboxVariants({ size, variant: checkboxVariant }),
              'appearance-none',
              className
            )}
            checked={checked}
            disabled={disabled}
            {...props}
          />
          
          {/* Checkmark icon */}
          {checked && !indeterminate && (
            <svg
              className={cn(
                'absolute inset-0 w-full h-full pointer-events-none',
                size === 'sm' && 'p-0.5',
                size === 'default' && 'p-0.5',
                size === 'lg' && 'p-1'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}

          {/* Indeterminate icon */}
          {indeterminate && (
            <svg
              className={cn(
                'absolute inset-0 w-full h-full pointer-events-none',
                size === 'sm' && 'p-0.5',
                size === 'default' && 'p-0.5',
                size === 'lg' && 'p-1'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium text-text-primary cursor-pointer select-none',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-xs text-text-secondary mt-0.5',
                  disabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
            {error && (
              <p className="text-xs text-error mt-0.5">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }