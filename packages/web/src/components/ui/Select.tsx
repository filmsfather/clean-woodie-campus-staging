/**
 * Select 컴포넌트 - 드롭다운 선택 컴포넌트
 * 
 * 기능:
 * - 일반 네이티브 select와 검색 가능한 커스텀 select 지원
 * - 검색 기능 (searchable prop)
 * - 클리어 기능 (clearable prop) 
 * - 키보드 네비게이션 (Enter, Space, Escape, Arrow keys)
 * - 에러 상태 및 헬퍼 텍스트 지원
 * - 다양한 크기 (sm, default, lg)
 */

import React, { useState, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const selectVariants = cva(
  [
    'input-base',
    'cursor-pointer',
    'pr-10',
    'disabled:bg-surface-secondary disabled:text-text-tertiary disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs h-8',
        default: 'px-3 py-2 text-sm h-10',
        lg: 'px-4 py-3 text-base h-12',
      },
      variant: {
        default: '',
        error: 'border-error focus:border-error focus:ring-error',
        success: 'border-success focus:border-success focus:ring-success',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

// 선택 옵션 타입 정의
export interface SelectOption {
  value: string          // 옵션 값
  label: string          // 화면에 표시될 텍스트
  disabled?: boolean     // 비활성화 여부
}

// Select 컴포넌트 Props 타입 정의
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  options?: SelectOption[]    // 선택 옵션 배열 (children 방식 사용 시 optional)
  placeholder?: string       // 플레이스홀더 텍스트
  error?: string            // 에러 메시지
  helperText?: string       // 도움말 텍스트
  searchable?: boolean      // 검색 기능 활성화 여부
  clearable?: boolean       // 클리어 버튼 표시 여부
  onClear?: () => void      // 클리어 버튼 클릭 핸들러
  onValueChange?: (value: string) => void // 값 변경 핸들러 (onChange와 동일하지만 더 간단한 시그니처)
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      size,
      variant,
      options,
      placeholder,
      error,
      helperText,
      searchable = false,
      clearable = false,
      onClear,
      onValueChange,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredOptions, setFilteredOptions] = useState(options || [])
    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const hasError = error || variant === 'error'
    const selectVariant = hasError ? 'error' : variant
    const selectedOption = options?.find(option => option.value === value)

    useEffect(() => {
      if (searchable && options) {
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredOptions(filtered)
      } else {
        setFilteredOptions(options || [])
      }
    }, [searchTerm, options, searchable])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchTerm('')
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    const handleToggle = () => {
      if (disabled) return
      setIsOpen(!isOpen)
      if (!isOpen && searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
    }

    const handleOptionClick = (option: SelectOption) => {
      if (option.disabled) return
      
      const syntheticEvent = {
        target: { value: option.value },
        currentTarget: { value: option.value },
      } as React.ChangeEvent<HTMLSelectElement>
      
      onChange?.(syntheticEvent)
      onValueChange?.(option.value)
      setIsOpen(false)
      setSearchTerm('')
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault()
          handleToggle()
          break
        case 'Escape':
          setIsOpen(false)
          setSearchTerm('')
          break
        case 'ArrowDown':
          event.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          }
          // TODO: Add keyboard navigation between options
          break
        case 'ArrowUp':
          event.preventDefault()
          // TODO: Add keyboard navigation between options
          break
      }
    }

    const handleClear = (event: React.MouseEvent) => {
      event.stopPropagation()
      onClear?.()
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLSelectElement>
      onChange?.(syntheticEvent)
      onValueChange?.('')
    }

    if (!searchable) {
      // Native select for non-searchable version
      return (
        <div className="w-full">
          <div className="relative">
            <select
              ref={ref}
              className={cn(selectVariants({ size, variant: selectVariant }), className)}
              value={value}
              onChange={onChange}
              disabled={disabled}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {(options || []).map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {(error || helperText) && (
            <p
              className={cn(
                'mt-1 text-xs',
                hasError ? 'text-error' : 'text-text-tertiary'
              )}
            >
              {error || helperText}
            </p>
          )}
        </div>
      )
    }

    return (
      <div className="w-full">
        <div className="relative" ref={containerRef}>
          <div
            className={cn(
              selectVariants({ size, variant: selectVariant }),
              'flex items-center justify-between',
              className
            )}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className={cn(
              'truncate',
              !selectedOption && 'text-text-tertiary'
            )}>
              {selectedOption?.label || placeholder || 'Select an option...'}
            </span>
            <div className="flex items-center">
              {clearable && selectedOption && (
                <button
                  type="button"
                  className="p-0.5 mr-1 text-text-tertiary hover:text-text-primary"
                  onClick={handleClear}
                  tabIndex={-1}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              <svg
                className={cn(
                  'w-4 h-4 text-text-tertiary transition-transform duration-200',
                  isOpen && 'transform rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-surface-primary border border-border-primary rounded-lg shadow-medium max-h-60 overflow-auto">
              {searchable && (
                <div className="p-2 border-b border-border-primary">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full px-2 py-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div role="listbox">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-text-tertiary">
                    No options found
                  </div>
                ) : (
                  (filteredOptions || []).map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        'px-3 py-2 text-sm cursor-pointer transition-colors duration-150',
                        'hover:bg-surface-secondary',
                        'focus:bg-surface-secondary focus:outline-none',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        option.value === value && 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      )}
                      onClick={() => handleOptionClick(option)}
                      role="option"
                      aria-selected={option.value === value}
                      tabIndex={option.disabled ? -1 : 0}
                    >
                      {option.label}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1 text-xs',
              hasError ? 'text-error' : 'text-text-tertiary'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }