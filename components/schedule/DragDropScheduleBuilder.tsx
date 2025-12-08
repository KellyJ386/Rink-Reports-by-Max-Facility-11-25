'use client'

import { useState, useEffect, useMemo } from 'react'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ScheduleEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  role: string
}

interface DragDropScheduleBuilderProps {
  entries: ScheduleEntry[]
  employees: Employee[]
  weekStart: Date
  onEntryMove: (entryId: string, newDate: string, newUserId: string) => void
  onEntryClick?: (entry: ScheduleEntry) => void
  onCreateEntry?: (date: string, userId: string) => void
}

interface DayColumnProps {
  date: Date
  entries: ScheduleEntry[]
  employees: Employee[]
  onEntryClick?: (entry: ScheduleEntry) => void
  onCreateEntry?: (date: string, userId: string) => void
}

interface DraggableEntryProps {
  entry: ScheduleEntry
  onClick?: () => void
}

function DraggableEntry({ entry, onClick }: DraggableEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getStatusColor = () => {
    if (entry.isEmergency) return 'bg-red-100 border-red-300 text-red-800'
    if (entry.isOpenShift) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    if (entry.status === 'PUBLISHED') return 'bg-blue-100 border-blue-300 text-blue-800'
    if (entry.status === 'FILLED') return 'bg-green-100 border-green-300 text-green-800'
    return 'bg-gray-100 border-gray-300 text-gray-800'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-2 rounded border text-sm cursor-grab active:cursor-grabbing ${getStatusColor()}`}
    >
      <div className="font-medium truncate">
        {entry.isOpenShift ? 'OPEN SHIFT' : `${entry.user.firstName} ${entry.user.lastName}`}
      </div>
      <div className="text-xs opacity-75">
        {entry.startTime} - {entry.endTime}
      </div>
      {entry.isEmergency && (
        <div className="text-xs font-bold mt-1">EMERGENCY</div>
      )}
    </div>
  )
}

function DroppableSlot({
  id,
  children,
  isEmpty,
  onClick,
}: {
  id: string
  children?: React.ReactNode
  isEmpty?: boolean
  onClick?: () => void
}) {
  const { setNodeRef, isOver } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] p-1 rounded border-2 border-dashed transition-colors ${
        isOver
          ? 'border-blue-400 bg-blue-50'
          : isEmpty
          ? 'border-gray-200 hover:border-gray-300'
          : 'border-transparent'
      }`}
      onClick={isEmpty ? onClick : undefined}
    >
      {children}
      {isEmpty && (
        <div className="h-full flex items-center justify-center text-gray-400 text-xs cursor-pointer">
          + Add Shift
        </div>
      )}
    </div>
  )
}

