/**
 * Radio 컴포넌트 - 라디오 버튼 입력 컴포넌트
 * 
 * 기능:
 * - 개별 라디오 버튼 컴포넌트 (Radio)
 * - 라디오 그룹 컴포넌트 (RadioGroup) 
 * - 수직/수평 배치 지원
 * - 라벨 및 설명 텍스트 지원
 * - 에러 상태 및 헬퍼 텍스트 표시
 * - 다양한 크기 및 변형 지원
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const radioVariants = cva(
  [
    'rounded-full',
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
    'appearance-none',
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
          'bg-surface-primary',
          'checked:border-brand-500',
          'checked:bg-brand-500',
          'hover:border-brand-400',
        ],
        error: [
          'border-error',
          'bg-surface-primary',
          'checked:border-error',
          'checked:bg-error',
          'hover:border-red-400',
        ],
        success: [
          'border-success',
          'bg-surface-primary',
          'checked:border-success',
          'checked:bg-success',
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

// 라디오 옵션 타입 정의
export interface RadioOption {
  value: string            // 옵션 값
  label: string           // 화면에 표시될 텍스트
  description?: string    // 옵션 설명 (라벨 아래 표시)
  disabled?: boolean      // 비활성화 여부
}

// 개별 Radio 컴포넌트 Props 타입 정의
export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof radioVariants> {
  label?: string          // 라디오 버튼 라벨
  description?: string    // 설명 텍스트
  error?: string         // 에러 메시지
}

// RadioGroup 컴포넌트 Props 타입 정의
export interface RadioGroupProps {
  name: string                                    // 라디오 그룹 name 속성
  value?: string                                  // 현재 선택된 값
  onChange?: (value: string) => void              // 값 변경 핸들러
  options: RadioOption[]                          // 라디오 옵션 배열
  size?: 'sm' | 'default' | 'lg'                // 크기
  variant?: 'default' | 'error' | 'success'      // 변형
  error?: string                                 // 에러 메시지
  helperText?: string                            // 도움말 텍스트
  disabled?: boolean                             // 전체 그룹 비활성화 여부
  direction?: 'vertical' | 'horizontal'          // 배치 방향
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      size,
      variant,
      label,
      description,
      error,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`
    const hasError = error || variant === 'error'
    const radioVariant = hasError ? 'error' : variant

    return (
      <div className="flex items-start space-x-2">
        <div className="relative">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(radioVariants({ size, variant: radioVariant }), className)}
            disabled={disabled}
            {...props}
          />
          
          {/* Inner dot when checked */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center pointer-events-none',
              'opacity-0 transition-opacity duration-200',
              props.checked && 'opacity-100'
            )}
          >
            <div
              className={cn(
                'rounded-full bg-white',
                size === 'sm' && 'h-1.5 w-1.5',
                size === 'default' && 'h-2 w-2',
                size === 'lg' && 'h-2.5 w-2.5'
              )}
            />
          </div>
        </div>

        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={radioId}
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
Radio.displayName = 'Radio'

const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  size = 'default',
  variant = 'default',
  error,
  helperText,
  disabled = false,
  direction = 'vertical',
}) => {
  const handleChange = (optionValue: string) => {
    onChange?.(optionValue)
  }

  const hasError = Boolean(error)
  const radioVariant = hasError ? 'error' : variant

  return (
    <div className="w-full">
      <div
        className={cn(
          'space-y-2',
          direction === 'horizontal' && 'flex flex-wrap gap-4 space-y-0'
        )}
        role="radiogroup"
        aria-invalid={hasError}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            label={option.label}
            description={option.description}
            disabled={disabled || option.disabled}
            size={size}
            variant={radioVariant}
          />
        ))}
      </div>
      
      {(error || helperText) && (
        <p
          id={error ? `${name}-error` : `${name}-helper`}
          className={cn(
            'mt-2 text-xs',
            hasError ? 'text-error' : 'text-text-tertiary'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
}

export { Radio, RadioGroup }