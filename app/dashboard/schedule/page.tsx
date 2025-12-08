'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar'
import ScheduleEntryModal from '@/components/schedule/ScheduleEntryModal'
import OpenShiftsList from '@/components/schedule/OpenShiftsList'
import EmergencyCoverageModal from '@/components/schedule/EmergencyCoverageModal'
import CopyWeekModal from '@/components/schedule/CopyWeekModal'

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

interface UserPermissions {
  access: boolean
  viewOwn: boolean
  viewAll: boolean
  create: boolean
  publish: boolean
}

export default function SchedulePage() {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [openShifts, setOpenShifts] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchUserData()
    fetchScheduleEntries()
    fetchOpenShifts()
  }, [currentDate])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setCurrentUser(data.user)
        setPermissions(data.user.permissions.schedule)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchScheduleEntries = async () => {
    try {
      setLoading(true)
      // Calculate date range based on view
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)

      if (viewMode === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay())
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
      } else {
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })

      const res = await fetch(`/api/schedule?${params}`)
      const data = await res.json()

      if (res.ok) {
        setScheduleEntries(data.scheduleEntries || [])
      } else {
        setError(data.error || 'Failed to load schedule')
      }
    } catch (err) {
      setError('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const fetchOpenShifts = async () => {
    try {
      const res = await fetch('/api/schedule?openShiftsOnly=true')
      const data = await res.json()

      if (res.ok) {
        setOpenShifts(data.scheduleEntries || [])
      }
    } catch (err) {
      console.error('Error fetching open shifts:', err)
    }
  }

  const handleCreateEntry = () => {
    setEditingEntry(null)
    setShowModal(true)
  }

  const handleEditEntry = (entry: ScheduleEntry) => {
    setEditingEntry(entry)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingEntry(null)
  }

  const handleModalSave = async () => {
    setShowModal(false)
    setEditingEntry(null)
    await fetchScheduleEntries()
    await fetchOpenShifts()
  }

  const handleEmergencyModalSave = async () => {
    setShowEmergencyModal(false)
    await fetchScheduleEntries()
    await fetchOpenShifts()
  }

  const handleCopyWeekSuccess = async () => {
    setShowCopyWeekModal(false)
    await fetchScheduleEntries()
  }

  const getWeekStartDate = () => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - date.getDay())
    return date
  }

  const handlePublishAll = async () => {
    if (!confirm('Publish all draft schedule entries for this period?')) return

    try {
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)

      if (viewMode === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay())
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
      } else {
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
      }

      const res = await fetch('/api/schedule/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert(`Published ${data.count} schedule entries`)
        await fetchScheduleEntries()
        await fetchOpenShifts()
      } else {
        alert(data.error || 'Failed to publish')
      }
    } catch (err) {
      alert('Failed to publish schedule')
    }
  }

  const handleClaimShift = async (entryId: string) => {
    try {
      const res = await fetch(`/api/schedule/${entryId}/claim`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        await fetchScheduleEntries()
        await fetchOpenShifts()
      } else {
        alert(data.error || 'Failed to claim shift')
      }
    } catch (err) {
      alert('Failed to claim shift')
    }
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading && !scheduleEntries.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage employee schedules and shifts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions?.create && (
            <>
              <div className="flex gap-1 border rounded-md overflow-hidden">
                <Link href="/dashboard/schedule/shifts" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm">
                  Shifts
                </Link>
                <Link href="/dashboard/schedule/recurring" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm">
                  Recurring
                </Link>
                <Link href="/dashboard/schedule/templates" className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm">
                  Templates
                </Link>
              </div>
              {viewMode === 'week' && (
                <button
                  onClick={() => setShowCopyWeekModal(true)}
                  className="btn-secondary text-sm"
                >
                  Copy Week
                </button>
              )}
              <button onClick={handleCreateEntry} className="btn-primary">
                + Add Entry
              </button>
            </>
          )}
          {permissions?.publish && (
            <>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
              >
                Emergency
              </button>
              <button onClick={handlePublishAll} className="btn-success">
                Publish All
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Open Shifts Banner */}
      {openShifts.length > 0 && (
        <div className="mb-6">
          <OpenShiftsList
            shifts={openShifts}
            onClaim={handleClaimShift}
            currentUserId={currentUser?.id}
          />
        </div>
      )}

      {/* Calendar Controls */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigatePeriod('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ← Prev
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Today
            </button>
            <button
              onClick={() => navigatePeriod('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              Next →
            </button>
            <span className="font-semibold text-lg">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
                ...(viewMode === 'week' && { day: 'numeric' }),
              })}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <ScheduleCalendar
        entries={scheduleEntries}
        currentDate={currentDate}
        viewMode={viewMode}
        onEntryClick={permissions?.create ? handleEditEntry : undefined}
        canViewAll={permissions?.viewAll || false}
        currentUserId={currentUser?.id}
      />

      {/* Entry Modal */}
      {showModal && (
        <ScheduleEntryModal
          entry={editingEntry}
          onClose={handleModalClose}
          onSave={handleModalSave}
          canPublish={permissions?.publish || false}
        />
      )}

      {/* Emergency Coverage Modal */}
      {showEmergencyModal && (
        <EmergencyCoverageModal
          onClose={() => setShowEmergencyModal(false)}
          onSave={handleEmergencyModalSave}
        />
      )}

      {/* Copy Week Modal */}
      {showCopyWeekModal && (
        <CopyWeekModal
          currentWeekStart={getWeekStartDate()}
          onClose={() => setShowCopyWeekModal(false)}
          onSuccess={handleCopyWeekSuccess}
        />
      )}
    </div>
  )
}
