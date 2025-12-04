'use client'

import { useRef, useState, useEffect } from 'react'
import { FormField } from '@/types/forms'

interface SignatureFieldProps {
  field: FormField
  value: string // Base64 data URL
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export default function SignatureField({
  field,
  value,
  onChange,
  error,
  disabled,
}: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  // Load existing signature
  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          setHasSignature(true)
        }
        img.src = value
      }
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return
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
    if (!isDrawing || disabled) return
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
    setHasSignature(true)
  }

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false)
      const dataUrl = canvasRef.current.toDataURL('image/png')
      onChange(dataUrl)
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange('')
  }

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={`border rounded-md bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {hasSignature ? 'Signature captured' : 'Sign above using mouse or touch'}
        </p>
        {hasSignature && !disabled && (
          <button
            type="button"
            onClick={clearSignature}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Clear
          </button>
        )}
      </div>
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
