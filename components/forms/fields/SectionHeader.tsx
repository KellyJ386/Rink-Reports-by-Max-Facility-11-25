'use client'

import { FormField } from '@/types/forms'

interface SectionHeaderProps {
  field: FormField
}

export default function SectionHeader({ field }: SectionHeaderProps) {
  if (field.type === 'heading') {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          {field.label}
        </h3>
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
      </div>
    )
  }

  if (field.type === 'paragraph') {
    return (
      <div className="w-full">
        <p className="text-sm text-gray-700">{field.label}</p>
      </div>
    )
  }

  // Section divider
  return (
    <div className="w-full py-2">
      <hr className="border-gray-200" />
    </div>
  )
}
