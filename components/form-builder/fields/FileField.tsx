'use client'

import { FormField } from '@/types'
import { useRef, useState } from 'react'

interface FileFieldProps {
  field: FormField
  value: File | null
  onChange: (value: File | null) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export function FileField({ field, value, onChange, error, disabled, preview }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      // Check file size if maxSize is set
      if (field.maxSize && file.size > field.maxSize) {
        alert(`File size must be less than ${Math.round(field.maxSize / 1024 / 1024)}MB`)
        return
      }
      setFileName(file.name)
      onChange(file)
    }
  }

  const handleClear = () => {
    setFileName('')
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const accept = field.type === 'photo'
    ? 'image/*'
    : field.accept || undefined

  return (
    <div className={`field-wrapper ${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          accept={accept}
          disabled={disabled || preview}
          className="hidden"
          id={`file-${field.id}`}
        />
        <label
          htmlFor={`file-${field.id}`}
          className={`btn btn-secondary cursor-pointer ${disabled || preview ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {field.type === 'photo' ? 'Choose Photo' : 'Choose File'}
        </label>

        {fileName && (
          <>
            <span className="text-sm text-gray-600 truncate max-w-[200px]">{fileName}</span>
            {!disabled && !preview && (
              <button
                type="button"
                onClick={handleClear}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </>
        )}
      </div>

      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
