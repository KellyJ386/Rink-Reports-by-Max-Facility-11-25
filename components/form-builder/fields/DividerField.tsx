'use client'

import { FormField } from '@/types/form-builder'

interface DividerFieldProps {
  field: FormField
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function DividerField({
  field,
  isBuilder = false,
  isSelected = false,
  onClick,
}: DividerFieldProps) {
  const builderClasses = isBuilder
    ? `cursor-pointer transition-all p-2 rounded ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`
    : ''

  return (
    <div className={`w-full my-4 ${builderClasses}`} onClick={onClick}>
      <hr className="border-gray-300" />
    </div>
  )
}
