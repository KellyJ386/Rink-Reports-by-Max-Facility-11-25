'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
}

interface ScheduleEntry {
  id: string
  userId: string
  user?: User
  shiftId: string | null
  rinkId: string | null
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'FILLED' | 'CANCELLED'
  waitlistUsers: any
  createdAt: string
  updatedAt: string
  createdById: string
  publishedAt: string | null
  publishedById: string | null
}

interface Rink {
  id: string
  name: string
  facilityId: string
}

export default function ScheduleBuilderPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)

  // Date range for viewing schedule
  const [startDate, setStartDate] = useState(getMonday(new Date()))
  const [endDate, setEndDate] = useState(getSunday(new Date()))

  // Filters
  const [selectedRink, setSelectedRink] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    shiftId: '',
    rinkId: '',
    date: '',
    startTime: '',
    endTime: '',
    isOpenShift: false,
    isEmergency: false,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'FILLED' | 'CANCELLED',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Mock user ID - in production this would come from session
  const currentUserId = 'user-123'
  const facilityId = 'facility-demo'

  useEffect(() => {
    fetchScheduleEntries()
    fetchUsers()
    fetchShifts()
    fetchRinks()
  }, [startDate, endDate, selectedRink, selectedStatus])

  function getMonday(date: Date): string {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  function getSunday(date: Date): string {
    const monday = new Date(getMonday(date))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return sunday.toISOString().split('T')[0]
  }

  function previousWeek() {
    const currentStart = new Date(startDate)
    currentStart.setDate(currentStart.getDate() - 7)
    setStartDate(getMonday(currentStart))
    setEndDate(getSunday(currentStart))
  }

  function nextWeek() {
    const currentStart = new Date(startDate)
    currentStart.setDate(currentStart.getDate() + 7)
    setStartDate(getMonday(currentStart))
    setEndDate(getSunday(currentStart))
  }

  function currentWeek() {
    setStartDate(getMonday(new Date()))
    setEndDate(getSunday(new Date()))
  }

  const fetchScheduleEntries = async () => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })
      if (selectedRink) params.append('rinkId', selectedRink)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/schedule?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule entries')
      }
      const result = await response.json()
      setEntries(result.entries || [])
    } catch (error) {
      console.error('Error fetching schedule entries:', error)
      alert('Failed to load schedule. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?facilityId=${facilityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const result = await response.json()
      setUsers(result.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchShifts = async () => {
    try {
      const response = await fetch(`/api/shifts?facilityId=${facilityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch shifts')
      }
      const result = await response.json()
      setShifts(result.shifts || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
    }
  }

  const fetchRinks = async () => {
    try {
      const response = await fetch(`/api/rinks?facilityId=${facilityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch rinks')
      }
      const result = await response.json()
      setRinks(result.rinks || [])
    } catch (error) {
      console.error('Error fetching rinks:', error)
    }
  }

  const handleCreateNew = () => {
    setEditingEntry(null)
    setFormData({
      userId: '',
      shiftId: '',
      rinkId: '',
      date: '',
      startTime: '',
      endTime: '',
      isOpenShift: false,
      isEmergency: false,
      status: 'DRAFT',
    })
    setShowCreateForm(true)
  }

  const handleEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry)
    setFormData({
      userId: entry.userId,
      shiftId: entry.shiftId || '',
      rinkId: entry.rinkId || '',
      date: entry.date.split('T')[0],
      startTime: entry.startTime,
      endTime: entry.endTime,
      isOpenShift: entry.isOpenShift,
      isEmergency: entry.isEmergency,
      status: entry.status,
    })
    setShowCreateForm(true)
  }

  const handleCancel = () => {
    setShowCreateForm(false)
    setEditingEntry(null)
    setFormData({
      userId: '',
      shiftId: '',
      rinkId: '',
      date: '',
      startTime: '',
      endTime: '',
      isOpenShift: false,
      isEmergency: false,
      status: 'DRAFT',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const body: any = {
        userId: formData.userId,
        shiftId: formData.shiftId || null,
        rinkId: formData.rinkId || null,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isOpenShift: formData.isOpenShift,
        isEmergency: formData.isEmergency,
        status: formData.status,
        createdById: currentUserId,
      }

      if (formData.status === 'PUBLISHED') {
        body.publishedById = currentUserId
      }

      const url = editingEntry ? `/api/schedule/${editingEntry.id}` : '/api/schedule'
      const method = editingEntry ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save schedule entry')
      }

      alert(
        editingEntry ? 'Schedule entry updated successfully!' : 'Schedule entry created successfully!'
      )
      handleCancel()
      fetchScheduleEntries()
    } catch (error) {
      console.error('Error saving schedule entry:', error)
      alert(error instanceof Error ? error.message : 'Failed to save schedule entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (entry: ScheduleEntry) => {
    if (
      !confirm(
        `Are you sure you want to delete this schedule entry? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/schedule/${entry.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete schedule entry')
      }

      alert('Schedule entry deleted successfully!')
      fetchScheduleEntries()
    } catch (error) {
      console.error('Error deleting schedule entry:', error)
      alert('Failed to delete schedule entry. Please try again.')
    }
  }

  const handlePublish = async (entry: ScheduleEntry) => {
    if (!confirm('Are you sure you want to publish this schedule entry? Users will be notified.')) {
      return
    }

    try {
      const response = await fetch(`/api/schedule/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PUBLISHED',
          publishedById: currentUserId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish schedule entry')
      }

      alert('Schedule entry published successfully!')
      fetchScheduleEntries()
    } catch (error) {
      console.error('Error publishing schedule entry:', error)
      alert('Failed to publish schedule entry. Please try again.')
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
  }

  const getShiftName = (shiftId: string | null) => {
    if (!shiftId) return 'Custom Hours'
    const shift = shifts.find((s) => s.id === shiftId)
    return shift ? shift.name : 'Unknown Shift'
  }

  const getShiftColor = (shiftId: string | null) => {
    if (!shiftId) return '#6B7280'
    const shift = shifts.find((s) => s.id === shiftId)
    return shift?.color || '#3B82F6'
  }

  const getRinkName = (rinkId: string | null) => {
    if (!rinkId) return 'All Rinks'
    const rink = rinks.find((r) => r.id === rinkId)
    return rink ? rink.name : 'Unknown Rink'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="warning">Draft</Badge>
      case 'PUBLISHED':
        return <Badge variant="default">Published</Badge>
      case 'FILLED':
        return <Badge variant="success">Filled</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const groupEntriesByDate = () => {
    const grouped: { [date: string]: ScheduleEntry[] } = {}
    entries.forEach((entry) => {
      const dateKey = entry.date.split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(entry)
    })
    return grouped
  }

  const getDatesInRange = () => {
    const dates = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Schedule Builder</h1>
          <p className="text-wolf-600 mt-2">Manage staff schedules and shifts</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-wolf-600">Loading schedule...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const groupedEntries = groupEntriesByDate()
  const datesInRange = getDatesInRange()

  return (
    <div className="space-y-6">
      <div className="border-b border-wolf-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Schedule Builder</h1>
            <p className="text-wolf-600 mt-2">Manage staff schedules and shifts</p>
          </div>
          <Button onClick={handleCreateNew} disabled={showCreateForm}>
            Create Schedule Entry
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Week View</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousWeek}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={currentWeek}>
                Current Week
              </Button>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                Next
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-navy mr-2">Rink:</label>
              <select
                value={selectedRink}
                onChange={(e) => setSelectedRink(e.target.value)}
                className="px-3 py-1 border border-wolf-300 rounded-md text-sm"
              >
                <option value="">All Rinks</option>
                {rinks.map((rink) => (
                  <option key={rink.id} value={rink.id}>
                    {rink.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy mr-2">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-wolf-300 rounded-md text-sm"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="FILLED">Filled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <div className="mb-6 p-4 border-2 border-action-green rounded-lg bg-green-50">
              <h3 className="font-semibold text-navy mb-4">
                {editingEntry ? 'Edit Schedule Entry' : 'Create New Schedule Entry'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      User <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-wolf-300 rounded-md"
                      required
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Shift Template</label>
                    <select
                      value={formData.shiftId}
                      onChange={(e) => {
                        const shiftId = e.target.value
                        const shift = shifts.find((s) => s.id === shiftId)
                        setFormData({
                          ...formData,
                          shiftId,
                          startTime: shift?.startTime || formData.startTime,
                          endTime: shift?.endTime || formData.endTime,
                        })
                      }}
                      className="w-full px-3 py-2 border border-wolf-300 rounded-md"
                    >
                      <option value="">Custom Hours</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-wolf-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Rink</label>
                    <select
                      value={formData.rinkId}
                      onChange={(e) => setFormData({ ...formData, rinkId: e.target.value })}
                      className="w-full px-3 py-2 border border-wolf-300 rounded-md"
                    >
                      <option value="">All Rinks</option>
                      {rinks.map((rink) => (
                        <option key={rink.id} value={rink.id}>
                          {rink.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-wolf-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-wolf-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isOpenShift"
                      checked={formData.isOpenShift}
                      onChange={(e) =>
                        setFormData({ ...formData, isOpenShift: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label htmlFor="isOpenShift" className="text-sm text-navy">
                      Open Shift
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isEmergency"
                      checked={formData.isEmergency}
                      onChange={(e) =>
                        setFormData({ ...formData, isEmergency: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label htmlFor="isEmergency" className="text-sm text-navy">
                      Emergency Shift
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'FILLED' | 'CANCELLED',
                        })
                      }
                      className="w-full px-3 py-2 border border-wolf-300 rounded-md"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="FILLED">Filled</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-wolf-200">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving
                      ? 'Saving...'
                      : editingEntry
                        ? 'Update Entry'
                        : 'Create Entry'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {datesInRange.map((date) => (
              <div key={date} className="border border-wolf-200 rounded-lg p-4">
                <h3 className="font-semibold text-navy mb-3">{formatDate(date)}</h3>
                {groupedEntries[date] && groupedEntries[date].length > 0 ? (
                  <div className="space-y-2">
                    {groupedEntries[date].map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded border-l-4"
                        style={{ borderLeftColor: getShiftColor(entry.shiftId) }}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-navy">
                              {getUserName(entry.userId)}
                              {entry.isEmergency && (
                                <Badge variant="destructive" className="ml-2">
                                  Emergency
                                </Badge>
                              )}
                              {entry.isOpenShift && (
                                <Badge variant="warning" className="ml-2">
                                  Open
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-wolf-600">
                              {getShiftName(entry.shiftId)} • {entry.startTime} - {entry.endTime} •{' '}
                              {getRinkName(entry.rinkId)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(entry.status)}
                          {entry.status === 'DRAFT' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublish(entry)}
                              disabled={showCreateForm}
                            >
                              Publish
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            disabled={showCreateForm}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(entry)}
                            disabled={showCreateForm}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-wolf-500 text-center py-4">No schedule entries</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-navy">{entries.length}</p>
              <p className="text-sm text-wolf-600">Total Entries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {entries.filter((e) => e.status === 'DRAFT').length}
              </p>
              <p className="text-sm text-wolf-600">Draft</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {entries.filter((e) => e.status === 'PUBLISHED').length}
              </p>
              <p className="text-sm text-wolf-600">Published</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-action-green">
                {entries.filter((e) => e.status === 'FILLED').length}
              </p>
              <p className="text-sm text-wolf-600">Filled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
