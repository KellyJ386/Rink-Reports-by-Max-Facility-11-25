'use client'

import { useRef, useState } from 'react'
import { FormField } from '@/types/forms'

interface PhotoFieldProps {
  field: FormField
  value: string[] // Array of base64 data URLs or file references
  onChange: (value: string[]) => void
  error?: string
  disabled?: boolean
}

export default function PhotoField({
  field,
  value,
  onChange,
  error,
  disabled,
}: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>(value || [])
  const maxFiles = field.maxFiles || 5
  const maxFileSize = field.maxFileSize || 5 * 1024 * 1024 // 5MB default

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: string[] = [...previews]
    const remainingSlots = maxFiles - newPreviews.length

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i]

      // Check file size
      if (file.size > maxFileSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`)
        continue
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`)
        continue
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          newPreviews.push(event.target.result as string)
          setPreviews([...newPreviews])
          onChange([...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index)
    setPreviews(newPreviews)
    onChange(newPreviews)
  }

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Photo Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={preview}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-md"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {previews.length < maxFiles && !disabled && (
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={field.accept || 'image/*'}
            multiple={maxFiles > 1}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-2xl mb-1">📷</div>
          <p className="text-sm text-gray-600">
            Click to add photo ({previews.length}/{maxFiles})
          </p>
        </div>
      )}

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
