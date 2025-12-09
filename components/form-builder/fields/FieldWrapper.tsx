'use client'

import { ReactNode } from 'react'
import type { FormField } from '../types'

interface FieldWrapperProps {
  field: FormField
  children: ReactNode
  error?: string
  className?: string
}

export function FieldWrapper({ field, children, error, className = '' }: FieldWrapperProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {field.type !== 'checkbox' && field.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Edit mode wrapper with selection and actions
interface FieldEditWrapperProps {
  field: FormField
  children: ReactNode
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

export function FieldEditWrapper({
  field,
  children,
  isSelected,
  onSelect,
  onDelete,
}: FieldEditWrapperProps) {
  return (
    <div
      className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Field type badge */}
      <div className="absolute -top-2 left-2 px-2 py-0.5 text-xs font-medium bg-gray-100 rounded text-gray-600">
        {field.type}
      </div>

      {/* Delete button */}
      {isSelected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Delete field"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Drag handle */}
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-8 flex items-center justify-center cursor-grab text-gray-400 hover:text-gray-600">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </div>

      {/* Field preview */}
      <div className="pointer-events-none opacity-75">
        {children}
      </div>

      {/* Required indicator */}
      {field.required && (
        <div className="absolute top-1 right-1">
          <span className="text-xs text-red-500 font-medium">Required</span>
        </div>
      )}
    </div>
  )
}
