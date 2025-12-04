'use client'

import { useDraggable } from '@dnd-kit/core'
import { getFieldsByCategory, fieldRegistry } from './fields'
import type { FieldType, FieldTypeConfig } from './types'

interface DraggablePaletteItemProps {
  config: FieldTypeConfig
}

function DraggablePaletteItem({ config }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${config.type}`,
    data: {
      type: 'palette-item',
      fieldType: config.type,
    },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-2 rounded-lg border cursor-grab transition-all ${
        isDragging
          ? 'opacity-50 border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <div className="text-gray-600">{config.icon}</div>
      <span className="text-sm font-medium text-gray-700">{config.label}</span>
    </div>
  )
}

interface FieldPaletteProps {
  className?: string
}

export function FieldPalette({ className = '' }: FieldPaletteProps) {
  const categories = getFieldsByCategory()

  const categoryLabels: Record<string, string> = {
    basic: 'Basic Fields',
    choice: 'Choice Fields',
    date: 'Date & Time',
    media: 'Media',
    special: 'Specialized',
    layout: 'Layout',
  }

  const categoryOrder: (keyof typeof categories)[] = [
    'basic',
    'choice',
    'date',
    'media',
    'special',
    'layout',
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">Field Types</h3>
      <p className="text-sm text-gray-500 mb-4">
        Drag fields to the form canvas
      </p>

      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const fields = categories[category]
          if (fields.length === 0) return null

          return (
            <div key={category}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {categoryLabels[category]}
              </h4>
              <div className="space-y-2">
                {fields.map((config) => (
                  <DraggablePaletteItem key={config.type} config={config} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Non-draggable version for quick add
interface FieldPaletteButtonsProps {
  onAddField: (type: FieldType) => void
  className?: string
}

export function FieldPaletteButtons({ onAddField, className = '' }: FieldPaletteButtonsProps) {
  const categories = getFieldsByCategory()

  const categoryLabels: Record<string, string> = {
    basic: 'Basic',
    choice: 'Choice',
    date: 'Date & Time',
    media: 'Media',
    special: 'Specialized',
    layout: 'Layout',
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-4">Add Field</h3>

      <div className="space-y-4">
        {Object.entries(categories).map(([category, fields]) => {
          if (fields.length === 0) return null

          return (
            <div key={category}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {categoryLabels[category]}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {fields.map((config) => (
                  <button
                    key={config.type}
                    type="button"
                    onClick={() => onAddField(config.type)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="text-gray-600">{config.icon}</div>
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
