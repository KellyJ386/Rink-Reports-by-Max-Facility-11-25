'use client'

import { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { FormSection } from '../types'

interface SortableSectionProps {
  section: FormSection
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<FormSection>) => void
  onDelete: () => void
  children: ReactNode
}

export function SortableSection({
  section,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  children,
}: SortableSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: 'section',
      section,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : isOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-transparent hover:border-gray-200'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div className="cursor-grab text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            </svg>
          </div>

          {/* Section title - editable when selected */}
          {isSelected ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
              autoFocus
            />
          ) : (
            <h3 className="font-semibold text-gray-900">{section.title}</h3>
          )}
        </div>

        {/* Section actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
          </span>
          {isSelected && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-red-500 hover:text-red-700 p-1"
              title="Delete section"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Section description */}
      {isSelected && (
        <div className="px-4 py-2 border-b bg-gray-50">
          <input
            type="text"
            value={section.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add section description (optional)"
            className="w-full text-sm text-gray-600 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
          />
        </div>
      )}

      {/* Section fields */}
      <div className="p-4">{children}</div>
    </div>
  )
}
