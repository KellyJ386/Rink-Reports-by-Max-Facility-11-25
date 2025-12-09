'use client'

import { useDraggable } from '@dnd-kit/core'
import { FIELD_DEFINITIONS, type FieldDefinition } from '@/types/form-builder'

interface DraggableFieldProps {
  definition: FieldDefinition
}

function DraggableField({ definition }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: {
      type: 'palette',
      fieldType: definition.type,
      definition,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-blue-400 hover:shadow-sm transition-all ${
        isDragging ? 'opacity-50 cursor-grabbing' : ''
      }`}
    >
      <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-sm font-medium text-gray-600">
        {definition.icon}
      </span>
      <span className="text-sm text-gray-700">{definition.label}</span>
    </div>
  )
}

export default function FieldPalette() {
  const categories = [
    { key: 'input', label: 'Input Fields' },
    { key: 'selection', label: 'Selection Fields' },
    { key: 'media', label: 'Media Fields' },
    { key: 'layout', label: 'Layout Elements' },
  ] as const

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Field Types</h3>

      {categories.map((category) => {
        const fields = FIELD_DEFINITIONS.filter((f) => f.category === category.key)
        if (fields.length === 0) return null

        return (
          <div key={category.key} className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {category.label}
            </h4>
            <div className="space-y-2">
              {fields.map((definition) => (
                <DraggableField key={definition.type} definition={definition} />
              ))}
            </div>
          </div>
        )
      })}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Drag fields onto the canvas to build your form.
        </p>
      </div>
    </div>
  )
}
