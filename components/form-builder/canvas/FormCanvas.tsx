'use client'

import { useCallback } from 'react'
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { FormSchema, FormSection, FormField, FieldType } from '../types'
import { SortableField } from './SortableField'
import { SortableSection } from './SortableSection'
import { fieldRegistry, createField } from '../fields'

interface FormCanvasProps {
  schema: FormSchema
  selectedFieldId: string | null
  selectedSectionId: string | null
  activeId: string | null
  onSchemaChange: (schema: FormSchema) => void
  onFieldSelect: (fieldId: string | null, sectionId: string | null) => void
  onDragStart: (event: DragStartEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  onDragOver: (event: DragOverEvent) => void
}

export function FormCanvas({
  schema,
  selectedFieldId,
  selectedSectionId,
  activeId,
  onSchemaChange,
  onFieldSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
}: FormCanvasProps) {
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

  // Handle field update
  const handleFieldUpdate = useCallback(
    (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
      const newSchema = { ...schema }
      newSchema.sections = schema.sections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          fields: section.fields.map((field) => {
            if (field.id !== fieldId) return field
            return { ...field, ...updates }
          }),
        }
      })
      onSchemaChange(newSchema)
    },
    [schema, onSchemaChange]
  )

  // Handle field delete
  const handleFieldDelete = useCallback(
    (sectionId: string, fieldId: string) => {
      const newSchema = { ...schema }
      newSchema.sections = schema.sections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          fields: section.fields.filter((field) => field.id !== fieldId),
        }
      })
      onSchemaChange(newSchema)
      if (selectedFieldId === fieldId) {
        onFieldSelect(null, null)
      }
    },
    [schema, selectedFieldId, onSchemaChange, onFieldSelect]
  )

  // Handle section update
  const handleSectionUpdate = useCallback(
    (sectionId: string, updates: Partial<FormSection>) => {
      const newSchema = { ...schema }
      newSchema.sections = schema.sections.map((section) => {
        if (section.id !== sectionId) return section
        return { ...section, ...updates }
      })
      onSchemaChange(newSchema)
    },
    [schema, onSchemaChange]
  )

  // Handle section delete
  const handleSectionDelete = useCallback(
    (sectionId: string) => {
      const newSchema = { ...schema }
      newSchema.sections = schema.sections.filter((section) => section.id !== sectionId)
      onSchemaChange(newSchema)
      if (selectedSectionId === sectionId) {
        onFieldSelect(null, null)
      }
    },
    [schema, selectedSectionId, onSchemaChange, onFieldSelect]
  )

  // Add new section
  const addSection = useCallback(() => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      fields: [],
    }
    onSchemaChange({
      ...schema,
      sections: [...schema.sections, newSection],
    })
  }, [schema, onSchemaChange])

  // Get dragged item for overlay
  const getDraggedItem = () => {
    if (!activeId) return null

    // Check if it's a palette item
    if (typeof activeId === 'string' && activeId.startsWith('palette-')) {
      const fieldType = activeId.replace('palette-', '') as FieldType
      const config = fieldRegistry[fieldType]
      if (config) {
        const EditComponent = config.EditComponent
        const tempField = createField(fieldType)
        return (
          <div className="opacity-80 bg-white shadow-lg rounded-lg p-2">
            <EditComponent
              field={tempField}
              isSelected={false}
              onSelect={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          </div>
        )
      }
    }

    // Check if it's an existing field
    for (const section of schema.sections) {
      const field = section.fields.find((f) => f.id === activeId)
      if (field) {
        const config = fieldRegistry[field.type]
        if (config) {
          const EditComponent = config.EditComponent
          return (
            <div className="opacity-80 bg-white shadow-lg rounded-lg p-2">
              <EditComponent
                field={field}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            </div>
          )
        }
      }
    }

    return null
  }

  // Get all field IDs for sortable context
  const getAllFieldIds = () => {
    const ids: string[] = []
    schema.sections.forEach((section) => {
      ids.push(section.id)
      section.fields.forEach((field) => {
        ids.push(field.id)
      })
    })
    return ids
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <div
        className="min-h-[600px] bg-gray-50 rounded-lg p-4"
        onClick={() => onFieldSelect(null, null)}
      >
        {schema.sections.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">Start building your form</p>
            <p className="text-sm mb-4">Drag fields from the left panel or add a section</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                addSection()
              }}
              className="btn btn-primary"
            >
              Add Section
            </button>
          </div>
        ) : (
          <SortableContext items={getAllFieldIds()} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {schema.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id && !selectedFieldId}
                  onSelect={() => onFieldSelect(null, section.id)}
                  onUpdate={(updates) => handleSectionUpdate(section.id, updates)}
                  onDelete={() => handleSectionDelete(section.id)}
                >
                  <SortableContext
                    items={section.fields.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 min-h-[50px]">
                      {section.fields.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400">
                          <p className="text-sm">Drop fields here</p>
                        </div>
                      ) : (
                        section.fields.map((field) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            sectionId={section.id}
                            isSelected={selectedFieldId === field.id}
                            onSelect={() => onFieldSelect(field.id, section.id)}
                            onUpdate={(updates) => handleFieldUpdate(section.id, field.id, updates)}
                            onDelete={() => handleFieldDelete(section.id, field.id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </SortableSection>
              ))}

              {/* Add section button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  addSection()
                }}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                + Add Section
              </button>
            </div>
          </SortableContext>
        )}
      </div>

      <DragOverlay>{getDraggedItem()}</DragOverlay>
    </DndContext>
  )
}
