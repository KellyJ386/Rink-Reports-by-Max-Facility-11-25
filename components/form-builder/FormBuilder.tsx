'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { FormSchema, FormField, FieldType } from './types'
import { FormCanvas } from './canvas/FormCanvas'
import { FieldPalette } from './FieldPalette'
import { FieldConfigPanel } from './FieldConfigPanel'
import { createField } from './fields'

interface FormBuilderProps {
  initialSchema?: FormSchema
  onChange?: (schema: FormSchema) => void
  onSave?: (schema: FormSchema) => void
}

export function FormBuilder({ initialSchema, onChange, onSave }: FormBuilderProps) {
  const [schema, setSchema] = useState<FormSchema>(
    initialSchema || {
      sections: [
        {
          id: 'section_default',
          title: 'General Information',
          fields: [],
        },
      ],
    }
  )
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Get selected field
  const selectedField = selectedFieldId
    ? schema.sections
        .flatMap((s) => s.fields)
        .find((f) => f.id === selectedFieldId)
    : null

  // Handle schema changes
  const handleSchemaChange = useCallback(
    (newSchema: FormSchema) => {
      setSchema(newSchema)
      onChange?.(newSchema)
    },
    [onChange]
  )

  // Handle field selection
  const handleFieldSelect = useCallback((fieldId: string | null, sectionId: string | null) => {
    setSelectedFieldId(fieldId)
    setSelectedSectionId(sectionId)
  }, [])

  // Handle field update from config panel
  const handleFieldUpdate = useCallback(
    (updates: Partial<FormField>) => {
      if (!selectedFieldId || !selectedSectionId) return

      const newSchema = { ...schema }
      newSchema.sections = schema.sections.map((section) => {
        if (section.id !== selectedSectionId) return section
        return {
          ...section,
          fields: section.fields.map((field) => {
            if (field.id !== selectedFieldId) return field
            return { ...field, ...updates }
          }),
        }
      })
      handleSchemaChange(newSchema)
    },
    [schema, selectedFieldId, selectedSectionId, handleSchemaChange]
  )

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // Handle dropping a palette item
      if (activeId.startsWith('palette-')) {
        const fieldType = activeId.replace('palette-', '') as FieldType
        const newField = createField(fieldType)

        // Find which section to add to
        let targetSectionId: string | null = null

        // Check if dropping on a section
        const targetSection = schema.sections.find((s) => s.id === overId)
        if (targetSection) {
          targetSectionId = targetSection.id
        } else {
          // Check if dropping on a field - find its section
          for (const section of schema.sections) {
            if (section.fields.some((f) => f.id === overId)) {
              targetSectionId = section.id
              break
            }
          }
        }

        // Default to first section if no target found
        if (!targetSectionId && schema.sections.length > 0) {
          targetSectionId = schema.sections[0].id
        }

        if (targetSectionId) {
          const newSchema = { ...schema }
          newSchema.sections = schema.sections.map((section) => {
            if (section.id !== targetSectionId) return section

            // Find insertion index
            let insertIndex = section.fields.length
            if (overId !== section.id) {
              const fieldIndex = section.fields.findIndex((f) => f.id === overId)
              if (fieldIndex !== -1) {
                insertIndex = fieldIndex + 1
              }
            }

            const newFields = [...section.fields]
            newFields.splice(insertIndex, 0, newField)

            return {
              ...section,
              fields: newFields,
            }
          })
          handleSchemaChange(newSchema)
          setSelectedFieldId(newField.id)
          setSelectedSectionId(targetSectionId)
        }
        return
      }

      // Handle reordering existing fields
      if (activeId !== overId) {
        // Find source and target sections
        let sourceSection: string | null = null
        let targetSection: string | null = null
        let sourceIndex = -1
        let targetIndex = -1

        for (const section of schema.sections) {
          const sourceIdx = section.fields.findIndex((f) => f.id === activeId)
          if (sourceIdx !== -1) {
            sourceSection = section.id
            sourceIndex = sourceIdx
          }

          // Check if dropping on section itself
          if (section.id === overId) {
            targetSection = section.id
            targetIndex = section.fields.length
          } else {
            const targetIdx = section.fields.findIndex((f) => f.id === overId)
            if (targetIdx !== -1) {
              targetSection = section.id
              targetIndex = targetIdx
            }
          }
        }

        if (sourceSection && targetSection && sourceIndex !== -1) {
          const newSchema = { ...schema }

          if (sourceSection === targetSection) {
            // Same section - simple reorder
            newSchema.sections = schema.sections.map((section) => {
              if (section.id !== sourceSection) return section
              return {
                ...section,
                fields: arrayMove(section.fields, sourceIndex, targetIndex),
              }
            })
          } else {
            // Different sections - move between
            const fieldToMove = schema.sections
              .find((s) => s.id === sourceSection)
              ?.fields[sourceIndex]

            if (fieldToMove) {
              newSchema.sections = schema.sections.map((section) => {
                if (section.id === sourceSection) {
                  return {
                    ...section,
                    fields: section.fields.filter((f) => f.id !== activeId),
                  }
                }
                if (section.id === targetSection) {
                  const newFields = [...section.fields]
                  newFields.splice(targetIndex, 0, fieldToMove)
                  return {
                    ...section,
                    fields: newFields,
                  }
                }
                return section
              })
            }
          }

          handleSchemaChange(newSchema)
        }
      }
    },
    [schema, handleSchemaChange]
  )

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Can be used for visual feedback during drag
  }, [])

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="h-full flex gap-4">
        {/* Left panel - Field Palette */}
        <div className="w-64 flex-shrink-0">
          <FieldPalette />
        </div>

        {/* Center - Form Canvas */}
        <div className="flex-1 min-w-0">
          <FormCanvas
            schema={schema}
            selectedFieldId={selectedFieldId}
            selectedSectionId={selectedSectionId}
            activeId={activeId}
            onSchemaChange={handleSchemaChange}
            onFieldSelect={handleFieldSelect}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          />
        </div>

        {/* Right panel - Field Configuration */}
        <div className="w-80 flex-shrink-0">
          {selectedField ? (
            <FieldConfigPanel
              field={selectedField}
              allFields={schema.sections.flatMap((s) => s.fields)}
              onUpdate={handleFieldUpdate}
              onClose={() => handleFieldSelect(null, null)}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-4 h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <p className="text-sm">Select a field to configure</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndContext>
  )
}
