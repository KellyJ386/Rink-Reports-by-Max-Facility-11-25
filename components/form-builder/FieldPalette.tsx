'use client'

import { useDraggable } from '@dnd-kit/core'
import { FIELD_PALETTE_ITEMS, FieldPaletteItem } from '@/types/form-builder'

interface DraggablePaletteItemProps {
  item: FieldPaletteItem
}

function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: 'palette-item',
      item
    }
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-300 hover:bg-blue-50 transition-colors ${
        isDragging ? 'opacity-50 border-blue-500' : ''
      }`}
    >
      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium text-gray-600">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{item.label}</div>
        <div className="text-xs text-gray-500 truncate">{item.description}</div>
      </div>
    </div>
  )
}

interface FieldPaletteProps {
  onAddField?: (item: FieldPaletteItem) => void
}

export default function FieldPalette({ onAddField }: FieldPaletteProps) {
  // Group fields by category
  const inputFields = FIELD_PALETTE_ITEMS.filter(f =>
    ['text', 'number', 'textarea', 'select', 'checkbox', 'radio'].includes(f.type)
  )
  const dateTimeFields = FIELD_PALETTE_ITEMS.filter(f =>
    ['date', 'time', 'datetime'].includes(f.type)
  )
  const specialFields = FIELD_PALETTE_ITEMS.filter(f =>
    ['signature', 'photo', 'calculated'].includes(f.type)
  )
  const layoutFields = FIELD_PALETTE_ITEMS.filter(f =>
    ['section', 'divider'].includes(f.type)
  )

  return (
    <div className="w-72 bg-gray-50 border-r h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Field Palette</h3>
        <p className="text-xs text-gray-500 mb-4">Drag fields onto the canvas</p>

        {/* Input Fields */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Input Fields
          </h4>
          <div className="space-y-2">
            {inputFields.map((item) => (
              <DraggablePaletteItem key={item.type} item={item} />
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Date & Time
          </h4>
          <div className="space-y-2">
            {dateTimeFields.map((item) => (
              <DraggablePaletteItem key={item.type} item={item} />
            ))}
          </div>
        </div>

        {/* Special Fields */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Special Fields
          </h4>
          <div className="space-y-2">
            {specialFields.map((item) => (
              <DraggablePaletteItem key={item.type} item={item} />
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Layout
          </h4>
          <div className="space-y-2">
            {layoutFields.map((item) => (
              <DraggablePaletteItem key={item.type} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
