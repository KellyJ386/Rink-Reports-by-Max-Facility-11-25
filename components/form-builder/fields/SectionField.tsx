'use client'

import type { FormField } from '@/types/form-builder'

interface SectionFieldProps {
  field: FormField
}

export default function SectionField({ field }: SectionFieldProps) {
  return (
    <div className="w-full pt-4 pb-2">
      <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  )
}
