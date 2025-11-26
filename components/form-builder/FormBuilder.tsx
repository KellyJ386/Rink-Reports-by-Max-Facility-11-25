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
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import {
  FormField,
  FormSchema,
  FieldType,
  createDefaultField,
  FIELD_PALETTE,
} from '@/types/form-builder'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import FieldConfigPanel from './FieldConfigPanel'
import { FieldRenderer } from './fields'

interface FormBuilderProps {
  initialSchema?: FormSchema
  onChange?: (schema: FormSchema) => void
  onSave?: (schema: FormSchema) => void
  isPreviewMode?: boolean
}

export default function FormBuilder({
  initialSchema,
  onChange,
  onSave,
  isPreviewMode = false,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(
    initialSchema?.fields as FormField[] || []
  )
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null

  // Update fields and notify parent
  const updateFields = useCallback(
    (newFields: FormField[]) => {
      setFields(newFields)
      setIsDirty(true)
      onChange?.({
        version: initialSchema?.version || 1,
        fields: newFields,
      })
    },
    [onChange, initialSchema]
  )

  // Add a new field
  const addField = useCallback(
    (type: FieldType) => {
      const newField = createDefaultField(type, fields.length)
      const newFields = [...fields, newField]
      updateFields(newFields)
      setSelectedFieldId(newField.id)
    },
    [fields, updateFields]
  )

  // Delete a field
  const deleteField = useCallback(
    (id: string) => {
      const newFields = fields.filter((f) => f.id !== id)
      // Reorder remaining fields
      newFields.forEach((f, i) => (f.order = i))
      updateFields(newFields)
      if (selectedFieldId === id) {
        setSelectedFieldId(null)
      }
    },
    [fields, selectedFieldId, updateFields]
  )

  // Update a field
  const updateField = useCallback(
    (updatedField: FormField) => {
      const newFields = fields.map((f) =>
        f.id === updatedField.id ? updatedField : f
      )
      updateFields(newFields)
    },
    [fields, updateFields]
  )

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (!over) return

    const activeData = active.data.current

    // Dragging from palette
    if (activeData?.type === 'palette') {
      const fieldType = activeData.fieldType as FieldType
      addField(fieldType)
      return
    }

    // Reordering existing fields
    if (active.id !== over.id && over.id !== 'form-canvas') {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = arrayMove(fields, oldIndex, newIndex)
        // Update order values
        newFields.forEach((f, i) => (f.order = i))
        updateFields(newFields)
      }
    }
  }

  // Handle save
  const handleSave = () => {
    onSave?.({
      version: initialSchema?.version || 1,
      fields,
    })
    setIsDirty(false)
  }

  // Get the active field for drag overlay
  const getActiveField = () => {
    if (!activeId) return null

    // Check if it's a palette item
    if (activeId.startsWith('palette-')) {
      const type = activeId.replace('palette-', '') as FieldType
      return createDefaultField(type, 0)
    }

    // Otherwise it's an existing field
    return fields.find((f) => f.id === activeId)
  }

  if (isPreviewMode) {
    return <FormPreview fields={fields} />
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        {/* Left: Field Palette */}
        <FieldPalette onAddField={addField} />

        {/* Center: Form Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {fields.length} field{fields.length !== 1 ? 's' : ''}
              </span>
              {isDirty && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Form
              </button>
            </div>
          </div>

          {/* Canvas */}
          <FormCanvas
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onDeleteField={deleteField}
          />
        </div>

        {/* Right: Field Config Panel */}
        <FieldConfigPanel
          field={selectedField}
          onUpdate={updateField}
          onClose={() => setSelectedFieldId(null)}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && getActiveField() && (
          <div className="opacity-80 bg-white shadow-lg rounded-lg p-2">
            <FieldRenderer field={getActiveField()!} isBuilder={true} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Simple preview mode
interface FormPreviewProps {
  fields: FormField[]
}

function FormPreview({ fields }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, any>>({})

  const handleChange = (fieldName: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6">Form Preview</h2>
        <div className="flex flex-wrap">
          {fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.name]}
              onChange={(value) => handleChange(field.name, value)}
            />
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
