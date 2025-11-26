'use client'

import { FormField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface PhotoFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function PhotoField({
  field,
  value,
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: PhotoFieldProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, create a local URL. In production, this would upload to storage
      const url = URL.createObjectURL(file)
      onChange?.(url)
    }
  }

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
            : 'border-gray-300 bg-white hover:bg-gray-50'
        }`}
      >
        {value ? (
          <div>
            <img
              src={value}
              alt="Uploaded photo"
              className="max-h-48 mx-auto rounded"
            />
            {!isBuilder && (
              <button
                type="button"
                onClick={() => onChange?.('')}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Remove photo
              </button>
            )}
          </div>
        ) : (
          <label className={`cursor-pointer ${disabled || isBuilder ? 'cursor-not-allowed' : ''}`}>
            <div className="text-gray-400">
              <span className="text-3xl block mb-2">📷</span>
              <span className="text-sm">
                {isBuilder ? 'Photo Upload' : 'Click to upload photo'}
              </span>
            </div>
            {!isBuilder && (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
              />
            )}
          </label>
        )}
      </div>
    </FieldWrapper>
  )
}
