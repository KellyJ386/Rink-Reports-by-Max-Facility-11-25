'use client'

import { FormField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface SignatureFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function SignatureField({
  field,
  value,
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: SignatureFieldProps) {
  // In builder mode, show a placeholder
  // Full signature implementation will be in Phase 3
  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          disabled || isBuilder
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 bg-white'
        }`}
      >
        {value ? (
          <img
            src={value}
            alt="Signature"
            className="max-h-24 mx-auto"
          />
        ) : (
          <div className="text-gray-400">
            <span className="text-3xl block mb-2">✍</span>
            <span className="text-sm">
              {isBuilder ? 'Signature Pad' : 'Tap to sign'}
            </span>
          </div>
        )}
      </div>
      {!isBuilder && value && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          Clear signature
        </button>
      )}
    </FieldWrapper>
  )
}
