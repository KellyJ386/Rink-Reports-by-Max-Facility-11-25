'use client'

import { useState } from 'react'
import { SectionFieldConfig } from '@/types/forms'

interface SectionFieldProps {
  config: SectionFieldConfig
  children: React.ReactNode
}

export default function SectionField({ config, children }: SectionFieldProps) {
  const [isCollapsed, setIsCollapsed] = useState(config.defaultCollapsed || false)

  return (
    <div className="form-section border border-gray-200 rounded-lg mb-4">
      <div
        className={`flex items-center justify-between p-4 bg-gray-50 ${
          config.collapsible ? 'cursor-pointer hover:bg-gray-100' : ''
        } ${isCollapsed ? 'rounded-lg' : 'rounded-t-lg border-b border-gray-200'}`}
        onClick={() => config.collapsible && setIsCollapsed(!isCollapsed)}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
          {config.description && (
            <p className="text-sm text-gray-500 mt-1">{config.description}</p>
          )}
        </div>
        {config.collapsible && (
          <button
            type="button"
            className="p-1 text-gray-500 hover:text-gray-700"
            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      {!isCollapsed && <div className="p-4">{children}</div>}
    </div>
  )
}
