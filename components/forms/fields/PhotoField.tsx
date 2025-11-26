'use client'

import { useRef, useState } from 'react'

interface PhotoFieldProps {
  id: string
  label: string
  required?: boolean
  disabled?: boolean
  error?: string
  value?: string[] // Array of base64 or URLs
  onChange?: (files: File[]) => void
  helperText?: string
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
}

export default function PhotoField({
  id,
  label,
  required = false,
  disabled = false,
  error,
  value = [],
  onChange,
  helperText,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = 'image/*',
}: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>(value)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadError(null)

    // Check file count
    if (files.length + previews.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Check file sizes
    const oversized = files.find((f) => f.size > maxSizeMB * 1024 * 1024)
    if (oversized) {
      setUploadError(`File "${oversized.name}" exceeds ${maxSizeMB}MB limit`)
      return
    }

    // Generate previews
    const newPreviews: string[] = []
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === files.length) {
          setPreviews([...previews, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    onChange?.(files)
  }

  const removePhoto = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index)
    setPreviews(newPreviews)
  }

  const openFilePicker = () => {
    inputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        id={id}
        accept={accept}
        multiple
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Photo ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {previews.length < maxFiles && !disabled && (
        <button
          type="button"
          onClick={openFilePicker}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <div className="flex flex-col items-center text-gray-500">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm">Add Photo</span>
            <span className="text-xs text-gray-400">
              {previews.length}/{maxFiles} photos
            </span>
          </div>
        </button>
      )}

      {helperText && !error && !uploadError && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {(error || uploadError) && (
        <p className="text-xs text-red-500">{error || uploadError}</p>
      )}
    </div>
  )
}
