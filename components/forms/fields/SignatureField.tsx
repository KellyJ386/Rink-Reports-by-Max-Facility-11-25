'use client'

import { useState, useRef, useEffect } from 'react'
import { UseFormSetValue, FieldValues } from 'react-hook-form'
import type { SignatureFieldSchema } from '@/types/forms'
import { Button } from '@/components/ui/button'

interface SignatureFieldProps {
  field: SignatureFieldSchema
  setValue: UseFormSetValue<FieldValues>
  defaultValue?: string
  disabled?: boolean
}

export default function SignatureField({
  field,
  setValue,
  defaultValue,
  disabled = false,
}: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(!!defaultValue)
  const [signatureData, setSignatureData] = useState<string | null>(
    defaultValue || null
  )

  useEffect(() => {
    if (defaultValue && canvasRef.current) {
      // Load existing signature
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
        img.src = defaultValue
      }
    }
  }, [defaultValue])

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)

    const rect = canvas.getBoundingClientRect()
    const x =
      'touches' in e
        ? e.touches[0].clientX - rect.left
        : e.clientX - rect.left
    const y =
      'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x =
      'touches' in e
        ? e.touches[0].clientX - rect.left
        : e.clientX - rect.left
    const y =
      'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.strokeStyle = '#002244' // Navy color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return

    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.closePath()

    // Save signature as data URL
    const dataUrl = canvas.toDataURL('image/png')
    setSignatureData(dataUrl)
    setHasSignature(true)
    setValue(field.id, dataUrl)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
    setHasSignature(false)
    setValue(field.id, null)
  }

  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div className="border-2 border-wolf-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-auto touch-none ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
          }`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Instructions and controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-wolf-600">
          {hasSignature ? (
            <span className="text-action-green-600 flex items-center gap-1">
              <span>✓</span> Signature captured
            </span>
          ) : (
            <span>
              {disabled
                ? 'Signature pad disabled'
                : 'Sign above using mouse or touch'}
            </span>
          )}
          {field.required && !hasSignature && (
            <span className="text-red-500 ml-2">* Required</span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={disabled || !hasSignature}
        >
          Clear
        </Button>
      </div>

      {/* Help text */}
      {field.helpText && (
        <p className="text-sm text-wolf-500">{field.helpText}</p>
      )}
    </div>
  )
}
