'use client'

import { useRef, useState, useEffect } from 'react'
import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldWrapper, FieldEditWrapper } from './FieldWrapper'

// Signature field - Render mode
export function SignatureFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (canvasRef.current && value) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.drawImage(img, 0, 0)
        }
        img.src = value as string
      }
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || field.disabled) return
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || field.disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onChange(null)
      }
    }
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className={`w-full bg-white touch-none ${disabled || field.disabled ? 'opacity-50' : 'cursor-crosshair'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="bg-gray-50 px-3 py-2 flex justify-between items-center border-t">
          <span className="text-xs text-gray-500">Sign above</span>
          <button
            type="button"
            onClick={clearSignature}
            disabled={disabled || field.disabled}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
    </FieldWrapper>
  )
}

// Signature field - Edit mode
export function SignatureFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <div className="border rounded-lg overflow-hidden">
          <div className="h-24 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-xs">Signature pad</span>
            </div>
          </div>
        </div>
      </FieldWrapper>
    </FieldEditWrapper>
  )
}

// Photo field - Render mode
export function PhotoFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value as string | null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        onChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearPhoto = () => {
    setPreview(null)
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className="border rounded-lg overflow-hidden">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={clearPhoto}
              disabled={disabled || field.disabled}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center h-48 bg-gray-50 ${disabled || field.disabled ? 'opacity-50' : 'cursor-pointer hover:bg-gray-100'}`}>
            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-500">Click to upload photo</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={disabled || field.disabled}
              className="hidden"
            />
          </label>
        )}
      </div>
    </FieldWrapper>
  )
}

// Photo field - Edit mode
export function PhotoFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <div className="border rounded-lg overflow-hidden">
          <div className="h-32 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs">Photo upload</span>
            </div>
          </div>
        </div>
      </FieldWrapper>
    </FieldEditWrapper>
  )
}
