'use client'

import { useState } from 'react'
import type { ShiftTemplate, CreateShiftTemplateInput, RecurrencePattern } from '@/types/schedule'
import { SHIFT_COLORS } from '@/types/schedule'
import { formatTimeDisplay, calculateDuration, formatDuration } from '@/lib/schedule-utils'

interface ShiftTemplateManagerProps {
  templates: ShiftTemplate[]
  onCreateTemplate: (template: CreateShiftTemplateInput) => Promise<void>
  onUpdateTemplate: (id: string, template: Partial<CreateShiftTemplateInput>) => Promise<void>
  onDeleteTemplate: (id: string) => Promise<void>
  onDuplicateTemplate: (id: string) => Promise<void>
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
]

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
  { value: 'NONE', label: 'No recurrence' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
]

export function ShiftTemplateManager({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}: ShiftTemplateManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateShiftTemplateInput>({
    name: '',
    description: '',
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 30,
    color: SHIFT_COLORS.blue,
    minStaff: 1,
    maxStaff: 1,
    requiredRoles: [],
    recurrencePattern: 'NONE',
    recurrenceDays: [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 30,
      color: SHIFT_COLORS.blue,
      minStaff: 1,
      maxStaff: 1,
      requiredRoles: [],
      recurrencePattern: 'NONE',
      recurrenceDays: [],
    })
    setError(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreating(true)
    setEditingId(null)
  }

  const handleEdit = (template: ShiftTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      startTime: template.startTime,
      endTime: template.endTime,
      breakDuration: template.breakDuration,
      color: template.color,
      minStaff: template.minStaff,
      maxStaff: template.maxStaff,
      requiredRoles: template.requiredRoles,
      recurrencePattern: template.recurrencePattern,
      recurrenceDays: template.recurrenceDays,
    })
    setEditingId(template.id)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    resetForm()
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Template name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isCreating) {
        await onCreateTemplate(formData)
      } else if (editingId) {
        await onUpdateTemplate(editingId, formData)
      }
      handleCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await onDeleteTemplate(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const toggleDay = (day: number) => {
    const days = formData.recurrenceDays || []
    if (days.includes(day)) {
      setFormData({ ...formData, recurrenceDays: days.filter(d => d !== day) })
    } else {
      setFormData({ ...formData, recurrenceDays: [...days, day].sort() })
    }
  }

  const shiftDuration = calculateDuration(formData.startTime, formData.endTime, formData.breakDuration || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shift Templates</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create reusable shift templates for quick scheduling
          </p>
        </div>
        {!isCreating && !editingId && (
          <button onClick={handleCreate} className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isCreating ? 'Create New Template' : 'Edit Template'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Morning Shift, Night Ice Tech"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Break Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.breakDuration || 0}
                  onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                  min={0}
                  max={120}
                  step={15}
                />
              </div>

              {/* Duration Display */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Shift Duration</div>
                <div className="text-xl font-bold text-gray-900">{formatDuration(shiftDuration)}</div>
              </div>
            </div>

            {/* Staffing & Appearance */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Staff
                  </label>
                  <input
                    type="number"
                    value={formData.minStaff || 1}
                    onChange={(e) => setFormData({ ...formData, minStaff: parseInt(e.target.value) || 1 })}
                    className="input w-full"
                    min={1}
                    max={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Staff
                  </label>
                  <input
                    type="number"
                    value={formData.maxStaff || 1}
                    onChange={(e) => setFormData({ ...formData, maxStaff: parseInt(e.target.value) || 1 })}
                    className="input w-full"
                    min={1}
                    max={20}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SHIFT_COLORS).map(([name, color]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurrence Pattern
                </label>
                <select
                  value={formData.recurrencePattern}
                  onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value as RecurrencePattern })}
                  className="input w-full"
                >
                  {RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {formData.recurrencePattern === 'WEEKLY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          (formData.recurrenceDays || []).includes(day.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={day.fullLabel}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div
                  className="rounded-lg p-4 text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  <div className="font-semibold">{formData.name || 'Template Name'}</div>
                  <div className="text-sm opacity-90">
                    {formatTimeDisplay(formData.startTime)} - {formatTimeDisplay(formData.endTime)}
                  </div>
                  <div className="text-sm opacity-75 mt-1">
                    {formData.minStaff === formData.maxStaff
                      ? `${formData.minStaff} staff`
                      : `${formData.minStaff}-${formData.maxStaff} staff`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button onClick={handleCancel} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isCreating ? 'Create Template' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Color bar */}
            <div className="h-2" style={{ backgroundColor: template.color }} />

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDuplicateTemplate(template.id)}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                    title="Duplicate"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTimeDisplay(template.startTime)} - {formatTimeDisplay(template.endTime)}
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {template.minStaff === template.maxStaff
                    ? `${template.minStaff} staff required`
                    : `${template.minStaff}-${template.maxStaff} staff`
                  }
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {RECURRENCE_OPTIONS.find(r => r.value === template.recurrencePattern)?.label}
                  {template.recurrencePattern === 'WEEKLY' && template.recurrenceDays && template.recurrenceDays.length > 0 && (
                    <span className="text-gray-400">
                      ({template.recurrenceDays.map(d => DAYS_OF_WEEK[d].label).join(', ')})
                    </span>
                  )}
                </div>
              </div>

              {/* Duration badge */}
              <div className="mt-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {formatDuration(calculateDuration(template.startTime, template.endTime, template.breakDuration))}
                </span>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No templates yet</h3>
            <p className="mt-2 text-gray-500">
              Create shift templates to quickly add recurring shifts to your schedule.
            </p>
            <button onClick={handleCreate} className="mt-4 btn btn-primary">
              Create Your First Template
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
