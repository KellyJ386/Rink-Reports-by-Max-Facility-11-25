'use client'

import { useDraggable } from '@dnd-kit/core'
import { FIELD_PALETTE, type FieldType } from '@/types/form-builder'

interface DraggableFieldProps {
  type: FieldType
  label: string
  icon: string
}

function DraggableField({ type, label, icon }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: 'palette',
      fieldType: type,
    },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-mono">
        {icon}
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  )
}

export default function FieldPalette() {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Fields</h3>
      <div className="space-y-2">
        {FIELD_PALETTE.map((field) => (
          <DraggableField
            key={field.type}
            type={field.type}
            label={field.label}
            icon={field.icon}
          />
        ))}
      </div>
    </div>
  )
}
