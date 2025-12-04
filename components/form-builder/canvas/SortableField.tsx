'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { FormField } from '../types'
import { fieldRegistry } from '../fields'

interface SortableFieldProps {
  field: FormField
  sectionId: string
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<FormField>) => void
  onDelete: () => void
}

export function SortableField({
  field,
  sectionId,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: 'field',
      field,
      sectionId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const config = fieldRegistry[field.type]
  if (!config) {
    return <div>Unknown field type: {field.type}</div>
  }

  const EditComponent = config.EditComponent

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <EditComponent
        field={field}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={(updatedField) => onUpdate(updatedField)}
        onDelete={onDelete}
      />
    </div>
  )
}
