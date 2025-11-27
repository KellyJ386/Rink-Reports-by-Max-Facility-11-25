'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { FormField, FormSchema, FieldType } from '@/types/form-builder'
import { createDefaultField } from '@/types/form-builder'
import FieldPalette from './canvas/FieldPalette'
import FormCanvas from './canvas/FormCanvas'
import FieldConfigPanel from './config/FieldConfigPanel'
import FieldRenderer from './fields'

interface FormBuilderProps {
  initialSchema?: FormSchema
  onSave: (schema: FormSchema) => void
  onPreview?: () => void
  isLoading?: boolean
}

export default function FormBuilder({
  initialSchema,
  onSave,
  onPreview,
  isLoading = false,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(
    initialSchema?.sections[0]?.fields || []
  )
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<FieldType | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Check if dragging from palette
    if (active.data.current?.type === 'palette') {
      setActiveDragType(active.data.current.fieldType)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      setActiveDragType(null)

      if (!over) return

      // Dropping from palette
      if (active.data.current?.type === 'palette') {
        const fieldType = active.data.current.fieldType as FieldType
        const newField = createDefaultField(fieldType, fields.length)
        setFields([...fields, newField])
        setSelectedFieldId(newField.id)
        return
      }

      // Reordering within canvas
      if (active.id !== over.id) {
        setFields((items) => {
          const oldIndex = items.findIndex((i) => i.id === active.id)
          const newIndex = items.findIndex((i) => i.id === over.id)
          const reordered = arrayMove(items, oldIndex, newIndex)
          // Update order values
          return reordered.map((item, index) => ({ ...item, order: index }))
        })
      }
    },
    [fields]
  )

  const handleUpdateField = useCallback((updatedField: FormField) => {
    setFields((prev) =>
      prev.map((f) => (f.id === updatedField.id ? updatedField : f))
    )
  }, [])

  const handleDeleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedFieldId === id) {
      setSelectedFieldId(null)
    }
  }, [selectedFieldId])

  const handleSave = () => {
    const schema: FormSchema = {
      sections: [
        {
          id: 'main',
          title: 'Main Section',
          fields,
          order: 0,
        },
      ],
      settings: {
        requireSignature: false,
        allowDraft: true,
        autoSave: true,
        submitButtonText: 'Submit',
      },
    }
    onSave(schema)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
        {/* Field Palette */}
        <FieldPalette />

        {/* Form Canvas */}
        <FormCanvas
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelectField={setSelectedFieldId}
          onDeleteField={handleDeleteField}
        />

        {/* Configuration Panel */}
        <FieldConfigPanel
          field={selectedField}
          onUpdate={handleUpdateField}
          onClose={() => setSelectedFieldId(null)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {fields.length} field{fields.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-3">
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="btn btn-secondary"
            >
              Preview
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || fields.length === 0}
            className="btn btn-primary"
          >
            {isLoading ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && activeDragType && (
          <div className="p-4 bg-white border-2 border-blue-400 rounded-lg shadow-lg opacity-80">
            <FieldRenderer
              field={createDefaultField(activeDragType, 0)}
              preview
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
