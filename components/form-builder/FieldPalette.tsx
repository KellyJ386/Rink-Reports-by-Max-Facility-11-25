'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { FieldType, FieldPaletteItem } from '@/types'

// Field palette configuration
export const fieldPaletteItems: FieldPaletteItem[] = [
  // Basic fields
  {
    type: 'text',
    label: 'Text Input',
    icon: '✏️',
    category: 'basic',
    defaultConfig: { label: 'Text Field', placeholder: 'Enter text...' }
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: '📝',
    category: 'basic',
    defaultConfig: { label: 'Text Area', placeholder: 'Enter longer text...' }
  },
  {
    type: 'number',
    label: 'Number',
    icon: '🔢',
    category: 'basic',
    defaultConfig: { label: 'Number Field', placeholder: '0' }
  },
  {
    type: 'email',
    label: 'Email',
    icon: '📧',
    category: 'basic',
    defaultConfig: { label: 'Email', placeholder: 'email@example.com' }
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: '📱',
    category: 'basic',
    defaultConfig: { label: 'Phone Number', placeholder: '(555) 123-4567' }
  },

  // Choice fields
  {
    type: 'select',
    label: 'Dropdown',
    icon: '▼',
    category: 'choice',
    defaultConfig: {
      label: 'Dropdown',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' }
      ]
    }
  },
  {
    type: 'multiselect',
    label: 'Multi-Select',
    icon: '☑️',
    category: 'choice',
    defaultConfig: {
      label: 'Multi-Select',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' }
      ]
    }
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: '☑',
    category: 'choice',
    defaultConfig: { label: 'Checkbox' }
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: '⚪',
    category: 'choice',
    defaultConfig: {
      label: 'Radio Group',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ]
    }
  },

  // Date/Time fields
  {
    type: 'date',
    label: 'Date',
    icon: '📅',
    category: 'date',
    defaultConfig: { label: 'Date' }
  },
  {
    type: 'time',
    label: 'Time',
    icon: '🕐',
    category: 'date',
    defaultConfig: { label: 'Time' }
  },
  {
    type: 'datetime',
    label: 'Date & Time',
    icon: '📆',
    category: 'date',
    defaultConfig: { label: 'Date & Time' }
  },

  // Media fields
  {
    type: 'signature',
    label: 'Signature',
    icon: '✍️',
    category: 'media',
    defaultConfig: { label: 'Signature' }
  },
  {
    type: 'photo',
    label: 'Photo',
    icon: '📷',
    category: 'media',
    defaultConfig: { label: 'Photo', accept: 'image/*' }
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: '📎',
    category: 'media',
    defaultConfig: { label: 'File Upload' }
  },

  // Layout fields
  {
    type: 'heading',
    label: 'Heading',
    icon: '🔤',
    category: 'layout',
    defaultConfig: { label: 'Section Heading' }
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: '📄',
    category: 'layout',
    defaultConfig: { label: 'Enter descriptive text here...' }
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '➖',
    category: 'layout',
    defaultConfig: { label: '' }
  },

  // Specialized fields
  {
    type: 'iceDepthGrid',
    label: 'Ice Depth Grid',
    icon: '🧊',
    category: 'specialized' as const,
    defaultConfig: { label: 'Ice Depth Measurements', min: 0.75, max: 1.25 }
  },
  {
    type: 'bodyDiagram',
    label: 'Body Diagram',
    icon: '🏥',
    category: 'specialized' as const,
    defaultConfig: { label: 'Injury Location' }
  },
]

interface DraggablePaletteItemProps {
  item: FieldPaletteItem
}

function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: 'palette-item',
      fieldType: item.type,
      defaultConfig: item.defaultConfig,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-blue-400 hover:shadow-sm transition-all"
    >
      <span className="text-lg">{item.icon}</span>
      <span className="text-sm text-gray-700">{item.label}</span>
    </div>
  )
}

const categoryLabels: Record<string, string> = {
  basic: 'Basic Fields',
  choice: 'Choice Fields',
  date: 'Date & Time',
  media: 'Media',
  layout: 'Layout',
  specialized: 'Specialized',
}

export function FieldPalette() {
  const categories = ['basic', 'choice', 'date', 'media', 'layout', 'specialized'] as const

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-gray-900 mb-4">Field Types</h3>

      {categories.map((category) => (
        <div key={category} className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {categoryLabels[category]}
          </h4>
          <div className="space-y-2">
            {fieldPaletteItems
              .filter((item) => item.category === category)
              .map((item) => (
                <DraggablePaletteItem key={item.type} item={item} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