function DayColumn({
  date,
  entries,
  employees,
  onEntryClick,
  onCreateEntry,
}: DayColumnProps) {
  const dateStr = date.toISOString().split('T')[0]
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dayNum = date.getDate()
  const isToday = new Date().toDateString() === date.toDateString()

  // Group entries by employee
  const entriesByEmployee = useMemo(() => {
    const map: Record<string, ScheduleEntry[]> = {}
    for (const emp of employees) {
      map[emp.id] = entries.filter(e => e.userId === emp.id)
    }
    // Add open shifts
    map['open'] = entries.filter(e => e.isOpenShift)
    return map
  }, [entries, employees])

  return (
    <div className="flex-1 min-w-[150px] border-r last:border-r-0">
      <div
        className={`text-center py-2 border-b ${
          isToday ? 'bg-blue-600 text-white' : 'bg-gray-50'
        }`}
      >
        <div className="text-xs">{dayName}</div>
        <div className="font-bold">{dayNum}</div>
      </div>

      <div className="p-1 space-y-2">
        {/* Open shifts section */}
        <div className="border-b pb-2 mb-2">
          <div className="text-xs text-gray-500 mb-1">Open Shifts</div>
          <SortableContext
            items={entriesByEmployee['open']?.map(e => e.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <DroppableSlot
              id={`${dateStr}-open`}
              isEmpty={!entriesByEmployee['open']?.length}
              onClick={() => onCreateEntry?.(dateStr, 'open')}
            >
              <div className="space-y-1">
                {entriesByEmployee['open']?.map(entry => (
                  <DraggableEntry
                    key={entry.id}
                    entry={entry}
                    onClick={() => onEntryClick?.(entry)}
                  />
                ))}
              </div>
            </DroppableSlot>
          </SortableContext>
        </div>

        {/* Employee sections */}
        {employees.slice(0, 5).map(emp => (
          <div key={emp.id} className="mb-2">
            <div className="text-xs text-gray-500 truncate mb-1">
              {emp.firstName} {emp.lastName.charAt(0)}.
            </div>
            <SortableContext
              items={entriesByEmployee[emp.id]?.map(e => e.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <DroppableSlot
                id={`${dateStr}-${emp.id}`}
                isEmpty={!entriesByEmployee[emp.id]?.length}
                onClick={() => onCreateEntry?.(dateStr, emp.id)}
              >
                <div className="space-y-1">
                  {entriesByEmployee[emp.id]?.map(entry => (
                    <DraggableEntry
                      key={entry.id}
                      entry={entry}
                      onClick={() => onEntryClick?.(entry)}
                    />
                  ))}
                </div>
              </DroppableSlot>
            </SortableContext>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DragDropScheduleBuilder({
  entries,
  employees,
  weekStart,
  onEntryMove,
  onEntryClick,
  onCreateEntry,
}: DragDropScheduleBuilderProps) {
  const [activeEntry, setActiveEntry] = useState<ScheduleEntry | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Generate week days
  const weekDays = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + i)
      days.push(day)
    }
    return days
  }, [weekStart])

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map: Record<string, ScheduleEntry[]> = {}
    for (const day of weekDays) {
      const dateStr = day.toISOString().split('T')[0]
      map[dateStr] = entries.filter(e => {
        const entryDate = new Date(e.date).toISOString().split('T')[0]
        return entryDate === dateStr
      })
    }
    return map
  }, [entries, weekDays])

  const handleDragStart = (event: DragStartEvent) => {
    const entry = entries.find(e => e.id === event.active.id)
    setActiveEntry(entry || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveEntry(null)

    if (!over) return

    const overId = over.id.toString()
    const [newDate, newUserId] = overId.split('-').slice(0, 2)

    if (newDate && newUserId) {
      onEntryMove(active.id.toString(), newDate, newUserId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="border rounded-lg overflow-hidden">
        {/* Employee sidebar legend */}
        <div className="flex bg-gray-50 border-b">
          <div className="w-32 p-2 border-r">
            <div className="text-xs font-medium text-gray-500">Week View</div>
            <div className="text-sm font-semibold">
              {weekStart.toLocaleDateString('en-US', { month: 'short' })}
            </div>
          </div>
          <div className="flex flex-1 overflow-x-auto">
            {weekDays.map(day => {
              const isToday = new Date().toDateString() === day.toDateString()
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 min-w-[150px] text-center py-2 text-sm ${
                    isToday ? 'bg-blue-600 text-white font-bold' : ''
                  }`}
                >
                  {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Schedule grid */}
        <div className="flex overflow-x-auto">
          <div className="w-32 flex-shrink-0 bg-gray-50 border-r">
            <div className="p-2 border-b">
              <div className="text-xs text-gray-500">Open Shifts</div>
            </div>
            {employees.slice(0, 5).map(emp => (
              <div key={emp.id} className="p-2 border-b text-sm">
                <div className="font-medium truncate">
                  {emp.firstName} {emp.lastName.charAt(0)}.
                </div>
                <div className="text-xs text-gray-500 truncate">{emp.role}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-1">
            {weekDays.map(day => {
              const dateStr = day.toISOString().split('T')[0]
              return (
                <DayColumn
                  key={dateStr}
                  date={day}
                  entries={entriesByDate[dateStr] || []}
                  employees={employees}
                  onEntryClick={onEntryClick}
                  onCreateEntry={onCreateEntry}
                />
              )
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeEntry && (
          <div className="p-2 rounded border text-sm bg-white shadow-lg">
            <div className="font-medium">
              {activeEntry.isOpenShift
                ? 'OPEN SHIFT'
                : `${activeEntry.user.firstName} ${activeEntry.user.lastName}`}
            </div>
            <div className="text-xs opacity-75">
              {activeEntry.startTime} - {activeEntry.endTime}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
