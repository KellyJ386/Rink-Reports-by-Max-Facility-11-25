'use client'

import { useDraggable } from '@dnd-kit/core'
import { FieldType } from '@/types/forms'

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void
}

interface FieldTypeDefinition {
  type: FieldType
  label: string
  icon: string
  description: string
}

const FIELD_CATEGORIES = [
  {
    name: 'Basic Fields',
    fields: [
      { type: 'text', label: 'Text', icon: 'Aa', description: 'Single line text' },
      { type: 'textarea', label: 'Text Area', icon: '¶', description: 'Multi-line text' },
      { type: 'number', label: 'Number', icon: '#', description: 'Numeric input' },
      { type: 'email', label: 'Email', icon: '@', description: 'Email address' },
      { type: 'phone', label: 'Phone', icon: '☎', description: 'Phone number' },
    ] as FieldTypeDefinition[],
  },
  {
    name: 'Choice Fields',
    fields: [
      { type: 'select', label: 'Dropdown', icon: '▼', description: 'Single selection' },
      { type: 'radio', label: 'Radio', icon: '◉', description: 'Radio buttons' },
      { type: 'multiselect', label: 'Multi-Select', icon: '☑', description: 'Multiple selections' },
      { type: 'checkbox', label: 'Checkbox', icon: '✓', description: 'Yes/No toggle' },
    ] as FieldTypeDefinition[],
  },
  {
    name: 'Date & Time',
    fields: [
      { type: 'date', label: 'Date', icon: '📅', description: 'Date picker' },
      { type: 'time', label: 'Time', icon: '🕐', description: 'Time picker' },
      { type: 'datetime', label: 'Date/Time', icon: '📆', description: 'Date and time' },
    ] as FieldTypeDefinition[],
  },
  {
    name: 'Media & Files',
    fields: [
      { type: 'photo', label: 'Photo', icon: '📷', description: 'Photo capture' },
      { type: 'signature', label: 'Signature', icon: '✍', description: 'Digital signature' },
      { type: 'file', label: 'File Upload', icon: '📎', description: 'File attachment' },
    ] as FieldTypeDefinition[],
  },
  {
    name: 'Layout',
    fields: [
      { type: 'section', label: 'Section', icon: '▤', description: 'Group fields' },
    ] as FieldTypeDefinition[],
  },
  {
    name: 'Specialized',
    fields: [
      { type: 'ice-depth-grid', label: 'Ice Depth Grid', icon: '❄', description: 'Rink measurement' },
      { type: 'body-diagram', label: 'Body Diagram', icon: '👤', description: 'Injury location' },
    ] as FieldTypeDefinition[],
  },
]

function DraggableFieldType({ field, onAddField }: { field: FieldTypeDefinition; onAddField: (type: FieldType) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette_${field.type}`,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAddField(field.type)}
      className={`
        flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing
        border border-transparent hover:border-blue-200 hover:bg-blue-50
        transition-colors select-none
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-sm font-medium">
        {field.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{field.label}</div>
        <div className="text-xs text-gray-500 truncate">{field.description}</div>
      </div>
    </div>
  )
}

export default function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg h-full overflow-hidden flex flex-col">
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Fields</h3>
        <p className="text-xs text-gray-500 mt-1">Drag or click to add</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {FIELD_CATEGORIES.map((category) => (
          <div key={category.name} className="mb-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">
              {category.name}
            </div>
            <div className="space-y-1">
              {category.fields.map((field) => (
                <DraggableFieldType key={field.type} field={field} onAddField={onAddField} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
