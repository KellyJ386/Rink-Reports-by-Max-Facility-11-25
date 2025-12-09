'use client'

import { useState, useRef } from 'react'
import type { FormField } from '@/types/form-builder'

interface PhotoFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

export default function PhotoField({
  field,
  value = '',
  onChange,
  disabled = false,
  error,
  preview = false,
}: PhotoFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreviewUrl(result)
      onChange?.(result)
    }
    reader.readAsDataURL(file)
  }

  const clearPhoto = () => {
    setPreviewUrl('')
    onChange?.('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.some(v => v.type === 'required') && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className={`border-2 border-dashed rounded-lg p-4 text-center ${error ? 'border-red-500' : 'border-gray-300'}`}>
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded"
            />
            {!disabled && !preview && (
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
              >
                X
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="text-4xl text-gray-400 mb-2">📷</div>
            <p className="text-sm text-gray-500 mb-2">Click to upload or drag and drop</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled || preview}
              className="hidden"
              id={`photo-${field.id}`}
            />
            <label
              htmlFor={`photo-${field.id}`}
              className={`btn btn-secondary text-sm cursor-pointer ${disabled || preview ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Choose Photo
            </label>
          </div>
        )}
      </div>
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
