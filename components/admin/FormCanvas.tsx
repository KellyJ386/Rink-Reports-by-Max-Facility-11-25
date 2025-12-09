'use client'

import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FieldConfig } from '@/types/forms'

interface FormCanvasProps {
  fields: FieldConfig[]
  selectedFieldId: string | null
  onSelectField: (id: string | null) => void
  onDeleteField: (id: string) => void
  onDuplicateField: (id: string) => void
}

interface SortableFieldProps {
  field: FieldConfig
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

const FIELD_TYPE_ICONS: Record<string, string> = {
  text: 'Aa',
  email: '@',
  phone: '☎',
  number: '#',
  textarea: '¶',
  select: '▼',
  multiselect: '☑',
  radio: '◉',
  checkbox: '✓',
  date: '📅',
  time: '🕐',
  datetime: '📆',
  photo: '📷',
  signature: '✍',
  file: '📎',
  section: '▤',
  'ice-depth-grid': '❄',
  'body-diagram': '👤',
}

function SortableField({ field, isSelected, onSelect, onDelete, onDuplicate }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative bg-white border-2 rounded-lg p-4 mb-3
        transition-all cursor-pointer
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </div>

      {/* Field Content */}
      <div className="ml-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{FIELD_TYPE_ICONS[field.type] || '?'}</span>
          <span className="font-medium text-gray-900">{field.label}</span>
          {field.required && <span className="text-red-500 text-sm">*</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-gray-100 rounded">{field.type}</span>
          {field.description && <span className="truncate">{field.description}</span>}
        </div>

        {/* Field Preview */}
        <div className="mt-3 pointer-events-none">
          <FieldPreview field={field} />
        </div>
      </div>

      {/* Actions */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate()
          }}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Duplicate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function FieldPreview({ field }: { field: FieldConfig }) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <input
          type="text"
          className="input bg-gray-50"
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          disabled
        />
      )
    case 'textarea':
      return (
        <textarea
          className="input bg-gray-50"
          rows={2}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          disabled
        />
      )
    case 'select':
      return (
        <select className="input bg-gray-50" disabled>
          <option>Select an option...</option>
        </select>
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" disabled />
          <span className="text-sm text-gray-600">{(field as any).checkboxLabel || field.label}</span>
        </div>
      )
    case 'radio':
      return (
        <div className="space-y-1">
          {((field as any).options || []).slice(0, 2).map((opt: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" className="h-4 w-4" disabled />
              <span className="text-sm text-gray-600">{opt.label}</span>
            </div>
          ))}
        </div>
      )
    case 'date':
      return <input type="date" className="input bg-gray-50" disabled />
    case 'time':
      return <input type="time" className="input bg-gray-50" disabled />
    case 'section':
      return (
        <div className="border border-dashed border-gray-300 rounded p-3 text-center text-gray-400 text-sm">
          Section content goes here
        </div>
      )
    case 'photo':
    case 'signature':
    case 'file':
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm">
          {field.type === 'photo' ? 'Photo capture area' : field.type === 'signature' ? 'Signature pad' : 'File drop zone'}
        </div>
      )
    case 'ice-depth-grid':
      return (
        <div className="border border-gray-200 rounded-lg p-4 text-center bg-blue-50 text-blue-600 text-sm">
          Ice Depth Grid Visualization
        </div>
      )
    case 'body-diagram':
      return (
        <div className="border border-gray-200 rounded-lg p-4 text-center bg-amber-50 text-amber-600 text-sm">
          Body Diagram for Injury Marking
        </div>
      )
    default:
      return null
  }
}

export default function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onDuplicateField,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-gray-50 border-2 border-dashed rounded-lg p-4 min-h-[400px]
        transition-colors
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
      `}
      onClick={() => onSelectField(null)}
    >
      {fields.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-1">No fields yet</p>
          <p className="text-sm">Drag fields from the left panel or click to add</p>
        </div>
      ) : (
        <div onClick={(e) => e.stopPropagation()}>
          {fields.map((field) => (
            <SortableField
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              onSelect={() => onSelectField(field.id)}
              onDelete={() => onDeleteField(field.id)}
              onDuplicate={() => onDuplicateField(field.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
