'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { FormField } from '@/types/form-builder'
import SortableField from './SortableField'
import { FieldRenderer } from './fields'

interface FormCanvasProps {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (id: string | null) => void
  onDeleteField: (id: string) => void
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-6 overflow-y-auto ${
        isOver ? 'bg-blue-50' : 'bg-white'
      }`}
      onClick={() => onSelectField(null)}
    >
      <div className="max-w-3xl mx-auto">
        {fields.length === 0 ? (
          <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isOver ? 'border-blue-400 bg-blue-100' : 'border-gray-300'
          }`}>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Start building your form
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Drag fields from the palette on the left to add them here.
            </p>
          </div>
        ) : (
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field.id)}
                  onDelete={() => onDeleteField(field.id)}
                >
                  <FieldRenderer
                    field={field}
                    value={field.defaultValue}
                    onChange={() => {}}
                    disabled
                  />
                </SortableField>
              ))}
            </div>
          </SortableContext>
        )}

        {/* Drop zone indicator when dragging */}
        {isOver && fields.length > 0 && (
          <div className="mt-4 border-2 border-dashed border-blue-400 rounded-lg p-4 text-center text-blue-600">
            Drop here to add field
          </div>
        )}
      </div>
    </div>
  )
}
