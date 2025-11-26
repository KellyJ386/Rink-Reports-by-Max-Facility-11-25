'use client'

import { FormField } from '@/types/form-builder'

interface FieldWrapperProps {
  field: FormField
  children: React.ReactNode
  error?: string
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function FieldWrapper({
  field,
  children,
  error,
  isBuilder = false,
  isSelected = false,
  onClick,
}: FieldWrapperProps) {
  const widthClasses = {
    full: 'w-full',
    half: 'w-full md:w-1/2',
    third: 'w-full md:w-1/3',
  }

  const baseClasses = `${widthClasses[field.width || 'full']} p-1`
  const builderClasses = isBuilder
    ? `cursor-pointer rounded-lg transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-50'
          : 'hover:bg-gray-50'
      }`
    : ''

  return (
    <div className={`${baseClasses} ${builderClasses}`} onClick={onClick}>
      <div className="mb-4">
        {field.type !== 'divider' && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.validation?.some((v) => v.type === 'required') && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>
        )}
        {children}
        {field.helpText && (
          <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}
