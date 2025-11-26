'use client'

import { useState, useEffect } from 'react'
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

export default function OpenShiftsPage() {
  const [openShifts, setOpenShifts] = useState<ScheduleEntry[]>([])
  const [myShifts, setMyShifts] = useState<ScheduleEntry[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRink, setSelectedRink] = useState<string>('')
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false)

  // Mock user ID - in production this would come from session
  const currentUserId = 'user-123'
  const facilityId = 'facility-demo'

  useEffect(() => {
    fetchOpenShifts()
    fetchMyShifts()
    fetchShifts()
    fetchRinks()
  }, [selectedRink, showEmergencyOnly])

  const fetchOpenShifts = async () => {
    try {
      const params = new URLSearchParams({
        status: 'PUBLISHED',
      })
      if (selectedRink) params.append('rinkId', selectedRink)

      const response = await fetch(`/api/schedule?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch open shifts')
      }
      const result = await response.json()

      // Filter for open shifts only
      let filtered = (result.entries || []).filter((entry: ScheduleEntry) => entry.isOpenShift)

      // Filter for emergency only if selected
      if (showEmergencyOnly) {
        filtered = filtered.filter((entry: ScheduleEntry) => entry.isEmergency)
      }

      // Filter out shifts that are already filled
      filtered = filtered.filter((entry: ScheduleEntry) => entry.status !== 'FILLED')

      // Sort: emergency shifts first, then by date
      filtered.sort((a: ScheduleEntry, b: ScheduleEntry) => {
        if (a.isEmergency && !b.isEmergency) return -1
        if (!a.isEmergency && b.isEmergency) return 1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      setOpenShifts(filtered)
    } catch (error) {
      console.error('Error fetching open shifts:', error)
      alert('Failed to load open shifts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyShifts = async () => {
    try {
      const params = new URLSearchParams({
        userId: currentUserId,
        status: 'PUBLISHED',
      })

      const response = await fetch(`/api/schedule?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch my shifts')
      }
      const result = await response.json()
      setMyShifts(result.entries || [])
    } catch (error) {
      console.error('Error fetching my shifts:', error)
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

  const handleClaimShift = async (entry: ScheduleEntry) => {
    if (!confirm('Are you sure you want to claim this shift?')) {
      return
    }

    try {
      const response = await fetch(`/api/schedule/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          status: 'FILLED',
          isOpenShift: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to claim shift')
      }

      alert('Shift claimed successfully!')
      fetchOpenShifts()
      fetchMyShifts()
    } catch (error) {
      console.error('Error claiming shift:', error)
      alert(error instanceof Error ? error.message : 'Failed to claim shift. Please try again.')
    }
  }

  const handleJoinWaitlist = async (entry: ScheduleEntry) => {
    if (!confirm('Do you want to join the waitlist for this shift?')) {
      return
    }

    try {
      // Get current waitlist
      const currentWaitlist = Array.isArray(entry.waitlistUsers) ? entry.waitlistUsers : []

      // Check if user is already on waitlist
      if (currentWaitlist.includes(currentUserId)) {
        alert('You are already on the waitlist for this shift.')
        return
      }

      // Add user to waitlist
      const updatedWaitlist = [...currentWaitlist, currentUserId]

      const response = await fetch(`/api/schedule/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitlistUsers: updatedWaitlist,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join waitlist')
      }

      alert('Successfully joined waitlist!')
      fetchOpenShifts()
    } catch (error) {
      console.error('Error joining waitlist:', error)
      alert(error instanceof Error ? error.message : 'Failed to join waitlist. Please try again.')
    }
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getWaitlistCount = (entry: ScheduleEntry) => {
    if (!entry.waitlistUsers) return 0
    return Array.isArray(entry.waitlistUsers) ? entry.waitlistUsers.length : 0
  }

  const isOnWaitlist = (entry: ScheduleEntry) => {
    if (!entry.waitlistUsers) return false
    const waitlist = Array.isArray(entry.waitlistUsers) ? entry.waitlistUsers : []
    return waitlist.includes(currentUserId)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Open Shifts</h1>
          <p className="text-wolf-600 mt-2">View and claim available shifts</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-wolf-600">Loading open shifts...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-wolf-200 pb-4">
        <h1 className="text-3xl font-bold text-navy">Open Shifts</h1>
        <p className="text-wolf-600 mt-2">View and claim available shifts</p>
      </div>

      {/* Emergency Alert Banner */}
      {openShifts.some((s) => s.isEmergency) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Emergency Shifts Available</h3>
              <p className="text-sm text-red-700 mt-1">
                {openShifts.filter((s) => s.isEmergency).length} emergency shift(s) need immediate coverage.
                Please claim these shifts if you are available.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-navy mr-2">Rink:</label>
              <select
                value={selectedRink}
                onChange={(e) => setSelectedRink(e.target.value)}
                className="px-3 py-2 border border-wolf-300 rounded-md text-sm"
              >
                <option value="">All Rinks</option>
                {rinks.map((rink) => (
                  <option key={rink.id} value={rink.id}>
                    {rink.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emergencyOnly"
                checked={showEmergencyOnly}
                onChange={(e) => setShowEmergencyOnly(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="emergencyOnly" className="text-sm text-navy">
                Emergency Shifts Only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Claimed Shifts */}
      <Card>
        <CardHeader>
          <CardTitle>My Claimed Shifts ({myShifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {myShifts.length === 0 ? (
            <p className="text-sm text-wolf-500 text-center py-4">
              You haven't claimed any shifts yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myShifts.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded border-l-4 bg-green-50"
                  style={{ borderLeftColor: getShiftColor(entry.shiftId) }}
                >
                  <div>
                    <p className="font-medium text-navy">
                      {formatDate(entry.date)}
                      {entry.isEmergency && (
                        <Badge variant="destructive" className="ml-2">
                          Emergency
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-wolf-600">
                      {getShiftName(entry.shiftId)} • {entry.startTime} - {entry.endTime} •{' '}
                      {getRinkName(entry.rinkId)}
                    </p>
                  </div>
                  <Badge variant="success">Claimed</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Open Shifts */}
      <Card>
        <CardHeader>
          <CardTitle>Available Shifts ({openShifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {openShifts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wolf-600">No open shifts available at this time.</p>
              <p className="text-sm text-wolf-500 mt-1">
                Check back later or enable notifications to get alerted when new shifts are posted.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {openShifts.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded border-l-4 hover:bg-wolf-50 transition-colors"
                  style={{ borderLeftColor: getShiftColor(entry.shiftId) }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-navy">{formatDate(entry.date)}</p>
                      {entry.isEmergency && (
                        <Badge variant="destructive">Emergency</Badge>
                      )}
                    </div>
                    <p className="text-sm text-wolf-600 mb-1">
                      {getShiftName(entry.shiftId)} • {entry.startTime} - {entry.endTime} •{' '}
                      {getRinkName(entry.rinkId)}
                    </p>
                    {getWaitlistCount(entry) > 0 && (
                      <p className="text-xs text-wolf-500">
                        {getWaitlistCount(entry)} {getWaitlistCount(entry) === 1 ? 'person' : 'people'} on waitlist
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOnWaitlist(entry) ? (
                      <Badge variant="warning">On Waitlist</Badge>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={() => handleClaimShift(entry)}
                          size="sm"
                        >
                          Claim Shift
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleJoinWaitlist(entry)}
                          size="sm"
                        >
                          Join Waitlist
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-wolf-600">
            <p>
              <strong className="text-navy">Claiming Shifts:</strong> Click "Claim Shift" to take ownership of an open shift.
              Once claimed, the shift will appear in your schedule.
            </p>
            <p>
              <strong className="text-navy">Waitlist:</strong> If you're interested in a shift but not ready to commit,
              join the waitlist. If the shift becomes available again, waitlisted users will be notified in order.
            </p>
            <p>
              <strong className="text-navy">Emergency Shifts:</strong> Emergency shifts marked with a red badge need
              immediate coverage. Please prioritize these if you are available.
            </p>
            <p>
              <strong className="text-navy">First-Come-First-Served:</strong> Open shifts are available on a
              first-come-first-served basis. Act quickly to claim shifts you want.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
