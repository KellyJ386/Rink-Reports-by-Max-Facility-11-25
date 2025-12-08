'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type {
  ScheduleEntryWithUser,
  ShiftDefinition,
  EmployeeBasicInfo,
} from '@/types/schedule'

interface ShiftModalProps {
  mode: 'create' | 'edit'
  entry: ScheduleEntryWithUser | null
  date: Date | null
  shifts: ShiftDefinition[]
  employees: EmployeeBasicInfo[]
  onSave: (data: any) => Promise<void>
  onClose: () => void
  isLoading: boolean
}

export function ShiftModal({
  mode,
  entry,
  date,
  shifts,
  employees,
  onSave,
  onClose,
  isLoading,
}: ShiftModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    shiftId: '',
    userId: '',
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    notes: '',
    isOpenShift: false,
    isEmergency: false,
  })

  const [useCustomTime, setUseCustomTime] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && entry) {
      const entryDate =
        typeof entry.date === 'string'
          ? entry.date.split('T')[0]
          : format(entry.date, 'yyyy-MM-dd')

      setFormData({
        date: entryDate,
        shiftId: entry.shiftId || '',
        userId: entry.userId || '',
        startTime: entry.startTime,
        endTime: entry.endTime,
        breakMinutes: entry.breakMinutes || 0,
        notes: entry.notes || '',
        isOpenShift: entry.isOpenShift,
        isEmergency: entry.isEmergency,
      })

      // Check if times differ from shift definition
      const shift = shifts.find((s) => s.id === entry.shiftId)
      if (shift && (shift.startTime !== entry.startTime || shift.endTime !== entry.endTime)) {
        setUseCustomTime(true)
      }
    } else if (date) {
      setFormData((prev) => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd'),
      }))
    }
  }, [mode, entry, date, shifts])

  const handleShiftChange = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    setFormData((prev) => ({
      ...prev,
      shiftId,
      startTime: !useCustomTime && shift ? shift.startTime : prev.startTime,
      endTime: !useCustomTime && shift ? shift.endTime : prev.endTime,
      breakMinutes: !useCustomTime && shift ? shift.breakMinutes : prev.breakMinutes,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: any = {
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakMinutes: formData.breakMinutes,
      notes: formData.notes || null,
      isEmergency: formData.isEmergency,
    }

    if (formData.shiftId) {
      data.shiftId = formData.shiftId
    }

    if (formData.isOpenShift || !formData.userId) {
      data.userId = null
      data.isOpenShift = true
    } else {
      data.userId = formData.userId
      data.isOpenShift = false
    }

    await onSave(data)
  }

  const activeEmployees = employees.filter((e) => e.isActive)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? 'Add Shift' : 'Edit Shift'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="input w-full"
              required
            />
          </div>

          {/* Shift Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Template
            </label>
            <select
              value={formData.shiftId}
              onChange={(e) => handleShiftChange(e.target.value)}
              className="input w-full"
            >
              <option value="">-- Select Shift --</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Time Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useCustomTime"
              checked={useCustomTime}
              onChange={(e) => setUseCustomTime(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useCustomTime" className="text-sm text-gray-600">
              Use custom times
            </label>
          </div>

          {/* Time Fields */}
          {useCustomTime && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  className="input w-full"
                  required
                />
              </div>
            </div>
          )}

          {/* Break Minutes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Break (minutes)
            </label>
            <input
              type="number"
              value={formData.breakMinutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  breakMinutes: parseInt(e.target.value) || 0,
                }))
              }
              className="input w-full"
              min="0"
              max="480"
            />
          </div>

          {/* Open Shift Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOpenShift"
              checked={formData.isOpenShift}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isOpenShift: e.target.checked,
                  userId: e.target.checked ? '' : prev.userId,
                }))
              }
              className="mr-2"
            />
            <label htmlFor="isOpenShift" className="text-sm text-gray-600">
              Open shift (anyone can pick up)
            </label>
          </div>

          {/* Employee Selection */}
          {!formData.isOpenShift && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Employee
              </label>
              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, userId: e.target.value }))
                }
                className="input w-full"
              >
                <option value="">-- Select Employee --</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.role.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Emergency Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isEmergency"
              checked={formData.isEmergency}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isEmergency: e.target.checked }))
              }
              className="mr-2"
            />
            <label htmlFor="isEmergency" className="text-sm text-gray-600">
              Emergency coverage needed
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="input w-full"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !formData.date || !formData.startTime || !formData.endTime}
            >
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Shift' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
