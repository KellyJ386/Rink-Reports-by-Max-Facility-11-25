'use client'

import { useState } from 'react'
import { FormSection } from '@/types/form-builder'

interface SectionFieldProps {
  section: FormSection
  children?: React.ReactNode
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function SectionField({
  section,
  children,
  isBuilder = false,
  isSelected = false,
  onClick,
}: SectionFieldProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.isCollapsed || false)

  const builderClasses = isBuilder
    ? `cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'
      }`
    : ''

  return (
    <div
      className={`w-full bg-gray-50 rounded-lg border border-gray-200 mb-4 ${builderClasses}`}
      onClick={onClick}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 ${
          section.isCollapsible ? 'cursor-pointer' : ''
        }`}
        onClick={(e) => {
          if (section.isCollapsible && !isBuilder) {
            e.stopPropagation()
            setIsCollapsed(!isCollapsed)
          }
        }}
      >
        <div>
          <h3 className="font-semibold text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-gray-500 mt-1">{section.description}</p>
          )}
        </div>
        {section.isCollapsible && (
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation()
              setIsCollapsed(!isCollapsed)
            }}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        )}
      </div>
      {(!section.isCollapsible || !isCollapsed) && (
        <div className="px-4 pb-4">{children}</div>
      )}
    </div>
  )
}
