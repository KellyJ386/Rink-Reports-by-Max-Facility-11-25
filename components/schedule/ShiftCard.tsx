'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { ScheduleEntryWithUser } from '@/types/schedule'

interface ShiftCardProps {
  entry: ScheduleEntryWithUser
  onEdit?: () => void
  onDelete?: () => void
  canEdit?: boolean
  isDragging?: boolean
}

export function ShiftCard({
  entry,
  onEdit,
  onDelete,
  canEdit = false,
  isDragging = false,
}: ShiftCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: entry.id,
    disabled: !canEdit,
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const shiftColor = entry.shift?.color || '#3B82F6'
  const isOpenShift = entry.isOpenShift || !entry.userId
  const isEmergency = entry.isEmergency
  const hasConflict = entry.hasConflict

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canEdit ? { ...listeners, ...attributes } : {})}
      className={`relative p-2 rounded text-xs border-l-4 cursor-pointer transition-all
        ${isDragging ? 'opacity-50 shadow-lg z-50' : 'opacity-100'}
        ${isOpenShift ? 'bg-orange-50 border-orange-400' : 'bg-white'}
        ${isEmergency ? 'ring-2 ring-red-400' : ''}
        ${hasConflict ? 'ring-2 ring-yellow-400' : ''}
        hover:shadow-md`}
      style={{
        ...style,
        borderLeftColor: isOpenShift ? undefined : shiftColor,
      }}
      onClick={onEdit}
    >
      {/* Time */}
      <div className="font-medium text-gray-700">
        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
      </div>

      {/* Shift Name */}
      {entry.shift && (
        <div
          className="text-xs font-medium mt-0.5"
          style={{ color: shiftColor }}
        >
          {entry.shift.name}
        </div>
      )}

      {/* Employee or Open Shift */}
      <div className={`mt-1 ${isOpenShift ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
        {isOpenShift ? (
          <span>OPEN SHIFT</span>
        ) : entry.user ? (
          <span>
            {entry.user.firstName} {entry.user.lastName}
          </span>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        )}
      </div>

      {/* Role */}
      {entry.user?.role && (
        <div className="text-gray-400 text-[10px]">{entry.user.role.name}</div>
      )}

      {/* Status Badges */}
      <div className="flex items-center gap-1 mt-1">
        {entry.status === 'DRAFT' && (
          <span className="bg-gray-100 text-gray-600 px-1 rounded text-[10px]">
            Draft
          </span>
        )}
        {entry.status === 'PUBLISHED' && (
          <span className="bg-green-100 text-green-600 px-1 rounded text-[10px]">
            Published
          </span>
        )}
        {isEmergency && (
          <span className="bg-red-100 text-red-600 px-1 rounded text-[10px]">
            Emergency
          </span>
        )}
        {hasConflict && (
          <span className="bg-yellow-100 text-yellow-600 px-1 rounded text-[10px]">
            Conflict
          </span>
        )}
      </div>

      {/* Notes Preview */}
      {entry.notes && (
        <div className="mt-1 text-gray-400 text-[10px] truncate" title={entry.notes}>
          {entry.notes}
        </div>
      )}

      {/* Delete Button */}
      {canEdit && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-1 right-1 text-gray-400 hover:text-red-500 p-0.5"
          title="Delete shift"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
