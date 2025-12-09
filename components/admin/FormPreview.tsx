'use client'

import { useState } from 'react'
import { FieldConfig } from '@/types/forms'
import FormField from '@/components/forms/FormField'

interface FormPreviewProps {
  fields: FieldConfig[]
  formName: string
}

export default function FormPreview({ fields, formName }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleReset = () => {
    setValues({})
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Form Submitted!</h3>
          <p className="text-gray-500 mb-6">This is a preview - no data was actually saved.</p>

          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Submitted Values:</h4>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(values, null, 2)}
            </pre>
          </div>

          <button onClick={handleReset} className="btn btn-primary">
            Reset Preview
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        {/* Universal Header Preview */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{formName}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                className="input py-1.5 text-sm"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Time</label>
              <input
                type="time"
                className="input py-1.5 text-sm"
                defaultValue={new Date().toTimeString().slice(0, 5)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Outside Temp</label>
              <div className="flex">
                <input
                  type="number"
                  className="input py-1.5 text-sm rounded-r-none"
                  placeholder="--"
                />
                <span className="px-2 py-1.5 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-500">
                  °F
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Submitted By</label>
              <input
                type="text"
                className="input py-1.5 text-sm bg-gray-50"
                value="Demo User"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit}>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No fields to preview</p>
              <p className="text-sm">Add fields in the form builder to see them here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {fields.map((field) => (
                <FormField
                  key={field.id}
                  config={field}
                  value={values[field.id]}
                  onChange={(value) => handleChange(field.id, value)}
                />
              ))}
            </div>
          )}

          {fields.length > 0 && (
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button type="button" onClick={handleReset} className="btn btn-secondary">
                Reset
              </button>
              <button type="submit" className="btn btn-primary">
                Submit (Preview)
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="mt-4 text-center text-sm text-gray-400">
        This is a preview mode - submissions are not saved
      </div>
    </div>
  )
}
