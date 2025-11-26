'use client'

import { useDraggable } from '@dnd-kit/core'
import { FIELD_PALETTE, PaletteItem, FieldType } from '@/types/form-builder'

interface DraggablePaletteItemProps {
  item: PaletteItem
}

function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: 'palette',
      fieldType: item.type,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span className="w-6 h-6 flex items-center justify-center text-gray-600 bg-gray-100 rounded">
        {item.icon}
      </span>
      <span className="text-sm text-gray-700">{item.label}</span>
    </div>
  )
}

interface FieldPaletteProps {
  onAddField?: (type: FieldType) => void
}

export default function FieldPalette({ onAddField }: FieldPaletteProps) {
  const categories = [
    { key: 'basic', label: 'Basic' },
    { key: 'input', label: 'Input' },
    { key: 'selection', label: 'Selection' },
    { key: 'media', label: 'Media' },
    { key: 'layout', label: 'Layout' },
  ] as const

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Field Types</h3>
      <p className="text-xs text-gray-500 mb-4">
        Drag fields to the canvas or click to add
      </p>

      {categories.map((category) => {
        const items = FIELD_PALETTE.filter((item) => item.category === category.key)
        if (items.length === 0) return null

        return (
          <div key={category.key} className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              {category.label}
            </h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.type}
                  onClick={() => onAddField?.(item.type)}
                >
                  <DraggablePaletteItem item={item} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
