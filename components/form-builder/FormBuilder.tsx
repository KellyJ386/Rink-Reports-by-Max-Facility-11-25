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
  DragEndEvent
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import FieldPalette from './FieldPalette'
import FormCanvas from './FormCanvas'
import FieldConfigPanel from './FieldConfigPanel'
import {
  FormSchema,
  FormField,
  FormSection,
  FieldPaletteItem,
  generateFieldId,
  generateSectionId,
  createFieldFromPalette
} from '@/types/form-builder'

interface FormBuilderProps {
  schema: FormSchema
  onChange: (schema: FormSchema) => void
  readOnly?: boolean
}

export default function FormBuilder({ schema, onChange, readOnly = false }: FormBuilderProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    schema.sections[0]?.id || null
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activePaletteItem, setActivePaletteItem] = useState<FieldPaletteItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Find field by ID across all sections
  const findField = useCallback((fieldId: string): { field: FormField; sectionId: string } | null => {
    for (const section of schema.sections) {
      const field = section.fields.find(f => f.id === fieldId)
      if (field) {
        return { field, sectionId: section.id }
      }
    }
    return null
  }, [schema])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Check if it's a palette item
    if (active.data.current?.type === 'palette-item') {
      setActivePaletteItem(active.data.current.item)
    }
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)
    setActivePaletteItem(null)

    if (!over) return

    // Handle dropping from palette
    if (active.data.current?.type === 'palette-item') {
      const paletteItem = active.data.current.item as FieldPaletteItem
      let targetSectionId: string

      // Determine target section
      if (over.data.current?.type === 'section') {
        targetSectionId = over.data.current.sectionId
      } else if (over.data.current?.type === 'field') {
        targetSectionId = over.data.current.sectionId
      } else if (over.id.toString().startsWith('section-')) {
        targetSectionId = over.id.toString().replace('section-', '')
      } else {
        // Default to first section
        targetSectionId = schema.sections[0]?.id
      }

      if (!targetSectionId) return

      // Handle section type specially
      if (paletteItem.type === 'section') {
        addSection()
        return
      }

      // Create new field
      const targetSection = schema.sections.find(s => s.id === targetSectionId)
      if (!targetSection) return

      const newField = createFieldFromPalette(paletteItem, targetSection.fields.length)

      // Add field to section
      const newSections = schema.sections.map(section => {
        if (section.id === targetSectionId) {
          return {
            ...section,
            fields: [...section.fields, newField]
          }
        }
        return section
      })

      onChange({ ...schema, sections: newSections })
      setSelectedFieldId(newField.id)
      setSelectedSectionId(targetSectionId)
      return
    }

    // Handle reordering existing fields
    if (active.data.current?.type === 'field' && over.data.current) {
      const activeFieldId = active.id as string
      const activeData = findField(activeFieldId)

      if (!activeData) return

      let targetSectionId: string
      let targetIndex: number

      if (over.data.current.type === 'section') {
        targetSectionId = over.data.current.sectionId
        const targetSection = schema.sections.find(s => s.id === targetSectionId)
        targetIndex = targetSection?.fields.length || 0
      } else if (over.data.current.type === 'field') {
        targetSectionId = over.data.current.sectionId
        const targetSection = schema.sections.find(s => s.id === targetSectionId)
        targetIndex = targetSection?.fields.findIndex(f => f.id === over.id) || 0
      } else {
        return
      }

      // Move field
      const newSections = schema.sections.map(section => {
        // Remove from source section
        if (section.id === activeData.sectionId) {
          return {
            ...section,
            fields: section.fields.filter(f => f.id !== activeFieldId)
          }
        }
        return section
      }).map(section => {
        // Add to target section
        if (section.id === targetSectionId) {
          const newFields = [...section.fields]
          newFields.splice(targetIndex, 0, activeData.field)
          return {
            ...section,
            fields: newFields.map((f, i) => ({ ...f, order: i }))
          }
        }
        return section
      })

      onChange({ ...schema, sections: newSections })
    }
  }

  // Add new section
  const addSection = () => {
    const newSection: FormSection = {
      id: generateSectionId(),
      title: `Section ${schema.sections.length + 1}`,
      fields: [],
      order: schema.sections.length
    }
    onChange({
      ...schema,
      sections: [...schema.sections, newSection]
    })
    setSelectedSectionId(newSection.id)
  }

  // Delete section
  const deleteSection = (sectionId: string) => {
    if (schema.sections.length <= 1) return // Keep at least one section
    const newSections = schema.sections
      .filter(s => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i }))
    onChange({ ...schema, sections: newSections })
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(newSections[0]?.id || null)
    }
  }

  // Delete field
  const deleteField = (sectionId: string, fieldId: string) => {
    const newSections = schema.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields
            .filter(f => f.id !== fieldId)
            .map((f, i) => ({ ...f, order: i }))
        }
      }
      return section
    })
    onChange({ ...schema, sections: newSections })
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }

  // Update field
  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    const newSections = schema.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map(field => {
            if (field.id === fieldId) {
              return { ...field, ...updates }
            }
            return field
          })
        }
      }
      return section
    })
    onChange({ ...schema, sections: newSections })
  }

  // Update section
  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    const newSections = schema.sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, ...updates }
      }
      return section
    })
    onChange({ ...schema, sections: newSections })
  }

  // Update form settings
  const updateSettings = (updates: Partial<FormSchema['settings']>) => {
    onChange({
      ...schema,
      settings: { ...schema.settings, ...updates }
    })
  }

  if (readOnly) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Template Locked</h3>
          <p className="text-gray-500">
            This template contains compliance-required fields and cannot be edited.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex">
        {/* Left: Field Palette */}
        <FieldPalette />

        {/* Center: Form Canvas */}
        <FormCanvas
          schema={schema}
          selectedSectionId={selectedSectionId}
          selectedFieldId={selectedFieldId}
          onSelectSection={setSelectedSectionId}
          onSelectField={(fieldId) => {
            setSelectedFieldId(fieldId)
            // Also select the parent section
            const fieldData = findField(fieldId)
            if (fieldData) {
              setSelectedSectionId(fieldData.sectionId)
            }
          }}
          onDeleteField={deleteField}
          onDeleteSection={deleteSection}
          onAddSection={addSection}
        />

        {/* Right: Config Panel */}
        <FieldConfigPanel
          schema={schema}
          selectedFieldId={selectedFieldId}
          selectedSectionId={selectedSectionId}
          onUpdateField={updateField}
          onUpdateSection={updateSection}
          onUpdateSettings={updateSettings}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activePaletteItem && (
          <div className="flex items-center gap-3 p-3 bg-white border-2 border-blue-500 rounded-lg shadow-lg">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-sm font-medium text-blue-600">
              {activePaletteItem.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{activePaletteItem.label}</div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
