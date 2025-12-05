'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormField } from '@/types'
import { FieldRenderer } from './FieldRenderer'

interface SortableFieldProps {
  field: FormField
  onSelect: (field: FormField) => void
  onDelete: (fieldId: string) => void
  isSelected: boolean
}

function SortableField({ field, onSelect, onDelete, isSelected }: SortableFieldProps) {
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
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group p-4 bg-white border-2 rounded-lg transition-colors ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(field)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-1"
      >
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(field.id)
        }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700"
        title="Delete field"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Compliance badge */}
      {field.isCompliance && (
        <span className="absolute right-8 top-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
          Required
        </span>
      )}

      {/* Field preview */}
      <div className="pl-6 pr-8 pointer-events-none">
        <FieldRenderer
          field={field}
          value={field.defaultValue}
          onChange={() => {}}
          preview={true}
        />
      </div>
    </div>
  )
}

interface FormCanvasProps {
  fields: FormField[]
  selectedField: FormField | null
  onSelectField: (field: FormField | null) => void
  onDeleteField: (fieldId: string) => void
}

export function FormCanvas({ fields, selectedField, onSelectField, onDeleteField }: FormCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'form-canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-6 overflow-y-auto ${isOver ? 'bg-blue-50' : 'bg-gray-100'}`}
      onClick={() => onSelectField(null)}
    >
      <div className="max-w-3xl mx-auto">
        {fields.length === 0 ? (
          <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isOver ? 'border-blue-400 bg-blue-100' : 'border-gray-300'
          }`}>
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-gray-500 text-lg">Drag fields here to build your form</p>
            <p className="text-gray-400 text-sm mt-2">Or click on a field type from the left panel</p>
          </div>
        ) : (
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  onSelect={onSelectField}
                  onDelete={onDeleteField}
                  isSelected={selectedField?.id === field.id}
                />
              ))}

              {/* Drop zone at bottom */}
              {isOver && (
                <div className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg p-4 text-center text-blue-500">
                  Drop here to add field
                </div>
              )}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  )
}
