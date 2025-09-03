/**
 * Modal 컴포넌트 - 모달 창 컴포넌트
 * 
 * 기능:
 * - 포커스 트랩 (모달 내부로 포커스 제한)
 * - ESC 키로 모달 닫기
 * - 백드롭 클릭으로 모달 닫기
 * - 바디 스크롤 방지
 * - 다양한 크기 (sm, default, lg, xl, full)
 * - 제목, 설명, 닫기 버튼 지원
 * - ModalHeader, ModalBody, ModalFooter 서브컴포넌트
 */

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const modalVariants = cva(
  [
    'relative',
    'bg-surface-primary',
    'rounded-lg',
    'shadow-strong',
    'max-h-[90vh]',
    'overflow-y-auto',
    'animate-in',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-md w-full mx-4',
        default: 'max-w-lg w-full mx-4',
        lg: 'max-w-2xl w-full mx-4',
        xl: 'max-w-4xl w-full mx-4',
        full: 'max-w-7xl w-full mx-4 h-[90vh]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

// Modal 컴포넌트 Props 타입 정의
export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  open: boolean                    // 모달 표시 여부
  onClose: () => void             // 모달 닫기 핸들러
  closeOnBackdropClick?: boolean  // 백드롭 클릭 시 닫기 여부 (기본: true)
  closeOnEscape?: boolean         // ESC 키로 닫기 여부 (기본: true)
  showCloseButton?: boolean       // 닫기 버튼 표시 여부 (기본: true)
  title?: string                  // 모달 제목
  description?: string            // 모달 설명
}

// 포커스 트랩 훅 - 모달 내부로 포커스를 제한하는 훅
const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return containerRef
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      className,
      size,
      open,
      onClose,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      title,
      description,
      children,
      ...props
    },
    ref
  ) => {
    const focusTrapRef = useFocusTrap(open)
    const modalRef = useRef<HTMLDivElement>(null)

    // Handle escape key
    useEffect(() => {
      if (!open || !closeOnEscape) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [open, closeOnEscape, onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (open) {
        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = originalStyle
        }
      }
    }, [open])

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose()
      }
    }

    if (!open) return null

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <div
          ref={(node) => {
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
            focusTrapRef.current = node
            modalRef.current = node
          }}
          className={cn(modalVariants({ size }), className)}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {(title || description || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-border-primary">
              <div className="flex-1 min-w-0">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-text-primary"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="text-sm text-text-secondary mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  className="ml-4 p-1 text-text-tertiary hover:text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>,
      document.body
    )
  }
)
Modal.displayName = 'Modal'

// Modal Header
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-4 border-b border-border-primary', className)}
      {...props}
    >
      {children}
    </div>
  )
)
ModalHeader.displayName = 'ModalHeader'

// Modal Body
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalBody = React.forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('py-4', className)}
      {...props}
    >
      {children}
    </div>
  )
)
ModalBody.displayName = 'ModalBody'

// Modal Footer
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end space-x-2 pt-4 border-t border-border-primary',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
ModalFooter.displayName = 'ModalFooter'

export { Modal, ModalHeader, ModalBody, ModalFooter }