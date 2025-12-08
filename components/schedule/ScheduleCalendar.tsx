'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  format,
  addDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO,
} from 'date-fns'
import { CalendarDay } from './CalendarDay'
import { ShiftCard } from './ShiftCard'
import { EmployeeList } from './EmployeeList'
import { ShiftModal } from './ShiftModal'
import type {
  ScheduleEntryWithUser,
  ShiftDefinition,
  EmployeeBasicInfo,
  ScheduleConflict,
} from '@/types/schedule'

interface ScheduleCalendarProps {
  initialEntries: ScheduleEntryWithUser[]
  shifts: ShiftDefinition[]
  employees: EmployeeBasicInfo[]
  facilityId: string
  canEdit: boolean
  canPublish: boolean
}

export function ScheduleCalendar({
  initialEntries,
  shifts,
  employees,
  facilityId,
  canEdit,
  canPublish,
}: ScheduleCalendarProps) {
  const [entries, setEntries] = useState<ScheduleEntryWithUser[]>(initialEntries)
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [activeEntry, setActiveEntry] = useState<ScheduleEntryWithUser | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntryWithUser | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  // Generate days for current week
  const weekDays = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i))
    }
    return days
  }, [currentWeekStart])

  // Filter entries for current week
  const weekEntries = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 })
    return entries.filter((entry) => {
      const entryDate = typeof entry.date === 'string' ? parseISO(entry.date) : entry.date
      return entryDate >= currentWeekStart && entryDate <= weekEnd
    })
  }, [entries, currentWeekStart])

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, ScheduleEntryWithUser[]>()
    for (const entry of weekEntries) {
      const dateStr =
        typeof entry.date === 'string'
          ? entry.date.split('T')[0]
          : format(entry.date, 'yyyy-MM-dd')
      const existing = grouped.get(dateStr) || []
      existing.push(entry)
      grouped.set(dateStr, existing)
    }
    return grouped
  }, [weekEntries])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const entry = entries.find((e) => e.id === event.active.id)
    if (entry) {
      setActiveEntry(entry)
    }
  }, [entries])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveEntry(null)

      if (!over || !canEdit) return

      const entryId = active.id as string
      const targetDate = over.id as string

      // Find the entry being dragged
      const entry = entries.find((e) => e.id === entryId)
      if (!entry) return

      const currentDateStr =
        typeof entry.date === 'string'
          ? entry.date.split('T')[0]
          : format(entry.date, 'yyyy-MM-dd')

      // If dropped on same date, no change
      if (currentDateStr === targetDate) return

      try {
        setIsLoading(true)

        // Update entry date via API
        const response = await fetch(`/api/schedule/entries/${entryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: targetDate }),
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to update entry')
          return
        }

        const { entry: updatedEntry, conflicts } = await response.json()

        // Update local state
        setEntries((prev) =>
          prev.map((e) => (e.id === entryId ? updatedEntry : e))
        )

        // Show conflicts if any
        if (conflicts && conflicts.length > 0) {
          alert(`Warning: ${conflicts.map((c: ScheduleConflict) => c.message).join('\n')}`)
        }
      } catch (error) {
        console.error('Error updating entry:', error)
        alert('Failed to update entry')
      } finally {
        setIsLoading(false)
      }
    },
    [entries, canEdit]
  )

  const handleCreateEntry = useCallback(
    (date: Date) => {
      if (!canEdit) return
      setSelectedDate(date)
      setSelectedEntry(null)
      setModalMode('create')
      setShowModal(true)
    },
    [canEdit]
  )

  const handleEditEntry = useCallback(
    (entry: ScheduleEntryWithUser) => {
      if (!canEdit) return
      setSelectedEntry(entry)
      setSelectedDate(null)
      setModalMode('edit')
      setShowModal(true)
    },
    [canEdit]
  )

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!canEdit) return
      if (!confirm('Are you sure you want to delete this shift?')) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/schedule/entries/${entryId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to delete entry')
          return
        }

        setEntries((prev) => prev.filter((e) => e.id !== entryId))
      } catch (error) {
        console.error('Error deleting entry:', error)
        alert('Failed to delete entry')
      } finally {
        setIsLoading(false)
      }
    },
    [canEdit]
  )

  const handleModalSave = useCallback(
    async (data: any) => {
      try {
        setIsLoading(true)

        if (modalMode === 'create') {
          const response = await fetch('/api/schedule/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            alert(error.error || 'Failed to create entry')
            return
          }

          const { entry, conflicts } = await response.json()
          setEntries((prev) => [...prev, entry])

          if (conflicts && conflicts.length > 0) {
            alert(`Warning: ${conflicts.map((c: ScheduleConflict) => c.message).join('\n')}`)
          }
        } else {
          const response = await fetch(`/api/schedule/entries/${selectedEntry?.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            alert(error.error || 'Failed to update entry')
            return
          }

          const { entry, conflicts } = await response.json()
          setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))

          if (conflicts && conflicts.length > 0) {
            alert(`Warning: ${conflicts.map((c: ScheduleConflict) => c.message).join('\n')}`)
          }
        }

        setShowModal(false)
      } catch (error) {
        console.error('Error saving entry:', error)
        alert('Failed to save entry')
      } finally {
        setIsLoading(false)
      }
    },
    [modalMode, selectedEntry]
  )

  const handlePrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1))
  const handleNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1))
  const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))

  const weekRangeLabel = `${format(currentWeekStart, 'MMM d')} - ${format(
    endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
    'MMM d, yyyy'
  )}`

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="btn btn-secondary"
          >
            &larr; Prev
          </button>
          <button onClick={handleToday} className="btn btn-secondary">
            Today
          </button>
          <button
            onClick={handleNextWeek}
            className="btn btn-secondary"
          >
            Next &rarr;
          </button>
        </div>

        <h2 className="text-xl font-semibold">{weekRangeLabel}</h2>

        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'week' | 'day')}
            className="input"
          >
            <option value="week">Week View</option>
            <option value="day">Day View</option>
          </select>

          {canPublish && (
            <button className="btn btn-primary">Publish Schedule</button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-7 gap-1 bg-gray-100 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {weekDays.map((day) => (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={`text-center py-2 font-medium text-sm ${
                isSameDay(day, new Date())
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <div>{format(day, 'EEE')}</div>
              <div className="text-lg">{format(day, 'd')}</div>
            </div>
          ))}

          {/* Day Columns */}
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEntries = entriesByDate.get(dateStr) || []

            return (
              <CalendarDay
                key={dateStr}
                date={day}
                dateStr={dateStr}
                entries={dayEntries}
                onCreateEntry={() => handleCreateEntry(day)}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
                canEdit={canEdit}
                isToday={isSameDay(day, new Date())}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeEntry ? (
            <ShiftCard entry={activeEntry} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Shift Modal */}
      {showModal && (
        <ShiftModal
          mode={modalMode}
          entry={selectedEntry}
          date={selectedDate}
          shifts={shifts}
          employees={employees}
          onSave={handleModalSave}
          onClose={() => setShowModal(false)}
          isLoading={isLoading}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Saving...</p>
          </div>
        </div>
      )}
    </div>
  )
}
