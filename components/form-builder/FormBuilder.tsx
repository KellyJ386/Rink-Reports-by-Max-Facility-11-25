'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { FormField, FormSchema, FieldDefinition } from '@/types/form-builder'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import FieldConfigPanel from './FieldConfigPanel'

interface FormBuilderProps {
  initialSchema?: FormSchema
  onSave: (schema: FormSchema) => Promise<void>
  templateName: string
  onNameChange: (name: string) => void
}

function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function createFieldFromDefinition(definition: FieldDefinition): FormField {
  return {
    id: generateId(),
    type: definition.type,
    label: definition.label,
    name: `${definition.type}_${Date.now()}`,
    width: 'full',
    ...definition.defaultConfig,
  }
}

export default function FormBuilder({
  initialSchema,
  onSave,
  templateName,
  onNameChange,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(
    initialSchema?.sections?.[0]?.fields || []
  )
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // Dropping from palette
    if (active.data.current?.type === 'palette') {
      const definition = active.data.current.definition as FieldDefinition
      const newField = createFieldFromDefinition(definition)

      if (over.id === 'canvas') {
        setFields([...fields, newField])
      } else {
        // Find position and insert
        const overIndex = fields.findIndex((f) => f.id === over.id)
        if (overIndex >= 0) {
          const newFields = [...fields]
          newFields.splice(overIndex, 0, newField)
          setFields(newFields)
        } else {
          setFields([...fields, newField])
        }
      }
      setSelectedFieldId(newField.id)
      return
    }

    // Reordering within canvas
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      if (oldIndex >= 0 && newIndex >= 0) {
        setFields(arrayMove(fields, oldIndex, newIndex))
      }
    }
  }

  const handleDeleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
    if (selectedFieldId === id) {
      setSelectedFieldId(null)
    }
  }, [selectedFieldId])

  const handleUpdateField = useCallback((updatedField: FormField) => {
    setFields((prev) =>
      prev.map((f) => (f.id === updatedField.id ? updatedField : f))
    )
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const schema: FormSchema = {
        sections: [
          {
            id: 'main',
            title: 'Main Section',
            fields,
          },
        ],
      }
      await onSave(schema)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={templateName}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              placeholder="Form Template Name"
            />
            <span className="text-sm text-gray-500">
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !templateName.trim()}
              className="btn btn-primary disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <FieldPalette />
          <FormCanvas
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onDeleteField={handleDeleteField}
          />
          <FieldConfigPanel
            field={selectedField}
            allFields={fields}
            onUpdate={handleUpdateField}
            onClose={() => setSelectedFieldId(null)}
          />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && activeId.startsWith('palette-') ? (
          <div className="p-3 bg-white border-2 border-blue-400 rounded-lg shadow-lg">
            <span className="text-sm font-medium text-gray-700">
              Dragging field...
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
