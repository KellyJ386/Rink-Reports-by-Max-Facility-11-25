'use client'

import { useState, useRef } from 'react'
import { UseFormRegister, UseFormSetValue, FieldValues } from 'react-hook-form'
import type { PhotoFieldSchema } from '@/types/forms'

interface PhotoFieldProps {
  field: PhotoFieldSchema
  register: UseFormRegister<FieldValues>
  setValue: UseFormSetValue<FieldValues>
  defaultValue?: string[]
  disabled?: boolean
}

export default function PhotoField({
  field,
  register,
  setValue,
  defaultValue = [],
  disabled = false,
}: PhotoFieldProps) {
  const [photos, setPhotos] = useState<string[]>(defaultValue)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxPhotos = field.maxPhotos || 5
  const maxFileSize = field.maxFileSize || 10 * 1024 * 1024 // 10MB default

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed max photos
    if (photos.length + files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)

    try {
      const newPhotoUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file size
        if (file.size > maxFileSize) {
          alert(
            `File ${file.name} is too large. Maximum size is ${
              maxFileSize / 1024 / 1024
            }MB`
          )
          continue
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image`)
          continue
        }

        // For now, convert to base64 data URL for preview
        // In production, this would upload to cloud storage
        const dataUrl = await readFileAsDataURL(file)
        newPhotoUrls.push(dataUrl)

        // TODO: In production, upload to cloud storage:
        // const formData = new FormData()
        // formData.append('file', file)
        // const response = await fetch('/api/upload', {
        //   method: 'POST',
        //   body: formData,
        // })
        // const result = await response.json()
        // newPhotoUrls.push(result.url)
      }

      const updatedPhotos = [...photos, ...newPhotoUrls]
      setPhotos(updatedPhotos)
      setValue(field.id, updatedPhotos)
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Error uploading photos. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index)
    setPhotos(updatedPhotos)
    setValue(field.id, updatedPhotos)
  }

  const handleCameraCapture = () => {
    // Trigger file input with camera capture on mobile
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment" // Use rear camera on mobile
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || photos.length >= maxPhotos}
          className="flex items-center gap-2 px-4 py-2 bg-action-green-500 text-white rounded-lg hover:bg-action-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span>
              Uploading...
            </>
          ) : (
            <>
              <span>📷</span>
              Choose Photos
            </>
          )}
        </button>

        {/* Camera button (same as choose photos on mobile) */}
        <button
          type="button"
          onClick={handleCameraCapture}
          disabled={disabled || uploading || photos.length >= maxPhotos}
          className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>📸</span>
          Take Photo
        </button>
      </div>

      {/* Photo count */}
      <div className="text-sm text-wolf-600">
        {photos.length} / {maxPhotos} photos
        {field.required && photos.length === 0 && (
          <span className="text-red-500 ml-2">* Required</span>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photoUrl, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-wolf-200 hover:border-action-green-500 transition-colors"
            >
              {/* Photo */}
              <img
                src={photoUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay with remove button */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={disabled}
                  className="opacity-0 group-hover:opacity-100 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:cursor-not-allowed"
                >
                  🗑️ Remove
                </button>
              </div>

              {/* Photo number */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && (
        <div className="border-2 border-dashed border-wolf-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm text-wolf-600">
            No photos yet. Click above to add photos.
          </p>
        </div>
      )}

      {/* Help text */}
      {field.helpText && (
        <p className="text-sm text-wolf-500">{field.helpText}</p>
      )}
    </div>
  )
}
