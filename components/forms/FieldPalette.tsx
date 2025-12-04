'use client'

import { useDraggable } from '@dnd-kit/core'
import { fieldPalette } from './fields'

interface DraggablePaletteItemProps {
  type: string
  label: string
  icon: string
}

function DraggablePaletteItem({ type, label, icon }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: type,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-2 rounded-md cursor-grab hover:bg-gray-100 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  )
}

export default function FieldPalette() {
  const basicFields = fieldPalette.filter((f) => f.category === 'basic')
  const advancedFields = fieldPalette.filter((f) => f.category === 'advanced')
  const specializedFields = fieldPalette.filter((f) => f.category === 'specialized')
  const layoutFields = fieldPalette.filter((f) => f.category === 'layout')

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Field Types</h3>
      <p className="text-xs text-gray-500 mb-4">Drag fields to the form canvas</p>

      {/* Basic Fields */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Basic
        </h4>
        <div className="space-y-1">
          {basicFields.map((item) => (
            <DraggablePaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>
      </div>

      {/* Advanced Fields */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Advanced
        </h4>
        <div className="space-y-1">
          {advancedFields.map((item) => (
            <DraggablePaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>
      </div>

      {/* Specialized Fields */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Specialized
        </h4>
        <div className="space-y-1">
          {specializedFields.map((item) => (
            <DraggablePaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>
      </div>

      {/* Layout Elements */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Layout
        </h4>
        <div className="space-y-1">
          {layoutFields.map((item) => (
            <DraggablePaletteItem
              key={item.type}
              type={item.type}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
