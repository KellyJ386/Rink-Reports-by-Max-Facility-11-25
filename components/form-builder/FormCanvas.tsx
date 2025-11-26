'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormField, FormSection } from '@/types/form-builder'
import { FieldRenderer } from './fields'

interface SortableFieldProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function SortableField({ field, isSelected, onSelect, onDelete }: SortableFieldProps) {
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
      className={`relative group ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag handle and actions */}
      <div
        className={`absolute -left-8 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          isSelected ? 'opacity-100' : ''
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          ⋮⋮
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600"
          title="Delete field"
        >
          ×
        </button>
      </div>

      <FieldRenderer
        field={field}
        isBuilder={true}
        isSelected={isSelected}
        onClick={onSelect}
      />
    </div>
  )
}

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
    id: 'form-canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-8 overflow-y-auto ${
        isOver ? 'bg-blue-50' : 'bg-white'
      }`}
      onClick={() => onSelectField(null)}
    >
      <div className="max-w-3xl mx-auto">
        {/* Form header placeholder */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Form Preview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Drag fields from the palette or click to add them to your form
          </p>
        </div>

        {fields.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <p className="text-gray-500 mb-2">
              {isOver ? 'Drop field here' : 'No fields yet'}
            </p>
            <p className="text-sm text-gray-400">
              Drag fields from the left panel or click to add
            </p>
          </div>
        ) : (
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="pl-8 space-y-2">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field.id)}
                  onDelete={() => onDeleteField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        )}

        {/* Drop zone at bottom when there are fields */}
        {fields.length > 0 && (
          <div
            className={`mt-4 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-400">
              {isOver ? 'Drop here to add field' : 'Drop new fields here'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
