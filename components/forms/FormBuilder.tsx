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
  DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { FormSchema, FormSection, FormField, FieldType } from '@/types/forms'
import { fieldPalette } from './fields'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import FieldEditor from './FieldEditor'

interface FormBuilderProps {
  initialSchema?: FormSchema
  onSave: (schema: FormSchema) => void
  onCancel: () => void
}

// Generate unique ID
const generateId = () => `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export default function FormBuilder({
  initialSchema,
  onSave,
  onCancel,
}: FormBuilderProps) {
  // Form schema state
  const [schema, setSchema] = useState<FormSchema>(
    initialSchema || {
      sections: [
        {
          id: 'section-default',
          title: 'Form Fields',
          fields: [],
        },
      ],
    }
  )

  // Currently selected field for editing
  const [selectedField, setSelectedField] = useState<{
    field: FormField
    sectionId: string
  } | null>(null)

  // Active drag item
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<any>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Check if dragging from palette
    const paletteItem = fieldPalette.find((p) => p.type === active.id)
    if (paletteItem) {
      setActiveItem({ type: 'palette', item: paletteItem })
      return
    }

    // Otherwise, find the field being dragged
    for (const section of schema.sections) {
      const field = section.fields.find((f) => f.id === active.id)
      if (field) {
        setActiveItem({ type: 'field', item: field, sectionId: section.id })
        break
      }
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setActiveItem(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dropping from palette
    const paletteItem = fieldPalette.find((p) => p.type === activeId)
    if (paletteItem) {
      // Create new field from palette item
      const newField: FormField = {
        id: generateId(),
        type: paletteItem.type as FieldType,
        label: paletteItem.label,
        name: `field_${Date.now()}`,
        validation: {},
      }

      // Add default options for select/radio/checkbox types
      if (['select', 'radio', 'checkboxGroup', 'multiselect'].includes(paletteItem.type)) {
        newField.options = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ]
      }

      // Find target section
      let targetSectionId = schema.sections[0].id
      let insertIndex = 0

      // Check if dropping over a field or section
      for (const section of schema.sections) {
        if (section.id === overId) {
          targetSectionId = section.id
          insertIndex = section.fields.length
          break
        }
        const fieldIndex = section.fields.findIndex((f) => f.id === overId)
        if (fieldIndex !== -1) {
          targetSectionId = section.id
          insertIndex = fieldIndex + 1
          break
        }
      }

      // Add field to section
      setSchema((prev) => ({
        ...prev,
        sections: prev.sections.map((section) => {
          if (section.id === targetSectionId) {
            const newFields = [...section.fields]
            newFields.splice(insertIndex, 0, newField)
            return { ...section, fields: newFields }
          }
          return section
        }),
      }))

      // Select the new field for editing
      setSelectedField({ field: newField, sectionId: targetSectionId })
      return
    }

    // Reordering existing fields
    if (activeId !== overId) {
      // Find source and target
      let sourceSection: FormSection | null = null
      let sourceIndex = -1
      let targetSection: FormSection | null = null
      let targetIndex = -1

      for (const section of schema.sections) {
        const sIndex = section.fields.findIndex((f) => f.id === activeId)
        if (sIndex !== -1) {
          sourceSection = section
          sourceIndex = sIndex
        }
        const tIndex = section.fields.findIndex((f) => f.id === overId)
        if (tIndex !== -1) {
          targetSection = section
          targetIndex = tIndex
        }
        if (section.id === overId) {
          targetSection = section
          targetIndex = section.fields.length
        }
      }

      if (sourceSection && targetSection && sourceIndex !== -1) {
        if (sourceSection.id === targetSection.id) {
          // Same section - reorder
          setSchema((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
              if (section.id === sourceSection!.id) {
                return {
                  ...section,
                  fields: arrayMove(section.fields, sourceIndex, targetIndex),
                }
              }
              return section
            }),
          }))
        } else {
          // Different sections - move
          const movedField = sourceSection.fields[sourceIndex]
          setSchema((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
              if (section.id === sourceSection!.id) {
                return {
                  ...section,
                  fields: section.fields.filter((f) => f.id !== activeId),
                }
              }
              if (section.id === targetSection!.id) {
                const newFields = [...section.fields]
                newFields.splice(targetIndex, 0, movedField)
                return { ...section, fields: newFields }
              }
              return section
            }),
          }))
        }
      }
    }
  }

  // Update field properties
  const updateField = useCallback((sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            fields: section.fields.map((field) => {
              if (field.id === fieldId) {
                const updatedField = { ...field, ...updates }
                // Update selected field if it's the one being edited
                setSelectedField((current) => {
                  if (current?.field.id === fieldId) {
                    return { field: updatedField, sectionId }
                  }
                  return current
                })
                return updatedField
              }
              return field
            }),
          }
        }
        return section
      }),
    }))
  }, [])

  // Delete field
  const deleteField = useCallback((sectionId: string, fieldId: string) => {
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            fields: section.fields.filter((f) => f.id !== fieldId),
          }
        }
        return section
      }),
    }))
    setSelectedField(null)
  }, [])

  // Duplicate field
  const duplicateField = useCallback((sectionId: string, fieldId: string) => {
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id === sectionId) {
          const fieldIndex = section.fields.findIndex((f) => f.id === fieldId)
          if (fieldIndex !== -1) {
            const originalField = section.fields[fieldIndex]
            const newField = {
              ...originalField,
              id: generateId(),
              name: `${originalField.name}_copy`,
              label: `${originalField.label} (Copy)`,
            }
            const newFields = [...section.fields]
            newFields.splice(fieldIndex + 1, 0, newField)
            return { ...section, fields: newFields }
          }
        }
        return section
      }),
    }))
  }, [])

  // Add section
  const addSection = () => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      fields: [],
    }
    setSchema((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
  }

  // Handle save
  const handleSave = () => {
    onSave(schema)
  }

  return (
    <div className="flex h-full bg-gray-100">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Left Panel - Field Palette */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <FieldPalette />
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Form Builder</h2>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                >
                  Save Form
                </button>
              </div>
            </div>

            {/* Form Canvas */}
            <FormCanvas
              schema={schema}
              selectedFieldId={selectedField?.field.id}
              onSelectField={(field, sectionId) => setSelectedField({ field, sectionId })}
              onDeleteField={deleteField}
              onDuplicateField={duplicateField}
            />

            {/* Add Section Button */}
            <button
              onClick={addSection}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              + Add Section
            </button>
          </div>
        </div>

        {/* Right Panel - Field Editor */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          {selectedField ? (
            <FieldEditor
              field={selectedField.field}
              sectionId={selectedField.sectionId}
              onUpdate={updateField}
              onClose={() => setSelectedField(null)}
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm">Select a field to edit its properties</p>
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && (
            <div className="bg-white border border-blue-500 rounded-md p-3 shadow-lg opacity-90">
              <span className="mr-2">{activeItem.item.icon || '📝'}</span>
              {activeItem.item.label}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
