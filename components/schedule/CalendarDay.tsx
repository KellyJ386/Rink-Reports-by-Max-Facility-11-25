'use client'

import { useDroppable } from '@dnd-kit/core'
import { ShiftCard } from './ShiftCard'
import type { ScheduleEntryWithUser } from '@/types/schedule'

interface CalendarDayProps {
  date: Date
  dateStr: string
  entries: ScheduleEntryWithUser[]
  onCreateEntry: () => void
  onEditEntry: (entry: ScheduleEntryWithUser) => void
  onDeleteEntry: (entryId: string) => void
  canEdit: boolean
  isToday: boolean
}

export function CalendarDay({
  date,
  dateStr,
  entries,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  canEdit,
  isToday,
}: CalendarDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  })

  // Sort entries by start time
  const sortedEntries = [...entries].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )

  // Count open shifts
  const openShiftCount = entries.filter((e) => e.isOpenShift || !e.userId).length
  const hasConflicts = entries.some((e) => e.hasConflict)

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] bg-white p-2 flex flex-col transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''
      } ${isToday ? 'ring-2 ring-blue-300' : ''}`}
    >
      {/* Day Stats */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-gray-500">{entries.length} shifts</span>
        {openShiftCount > 0 && (
          <span className="bg-orange-100 text-orange-700 px-1 rounded">
            {openShiftCount} open
          </span>
        )}
        {hasConflicts && (
          <span className="bg-red-100 text-red-700 px-1 rounded">
            Conflicts
          </span>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 space-y-1 overflow-y-auto max-h-[300px]">
        {sortedEntries.map((entry) => (
          <ShiftCard
            key={entry.id}
            entry={entry}
            onEdit={() => onEditEntry(entry)}
            onDelete={() => onDeleteEntry(entry.id)}
            canEdit={canEdit}
          />
        ))}
      </div>

      {/* Add Button */}
      {canEdit && (
        <button
          onClick={onCreateEntry}
          className="mt-2 w-full py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-dashed border-gray-300 transition-colors"
        >
          + Add Shift
        </button>
      )}
    </div>
  )
}
