'use client'

import { FormField } from './FieldEditor'

interface FormPreviewProps {
  fields: FormField[]
  title?: string
}

export default function FormPreview({ fields, title }: FormPreviewProps) {
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm"
          />
        )
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            disabled
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm"
          />
        )
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm"
          />
        )
      case 'select':
        return (
          <select
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm"
          >
            <option value="">Select an option</option>
            {(field.options || []).map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <div className="mt-1 flex items-center">
            <input
              type="checkbox"
              disabled
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-500">Yes</span>
          </div>
        )
      case 'date':
        return (
          <input
            type="date"
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm"
          />
        )
      case 'time':
        return (
          <input
            type="time"
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm"
          />
        )
      case 'signature':
        return (
          <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <p className="mt-2 text-xs text-gray-500">Signature pad</p>
          </div>
        )
      case 'photo':
        return (
          <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
            </svg>
            <p className="mt-2 text-xs text-gray-500">Photo upload</p>
          </div>
        )
      case 'section':
        return <hr className="my-2 border-gray-300" />
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">
          {title || 'Form Preview'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          This is how the form will appear to users
        </p>
      </div>

      <div className="p-6 space-y-6">
        {fields.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Add fields to see a preview
          </p>
        ) : (
          fields.map((field) => (
            <div key={field.id}>
              {field.type === 'section' ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {field.label}
                  </h4>
                  {renderField(field)}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {renderField(field)}
                  {field.helpText && (
                    <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
