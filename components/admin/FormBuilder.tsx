'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { FieldConfig, FieldType } from '@/types/forms'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import FieldConfigPanel from './FieldConfigPanel'

interface FormBuilderProps {
  initialFields?: FieldConfig[]
  moduleType: string
  onSave: (fields: FieldConfig[]) => Promise<void>
  onCancel: () => void
}

export default function FormBuilder({
  initialFields = [],
  moduleType,
  onSave,
  onCancel,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FieldConfig[]>(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // Check if dragging from palette (new field)
    if (active.id.toString().startsWith('palette_')) {
      const fieldType = active.id.toString().replace('palette_', '') as FieldType
      const newField = createDefaultField(fieldType)

      // Find position to insert
      const overIndex = fields.findIndex((f) => f.id === over.id)
      if (overIndex === -1) {
        // Drop at end
        setFields([...fields, newField])
      } else {
        // Insert at position
        const newFields = [...fields]
        newFields.splice(overIndex, 0, newField)
        setFields(newFields)
      }
      setSelectedFieldId(newField.id)
      return
    }

    // Reordering existing fields
    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((f) => f.id === active.id)
        const newIndex = items.findIndex((f) => f.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const createDefaultField = (type: FieldType): FieldConfig => {
    const id = generateFieldId()
    const baseConfig = {
      id,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      width: 'full' as const,
    }

    switch (type) {
      case 'text':
      case 'email':
      case 'phone':
        return { ...baseConfig, type }
      case 'number':
        return { ...baseConfig, type: 'number' }
      case 'textarea':
        return { ...baseConfig, type: 'textarea', rows: 4 }
      case 'select':
      case 'radio':
      case 'multiselect':
        return { ...baseConfig, type, options: [{ label: 'Option 1', value: 'option1' }] }
      case 'checkbox':
        return { ...baseConfig, type: 'checkbox' }
      case 'date':
      case 'time':
      case 'datetime':
        return { ...baseConfig, type }
      case 'section':
        return { ...baseConfig, type: 'section', collapsible: true }
      default:
        return { ...baseConfig, type: type as any }
    }
  }

  const handleAddField = (type: FieldType) => {
    const newField = createDefaultField(type)
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }

  const handleUpdateField = useCallback((fieldId: string, updates: Partial<FieldConfig>) => {
    setFields((current) =>
      current.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    )
  }, [])

  const handleDeleteField = useCallback((fieldId: string) => {
    setFields((current) => current.filter((f) => f.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }, [selectedFieldId])

  const handleDuplicateField = useCallback((fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (field) {
      const newField = {
        ...field,
        id: generateFieldId(),
        label: `${field.label} (copy)`,
      }
      const index = fields.findIndex((f) => f.id === fieldId)
      const newFields = [...fields]
      newFields.splice(index + 1, 0, newField)
      setFields(newFields)
      setSelectedFieldId(newField.id)
    }
  }, [fields])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(fields)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-200px)] gap-4">
        {/* Left Sidebar - Field Palette */}
        <div className="w-64 flex-shrink-0">
          <FieldPalette onAddField={handleAddField} />
        </div>

        {/* Center - Form Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <FormCanvas
                fields={fields}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onDeleteField={handleDeleteField}
                onDuplicateField={handleDuplicateField}
              />
            </SortableContext>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
            <div className="text-sm text-gray-500">
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary"
                disabled={isSaving || fields.length === 0}
              >
                {isSaving ? 'Saving...' : 'Save Form'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Field Configuration */}
        <div className="w-80 flex-shrink-0">
          <FieldConfigPanel
            field={selectedField}
            onUpdate={(updates) => selectedFieldId && handleUpdateField(selectedFieldId, updates)}
            onClose={() => setSelectedFieldId(null)}
          />
        </div>
      </div>

      <DragOverlay>
        {activeId && activeId.startsWith('palette_') && (
          <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg opacity-80">
            <span className="text-sm font-medium">
              {activeId.replace('palette_', '').charAt(0).toUpperCase() +
                activeId.replace('palette_', '').slice(1)}{' '}
              Field
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
