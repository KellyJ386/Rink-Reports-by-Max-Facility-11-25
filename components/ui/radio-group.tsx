"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value: string
  onChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

function useRadioGroup() {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error("RadioGroup components must be used within a RadioGroup")
  }
  return context
}

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")

    const currentValue = value ?? internalValue

    const handleChange = React.useCallback((newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }, [value, onValueChange])

    return (
      <RadioGroupContext.Provider value={{ value: currentValue, onChange: handleChange }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn("grid gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: groupValue, onChange } = useRadioGroup()
    const isChecked = groupValue === value

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        onClick={() => onChange(value)}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {isChecked && (
          <span className="flex items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
          </span>
        )}
      </button>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
