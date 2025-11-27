'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormField } from '@/types/form-builder'
import FieldRenderer from '../fields'

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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        onClick={onSelect}
        className={`p-4 bg-white border-2 rounded-lg transition-colors cursor-pointer ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="text-gray-400">⋮⋮</span>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-2 top-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>

        {/* Field preview */}
        <div className="ml-6">
          <FieldRenderer field={field} preview />
        </div>

        {/* Lock indicator */}
        {field.isLocked && (
          <div className="absolute right-8 top-2 text-gray-400 text-sm">
            🔒
          </div>
        )}
      </div>
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
    id: 'canvas',
  })

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
      <div
        ref={setNodeRef}
        className={`max-w-3xl mx-auto min-h-[500px] p-6 bg-white rounded-xl shadow-sm border-2 border-dashed transition-colors ${
          isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
        }`}
      >
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium">Drag fields here to build your form</p>
            <p className="text-sm mt-2">Or click on a field type in the sidebar</p>
          </div>
        ) : (
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
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
      </div>
    </div>
  )
}
