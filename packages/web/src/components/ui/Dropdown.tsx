import React, { useState, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const dropdownVariants = cva(
  [
    'absolute',
    'z-10',
    'mt-1',
    'min-w-full',
    'bg-surface-primary',
    'border',
    'border-border-primary',
    'rounded-lg',
    'shadow-medium',
    'animate-in',
  ],
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
      position: {
        'bottom-start': 'top-full left-0',
        'bottom-end': 'top-full right-0',
        'top-start': 'bottom-full left-0 mb-1 mt-0',
        'top-end': 'bottom-full right-0 mb-1 mt-0',
      },
    },
    defaultVariants: {
      size: 'default',
      position: 'bottom-start',
    },
  }
)

export interface DropdownItem {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  danger?: boolean
  onClick?: () => void
  children?: DropdownItem[]
}

export interface DropdownProps
  extends VariantProps<typeof dropdownVariants> {
  trigger: React.ReactNode
  items: DropdownItem[]
  disabled?: boolean
  className?: string
  menuClassName?: string
  onItemClick?: (item: DropdownItem) => void
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  disabled = false,
  size,
  position,
  className,
  menuClassName,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const flattenedItems = items.filter(item => !item.disabled)

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else if (focusedIndex >= 0 && focusedIndex < flattenedItems.length) {
          handleItemClick(flattenedItems[focusedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setFocusedIndex(-1)
        triggerRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else {
          setFocusedIndex(prev => (prev + 1) % flattenedItems.length)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(flattenedItems.length - 1)
        } else {
          setFocusedIndex(prev => prev <= 0 ? flattenedItems.length - 1 : prev - 1)
        }
        break
      case 'Tab':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
    }
  }

  const handleTriggerClick = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setFocusedIndex(0)
    } else {
      setFocusedIndex(-1)
    }
  }

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return
    
    item.onClick?.()
    onItemClick?.(item)
    setIsOpen(false)
    setFocusedIndex(-1)
    triggerRef.current?.focus()
  }

  const renderItem = (item: DropdownItem, index: number) => {
    const isFocused = index === focusedIndex
    const isDisabled = item.disabled

    return (
      <div
        key={item.key}
        className={cn(
          'px-3 py-2 cursor-pointer transition-colors duration-150 flex items-center space-x-2',
          'hover:bg-surface-secondary focus:bg-surface-secondary focus:outline-none',
          isDisabled && 'opacity-50 cursor-not-allowed',
          item.danger && 'text-error hover:bg-red-50 dark:hover:bg-red-950',
          isFocused && !isDisabled && 'bg-surface-secondary',
          isFocused && item.danger && 'bg-red-50 dark:bg-red-950'
        )}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => setFocusedIndex(index)}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={isDisabled}
      >
        {item.icon && (
          <span className="flex-shrink-0">
            {item.icon}
          </span>
        )}
        <span className="flex-1 truncate">
          {item.label}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={dropdownRef}
      className={cn('relative inline-block', className)}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={cn(
          'cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            dropdownVariants({ size, position }),
            'max-h-60 overflow-y-auto',
            menuClassName
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {items.length === 0 ? (
            <div className="px-3 py-2 text-text-tertiary">
              No items available
            </div>
          ) : (
            items.map((item, index) => (
              item.children ? (
                // Nested dropdown items (submenu) - simplified version
                <div key={item.key}>
                  <div className="px-3 py-1 text-xs font-medium text-text-tertiary bg-surface-secondary">
                    {item.label}
                  </div>
                  {item.children.map((childItem, childIndex) => 
                    renderItem(childItem, items.length + childIndex)
                  )}
                </div>
              ) : (
                renderItem(item, index)
              )
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Dropdown with separator support
export interface DropdownSeparatorProps {
  className?: string
}

const DropdownSeparator: React.FC<DropdownSeparatorProps> = ({ className }) => (
  <div className={cn('my-1 border-t border-border-primary', className)} />
)

// Dropdown menu item component for custom content
export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
  danger?: boolean
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, disabled, danger, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-3 py-2 cursor-pointer transition-colors duration-150',
        'hover:bg-surface-secondary focus:bg-surface-secondary focus:outline-none',
        disabled && 'opacity-50 cursor-not-allowed',
        danger && 'text-error hover:bg-red-50 dark:hover:bg-red-950',
        className
      )}
      role="menuitem"
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  )
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

export { Dropdown, DropdownSeparator, DropdownMenuItem }