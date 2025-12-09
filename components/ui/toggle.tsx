'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked = false, onCheckedChange, label, disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked)
      }
    }

    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-action' : 'bg-wolf-300',
            className
          )}
          onClick={handleClick}
          ref={ref}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        {label && (
          <span
            className={cn(
              'text-sm font-medium text-navy',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </span>
        )}
      </div>
    )
  }
)
Toggle.displayName = 'Toggle'

export { Toggle }
