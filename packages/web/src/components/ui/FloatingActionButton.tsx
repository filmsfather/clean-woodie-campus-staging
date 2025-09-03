import React, { useState } from 'react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

interface FloatingAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'success' | 'warning' | 'error'
}

interface FloatingActionButtonProps {
  actions: FloatingAction[]
  className?: string
}

export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Action Items */}
      {isOpen && (
        <div className="mb-4 space-y-2">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center gap-3 animate-in"
              style={{
                animationDelay: `${index * 50}ms`,
                animationDuration: '200ms',
              }}
            >
              <span className="bg-surface-primary text-text-primary text-sm px-3 py-1 rounded-lg shadow-medium border border-border-primary whitespace-nowrap">
                {action.label}
              </span>
              <Button
                size="icon"
                variant={action.variant || 'default'}
                onClick={() => {
                  action.onClick()
                  setIsOpen(false)
                }}
                className="shadow-strong hover:scale-110 transition-transform duration-200"
              >
                {action.icon}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 shadow-strong hover:shadow-medium transition-all duration-200',
          isOpen && 'rotate-45'
        )}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}