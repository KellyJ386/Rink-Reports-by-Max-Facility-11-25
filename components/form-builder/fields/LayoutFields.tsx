'use client'

import { FormField } from '@/types'

interface LayoutFieldProps {
  field: FormField
}

export function HeadingField({ field }: LayoutFieldProps) {
  return (
    <div className="field-wrapper w-full">
      <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  )
}

export function ParagraphField({ field }: LayoutFieldProps) {
  return (
    <div className="field-wrapper w-full">
      <p className="text-sm text-gray-600">{field.label}</p>
    </div>
  )
}

export function DividerField({ field }: LayoutFieldProps) {
  return (
    <div className="field-wrapper w-full py-2">
      <hr className="border-gray-200" />
    </div>
  )
}
