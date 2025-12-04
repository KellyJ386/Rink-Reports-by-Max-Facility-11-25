'use client'

import { useState } from 'react'
import type { Shift, ShiftAssignment } from '@/types/schedule'
import { formatTimeDisplay, calculateShiftHours, formatDuration, getShiftStaffingStatus } from '@/lib/schedule-utils'

interface ShiftCardProps {
  shift: Shift
  variant?: 'compact' | 'default' | 'expanded'
  showDate?: boolean
  draggable?: boolean
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onAssign?: () => void
  onOpenShift?: () => void
  isSelected?: boolean
  className?: string
}

export function ShiftCard({
  shift,
  variant = 'default',
  showDate = false,
  draggable = false,
  onClick,
  onEdit,
  onDelete,
  onAssign,
  onOpenShift,
  isSelected = false,
  className = '',
}: ShiftCardProps) {
  const [showActions, setShowActions] = useState(false)

  const staffingStatus = getShiftStaffingStatus(shift)
  const hours = calculateShiftHours(shift)
  const confirmedStaff = shift.assignedEmployees.filter(
    a => a.status === 'ASSIGNED' || a.status === 'CONFIRMED'
  ).length

  const staffingColors = {
    understaffed: 'border-red-300 bg-red-50',
    adequate: 'border-gray-200 bg-white',
    full: 'border-green-300 bg-green-50',
  }

  const statusBadges = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
    PUBLISHED: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Published' },
    FILLED: { bg: 'bg-green-100', text: 'text-green-600', label: 'Filled' },
    OPEN: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Open' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Cancelled' },
  }

  const status = statusBadges[shift.status]

  // Compact variant for calendar cells
  if (variant === 'compact') {
    return (
      <div
        className={`rounded px-2 py-1 text-xs cursor-pointer transition-all hover:shadow-sm ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${className}`}
        style={{ backgroundColor: shift.color + '20', borderLeft: `3px solid ${shift.color}` }}
        onClick={onClick}
        draggable={draggable}
        title={`${shift.title} (${formatTimeDisplay(shift.startTime)} - ${formatTimeDisplay(shift.endTime)})`}
      >
        <div className="font-medium truncate" style={{ color: shift.color }}>
          {shift.title}
        </div>
        <div className="text-gray-500 truncate">
          {formatTimeDisplay(shift.startTime)} - {formatTimeDisplay(shift.endTime)}
        </div>
        {confirmedStaff > 0 && (
          <div className="flex -space-x-1 mt-1">
            {shift.assignedEmployees.slice(0, 3).map((a, i) => (
              <div
                key={a.id}
                className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs font-medium"
                title={`${a.employee.firstName} ${a.employee.lastName}`}
              >
                {a.employee.firstName[0]}
              </div>
            ))}
            {confirmedStaff > 3 && (
              <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs">
                +{confirmedStaff - 3}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all ${staffingColors[staffingStatus]} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      draggable={draggable}
    >
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: shift.color }} />

      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {showDate && (
              <div className="text-xs text-gray-500 mb-1">
                {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            )}
            <h4 className="font-semibold text-gray-900 truncate">{shift.title}</h4>
            <div className="text-sm text-gray-600 mt-0.5">
              {formatTimeDisplay(shift.startTime)} - {formatTimeDisplay(shift.endTime)}
              <span className="text-gray-400 ml-2">({formatDuration(hours)})</span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (onEdit || onDelete || onAssign) && (
            <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
              {onAssign && (
                <button
                  onClick={onAssign}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Assign employees"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Edit shift"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete shift"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status & Staffing */}
        <div className="flex items-center gap-2 mt-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {shift.isOpen && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-600">
              Open for Pickup
            </span>
          )}
          <span className={`text-xs ${
            staffingStatus === 'understaffed' ? 'text-red-600' :
            staffingStatus === 'full' ? 'text-green-600' : 'text-gray-500'
          }`}>
            {confirmedStaff}/{shift.minStaff}-{shift.maxStaff} staff
          </span>
        </div>

        {/* Assigned Employees */}
        {shift.assignedEmployees.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-2">Assigned Staff</div>
            <div className="flex flex-wrap gap-2">
              {shift.assignedEmployees.map(assignment => (
                <AssignmentBadge key={assignment.id} assignment={assignment} />
              ))}
            </div>
          </div>
        )}

        {/* Open shift action */}
        {shift.isOpen && onOpenShift && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenShift()
            }}
            className="mt-3 w-full py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            Claim This Shift
          </button>
        )}

        {/* Notes */}
        {shift.notes && variant === 'expanded' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Notes</div>
            <p className="text-sm text-gray-600">{shift.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Assignment badge component
function AssignmentBadge({ assignment }: { assignment: ShiftAssignment }) {
  const statusColors = {
    ASSIGNED: 'bg-blue-100 text-blue-700 border-blue-200',
    CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
    DECLINED: 'bg-red-100 text-red-700 border-red-200',
    NO_SHOW: 'bg-gray-100 text-gray-700 border-gray-200',
    COMPLETED: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${statusColors[assignment.status]}`}
    >
      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
        {assignment.employee.firstName[0]}{assignment.employee.lastName[0]}
      </div>
      <span className="font-medium">
        {assignment.employee.firstName} {assignment.employee.lastName[0]}.
      </span>
      {assignment.status !== 'ASSIGNED' && assignment.status !== 'CONFIRMED' && (
        <span className="opacity-75">({assignment.status.toLowerCase()})</span>
      )}
    </div>
  )
}

// Mini shift indicator for dense calendar views
export function ShiftIndicator({
  shift,
  onClick,
}: {
  shift: Shift
  onClick?: () => void
}) {
  const confirmedStaff = shift.assignedEmployees.filter(
    a => a.status === 'ASSIGNED' || a.status === 'CONFIRMED'
  ).length
  const isUnderstaffed = confirmedStaff < shift.minStaff

  return (
    <div
      className="flex items-center gap-1 cursor-pointer group"
      onClick={onClick}
      title={`${shift.title} - ${formatTimeDisplay(shift.startTime)}`}
    >
      <div
        className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform"
        style={{ backgroundColor: shift.color }}
      />
      {isUnderstaffed && (
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  )
}

// Shift list item for sidebar lists
export function ShiftListItem({
  shift,
  onClick,
  onEdit,
  isActive,
}: {
  shift: Shift
  onClick?: () => void
  onEdit?: () => void
  isActive?: boolean
}) {
  const hours = calculateShiftHours(shift)
  const staffingStatus = getShiftStaffingStatus(shift)

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: shift.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{shift.title}</div>
          <div className="text-sm text-gray-500">
            {formatTimeDisplay(shift.startTime)} - {formatTimeDisplay(shift.endTime)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">{formatDuration(hours)}</div>
          <div className={`text-xs ${
            staffingStatus === 'understaffed' ? 'text-red-600' :
            staffingStatus === 'full' ? 'text-green-600' : 'text-gray-500'
          }`}>
            {shift.assignedEmployees.filter(a => a.status === 'ASSIGNED' || a.status === 'CONFIRMED').length}/{shift.minStaff} staff
          </div>
        </div>
      </div>
    </div>
  )
}
