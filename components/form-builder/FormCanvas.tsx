'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FormSchema, FormSection, FormField } from '@/types/form-builder'

interface SortableFieldProps {
  field: FormField
  sectionId: string
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function SortableField({ field, sectionId, isSelected, onSelect, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: field.id,
    data: {
      type: 'field',
      field,
      sectionId
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const getFieldIcon = (type: string) => {
    const icons: Record<string, string> = {
      text: 'Aa',
      number: '#',
      textarea: '¶',
      select: '▼',
      checkbox: '☑',
      radio: '◉',
      date: '📅',
      time: '🕐',
      datetime: '📆',
      signature: '✍',
      photo: '📷',
      calculated: 'fx',
      section: '§',
      divider: '—'
    }
    return icons[type] || '?'
  }

  const getWidthClass = (width?: string) => {
    switch (width) {
      case 'half': return 'w-1/2'
      case 'third': return 'w-1/3'
      case 'quarter': return 'w-1/4'
      default: return 'w-full'
    }
  }

  if (field.type === 'divider') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`w-full py-2 ${isDragging ? 'opacity-50' : ''}`}
      >
        <div
          onClick={onSelect}
          className={`border-t-2 border-dashed cursor-pointer ${
            isSelected ? 'border-blue-500' : 'border-gray-300 hover:border-gray-400'
          }`}
          {...attributes}
          {...listeners}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getWidthClass(field.width)} p-1 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        onClick={onSelect}
        className={`relative group border rounded-lg p-3 cursor-pointer transition-colors ${
          isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute right-1 top-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>

        {/* Field Content */}
        <div className="ml-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
              {getFieldIcon(field.type)}
            </span>
            <span className="text-sm font-medium text-gray-900">{field.label}</span>
            {field.required && (
              <span className="text-red-500 text-xs">*</span>
            )}
          </div>

          {/* Field Preview */}
          <div className="mt-2">
            {field.type === 'text' && (
              <input
                type="text"
                placeholder={field.placeholder || 'Text input...'}
                disabled
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400"
              />
            )}
            {field.type === 'number' && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder={field.placeholder || '0'}
                  disabled
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400"
                />
                {field.unit && (
                  <span className="text-xs text-gray-500">{field.unit}</span>
                )}
              </div>
            )}
            {field.type === 'textarea' && (
              <textarea
                placeholder={field.placeholder || 'Text area...'}
                disabled
                rows={2}
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400 resize-none"
              />
            )}
            {field.type === 'select' && (
              <select
                disabled
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400"
              >
                <option>{field.placeholder || 'Select an option...'}</option>
              </select>
            )}
            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <input type="checkbox" disabled className="rounded" />
                {field.placeholder || 'Checkbox option'}
              </label>
            )}
            {field.type === 'radio' && (
              <div className="space-y-1">
                {(field.options?.length ? field.options : [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]).slice(0, 2).map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <input type="radio" disabled name={field.id} />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
            {['date', 'time', 'datetime'].includes(field.type) && (
              <input
                type={field.type === 'datetime' ? 'datetime-local' : field.type}
                disabled
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400"
              />
            )}
            {field.type === 'signature' && (
              <div className="h-16 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                Signature Area
              </div>
            )}
            {field.type === 'photo' && (
              <div className="h-16 border border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400">
                📷 Photo Upload
              </div>
            )}
            {field.type === 'calculated' && (
              <div className="px-2 py-1 text-sm border border-gray-200 rounded bg-yellow-50 text-gray-400 flex items-center gap-2">
                <span className="text-xs bg-yellow-200 px-1 rounded">fx</span>
                <span>Calculated value</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SortableSectionProps {
  section: FormSection
  isSelected: boolean
  selectedFieldId: string | null
  onSelectSection: () => void
  onSelectField: (fieldId: string) => void
  onDeleteField: (fieldId: string) => void
  onDeleteSection: () => void
}

function SortableSection({
  section,
  isSelected,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onDeleteField,
  onDeleteSection
}: SortableSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: {
      type: 'section',
      sectionId: section.id
    }
  })

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div
        onClick={onSelectSection}
        className={`flex items-center justify-between p-3 rounded-t-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <div>
          <h3 className="font-medium">{section.title || 'Untitled Section'}</h3>
          {section.description && (
            <p className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
              {section.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
            {section.fields.length} fields
          </span>
          {section.fields.length === 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteSection() }}
              className={`ml-2 px-2 py-1 text-xs rounded ${
                isSelected ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Section Fields */}
      <div
        ref={setNodeRef}
        className={`min-h-[100px] p-4 border-2 border-t-0 rounded-b-lg transition-colors ${
          isOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 bg-white'
        }`}
      >
        {section.fields.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Drag fields here
          </div>
        ) : (
          <SortableContext
            items={section.fields.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-wrap -m-1">
              {section.fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  sectionId={section.id}
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

interface FormCanvasProps {
  schema: FormSchema
  selectedSectionId: string | null
  selectedFieldId: string | null
  onSelectSection: (sectionId: string) => void
  onSelectField: (fieldId: string) => void
  onDeleteField: (sectionId: string, fieldId: string) => void
  onDeleteSection: (sectionId: string) => void
  onAddSection: () => void
}

export default function FormCanvas({
  schema,
  selectedSectionId,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onDeleteField,
  onDeleteSection,
  onAddSection
}: FormCanvasProps) {
  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Form Header Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{schema.title || 'Untitled Form'}</h2>
          {schema.description && (
            <p className="text-gray-600 mt-2">{schema.description}</p>
          )}
        </div>

        {/* Sections */}
        <SortableContext
          items={schema.sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {schema.sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              isSelected={selectedSectionId === section.id}
              selectedFieldId={selectedFieldId}
              onSelectSection={() => onSelectSection(section.id)}
              onSelectField={onSelectField}
              onDeleteField={(fieldId) => onDeleteField(section.id, fieldId)}
              onDeleteSection={() => onDeleteSection(section.id)}
            />
          ))}
        </SortableContext>

        {/* Add Section Button */}
        <button
          onClick={onAddSection}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          + Add Section
        </button>
      </div>
    </div>
  )
}
