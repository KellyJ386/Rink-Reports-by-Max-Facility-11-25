'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { FormField, FormSchema, FieldType, ConditionalRule, CalculatedField } from '@/types'
import { FieldPalette, fieldPaletteItems } from './FieldPalette'
import { FormCanvas } from './FormCanvas'
import { FieldConfigPanel } from './FieldConfigPanel'
import { FormPreview } from './FormPreview'
import { ConditionalLogicPanel } from './ConditionalLogicPanel'
import { CalculatedFieldsPanel } from './CalculatedFieldsPanel'

interface FormBuilderProps {
  initialSchema?: FormSchema
  onSave: (schema: FormSchema) => void
  onCancel: () => void
  formName: string
  onFormNameChange: (name: string) => void
  formDescription?: string
  onFormDescriptionChange: (description: string) => void
}

function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateFieldName(type: FieldType, existingFields: FormField[]): string {
  const baseName = type.replace(/([A-Z])/g, '_$1').toLowerCase()
  let counter = 1
  let name = baseName

  while (existingFields.some((f) => f.name === name)) {
    name = `${baseName}_${counter}`
    counter++
  }

  return name
}

export function FormBuilder({
  initialSchema,
  onSave,
  onCancel,
  formName,
  onFormNameChange,
  formDescription,
  onFormDescriptionChange,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(
    initialSchema?.sections?.[0]?.fields || []
  )
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showConditionalLogic, setShowConditionalLogic] = useState(false)
  const [showCalculatedFields, setShowCalculatedFields] = useState(false)
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>([])
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    // If dragging from palette
    if (active.id.toString().startsWith('palette-')) {
      const fieldType = active.data.current?.fieldType as FieldType
      const defaultConfig = active.data.current?.defaultConfig || {}
      const paletteItem = fieldPaletteItems.find((item) => item.type === fieldType)

      const newField: FormField = {
        id: generateFieldId(),
        type: fieldType,
        label: defaultConfig.label || paletteItem?.label || 'New Field',
        name: generateFieldName(fieldType, fields),
        ...defaultConfig,
      }

      setFields((prev) => [...prev, newField])
      setSelectedField(newField)
    }
    // If reordering within canvas
    else if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        if (oldIndex === -1 || newIndex === -1) return items

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleDeleteField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId))
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }, [selectedField])

  const handleUpdateField = useCallback((updatedField: FormField) => {
    setFields((prev) =>
      prev.map((f) => (f.id === updatedField.id ? updatedField : f))
    )
    setSelectedField(updatedField)
  }, [])

  const handleSave = () => {
    const schema: FormSchema = {
      sections: [
        {
          id: 'main',
          title: 'Main Section',
          fields,
        },
      ],
    }
    // Note: conditionalRules and calculatedFields are saved separately via API
    onSave(schema)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={formName}
              onChange={(e) => onFormNameChange(e.target.value)}
              placeholder="Form Name"
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
            />
            <input
              type="text"
              value={formDescription || ''}
              onChange={(e) => onFormDescriptionChange(e.target.value)}
              placeholder="Add a description..."
              className="text-sm text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0 w-full mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConditionalLogic(true)}
              className="btn btn-secondary text-sm"
              title="Conditional Logic"
            >
              🔀 Logic {conditionalRules.length > 0 && `(${conditionalRules.length})`}
            </button>
            <button
              onClick={() => setShowCalculatedFields(true)}
              className="btn btn-secondary text-sm"
              title="Calculated Fields"
            >
              🔢 Calc {calculatedFields.length > 0 && `(${calculatedFields.length})`}
            </button>
            <div className="border-l border-gray-300 h-6 mx-1" />
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn btn-secondary"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={onCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Save Form
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {showPreview ? (
          /* Preview mode */
          <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
            <FormPreview
              schema={{
                sections: [{ id: 'main', title: formName, description: formDescription, fields }],
              }}
              title={formName}
              description={formDescription}
              readOnly={true}
            />
          </div>
        ) : (
          /* Edit mode */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Field palette (left) */}
            <FieldPalette />

            {/* Form canvas (center) */}
            <FormCanvas
              fields={fields}
              selectedField={selectedField}
              onSelectField={setSelectedField}
              onDeleteField={handleDeleteField}
            />

            {/* Field config panel (right) */}
            {selectedField && (
              <FieldConfigPanel
                field={selectedField}
                onUpdate={handleUpdateField}
                onClose={() => setSelectedField(null)}
              />
            )}

            <DragOverlay>
              {activeId && activeId.startsWith('palette-') && (
                <div className="p-3 bg-white border-2 border-blue-400 rounded-lg shadow-lg">
                  <span className="text-sm font-medium">
                    {fieldPaletteItems.find((i) => `palette-${i.type}` === activeId)?.label}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Conditional Logic Panel */}
      {showConditionalLogic && (
        <ConditionalLogicPanel
          fields={fields}
          rules={conditionalRules}
          onRulesChange={setConditionalRules}
          onClose={() => setShowConditionalLogic(false)}
        />
      )}

      {/* Calculated Fields Panel */}
      {showCalculatedFields && (
        <CalculatedFieldsPanel
          fields={fields}
          calculatedFields={calculatedFields}
          onCalculatedFieldsChange={setCalculatedFields}
          onClose={() => setShowCalculatedFields(false)}
        />
      )}
    </div>
  )
}
