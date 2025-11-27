'use client'

import { useState } from 'react'
import type { FormSchema } from '@/types/form-builder'
import FieldRenderer from './fields'

interface FormPreviewProps {
  schema: FormSchema
  onClose: () => void
}

export default function FormPreview({ schema, onClose }: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form data:', formData)
    alert('Form submitted! Check console for data.')
  }

  // Flatten all fields from all sections
  const allFields = schema.sections.flatMap((section) => section.fields)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Form Preview</h2>
            <p className="text-sm text-gray-500">Preview how the form will appear to users</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit}>
            {schema.sections.map((section) => (
              <div key={section.id} className="mb-6">
                {section.title && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-sm text-gray-500">{section.description}</p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {section.fields.map((field) => (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      value={formData[field.id]}
                      onChange={(value) => handleFieldChange(field.id, value)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {allFields.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>No fields in this form yet</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={allFields.length === 0}
          >
            {schema.settings?.submitButtonText || 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
