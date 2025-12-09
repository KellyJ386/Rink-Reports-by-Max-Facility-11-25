'use client'

import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldEditWrapper } from './FieldWrapper'

// Section header - Render mode
export function SectionFieldRender({ field }: FieldRenderProps) {
  return (
    <div className="mb-6 mt-8 first:mt-0">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
        {field.label}
      </h3>
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  )
}

// Section header - Edit mode
export function SectionFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <div className="py-2">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          {field.label || 'Section Title'}
        </h3>
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
      </div>
    </FieldEditWrapper>
  )
}
