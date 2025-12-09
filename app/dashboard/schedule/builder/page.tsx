'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DragDropScheduleBuilder from '@/components/schedule/DragDropScheduleBuilder'
import ScheduleEntryModal from '@/components/schedule/ScheduleEntryModal'

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

export default function ScheduleBuilderPage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    today.setDate(today.getDate() - today.getDay())
    return today
  })
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)
  const [pendingCreate, setPendingCreate] = useState<{
    date: string
    userId: string
  } | null>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchScheduleEntries()
  }, [weekStart])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (res.ok) {
        setEmployees(data.employees || [])
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    }
  }

  const fetchScheduleEntries = async () => {
    try {
      setLoading(true)
      const endDate = new Date(weekStart)
      endDate.setDate(endDate.getDate() + 6)

      const params = new URLSearchParams({
        startDate: weekStart.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })

      const res = await fetch(`/api/schedule?${params}`)
      const data = await res.json()

      if (res.ok) {
        setEntries(data.scheduleEntries || [])
      } else {
        setError(data.error || 'Failed to load schedule')
      }
    } catch (err) {
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleEntryMove = async (
    entryId: string,
    newDate: string,
    newUserId: string
  ) => {
    // Optimistic update
    setEntries(prev =>
      prev.map(e =>
        e.id === entryId
          ? {
              ...e,
              date: newDate,
              userId: newUserId === 'open' ? e.userId : newUserId,
              isOpenShift: newUserId === 'open',
            }
          : e
      )
    )

    try {
      const res = await fetch(`/api/schedule/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          userId: newUserId === 'open' ? undefined : newUserId,
          isOpenShift: newUserId === 'open',
        }),
      })

      if (!res.ok) {
        // Revert on error
        await fetchScheduleEntries()
        const data = await res.json()
        alert(data.error || 'Failed to move entry')
      }
    } catch (err) {
      await fetchScheduleEntries()
      alert('Failed to move entry')
    }
  }

  const handleEntryClick = (entry: ScheduleEntry) => {
    setEditingEntry(entry)
    setShowModal(true)
  }

  const handleCreateEntry = (date: string, userId: string) => {
    setPendingCreate({ date, userId })
    setEditingEntry(null)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingEntry(null)
    setPendingCreate(null)
  }

  const handleModalSave = async () => {
    setShowModal(false)
    setEditingEntry(null)
    setPendingCreate(null)
    await fetchScheduleEntries()
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(weekStart)
    newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7))
    setWeekStart(newStart)
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    today.setDate(today.getDate() - today.getDay())
    setWeekStart(today)
  }

  if (loading && !entries.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading schedule builder...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Builder</h1>
          <p className="text-gray-600">
            Drag and drop shifts to build your schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/schedule" className="btn-secondary">
            Calendar View
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Week Navigation */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              &larr; Prev Week
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Current Week
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              Next Week &rarr;
            </button>
          </div>
          <div className="font-semibold">
            Week of{' '}
            {weekStart.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
        <strong>Tip:</strong> Drag shifts between days and employees. Click on
        an empty slot to create a new shift, or click an existing shift to edit
        it.
      </div>

      {/* Drag Drop Builder */}
      <DragDropScheduleBuilder
        entries={entries}
        employees={employees}
        weekStart={weekStart}
        onEntryMove={handleEntryMove}
        onEntryClick={handleEntryClick}
        onCreateEntry={handleCreateEntry}
      />

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span>Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span>Filled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span>Open Shift</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span>Emergency</span>
        </div>
      </div>

      {/* Entry Modal */}
      {showModal && (
        <ScheduleEntryModal
          entry={editingEntry}
          onClose={handleModalClose}
          onSave={handleModalSave}
          canPublish={true}
          defaultDate={pendingCreate?.date}
          defaultUserId={
            pendingCreate?.userId !== 'open' ? pendingCreate?.userId : undefined
          }
          defaultIsOpenShift={pendingCreate?.userId === 'open'}
        />
      )}
    </div>
  )
}
