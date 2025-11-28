'use client'

import type { FormField } from '@/types/form-builder'

interface LayoutFieldProps {
  field: FormField
}

export function HeadingField({ field }: LayoutFieldProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
      {field.helpText && <p className="text-sm text-gray-600 mt-1">{field.helpText}</p>}
    </div>
  )
}

export function ParagraphField({ field }: LayoutFieldProps) {
  return (
    <div className="w-full">
      <p className="text-sm text-gray-700">{field.label}</p>
    </div>
  )
}

export function DividerField() {
  return (
    <div className="w-full py-2">
      <hr className="border-gray-300" />
    </div>
  )
}
