'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormSchema, FormSection, FormField } from '@/types/forms'

interface FormCanvasProps {
  schema: FormSchema
  selectedFieldId?: string
  onSelectField: (field: FormField, sectionId: string) => void
  onDeleteField: (sectionId: string, fieldId: string) => void
  onDuplicateField: (sectionId: string, fieldId: string) => void
}

interface SortableFieldItemProps {
  field: FormField
  sectionId: string
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SortableFieldItem({
  field,
  sectionId,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableFieldItemProps) {
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

  // Get icon for field type
  const getFieldIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: '📝',
      textarea: '📄',
      number: '🔢',
      decimal: '🔢',
      select: '📋',
      checkbox: '☑️',
      checkboxGroup: '☑️',
      radio: '🔘',
      date: '📅',
      time: '🕐',
      datetime: '📅',
      signature: '✍️',
      photo: '📷',
      file: '📎',
      temperature: '🌡️',
      measurement: '📏',
      heading: '📰',
      paragraph: '📝',
      section: '➖',
    }
    return icons[type] || '📝'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-md p-3 mb-2 cursor-pointer transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600"
          >
            ⠿
          </div>

          {/* Field Icon */}
          <span className="text-lg">{getFieldIcon(field.type)}</span>

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {field.label}
              {field.validation?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {field.type} • {field.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Duplicate"
          >
            📋
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

interface DroppableSectionProps {
  section: FormSection
  selectedFieldId?: string
  onSelectField: (field: FormField, sectionId: string) => void
  onDeleteField: (sectionId: string, fieldId: string) => void
  onDuplicateField: (sectionId: string, fieldId: string) => void
}

function DroppableSection({
  section,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onDuplicateField,
}: DroppableSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-4">
      {/* Section Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-medium text-gray-900">{section.title}</h3>
        {section.description && (
          <p className="text-sm text-gray-500 mt-1">{section.description}</p>
        )}
      </div>

      {/* Section Fields */}
      <div
        ref={setNodeRef}
        className={`p-3 min-h-[100px] transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        {section.fields.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Drag fields here</p>
          </div>
        ) : (
          <SortableContext
            items={section.fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {section.fields.map((field) => (
              <SortableFieldItem
                key={field.id}
                field={field}
                sectionId={section.id}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onSelectField(field, section.id)}
                onDelete={() => onDeleteField(section.id, field.id)}
                onDuplicate={() => onDuplicateField(section.id, field.id)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}

export default function FormCanvas({
  schema,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onDuplicateField,
}: FormCanvasProps) {
  return (
    <div>
      {schema.sections.map((section) => (
        <DroppableSection
          key={section.id}
          section={section}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onDeleteField={onDeleteField}
          onDuplicateField={onDuplicateField}
        />
      ))}
    </div>
  )
}
