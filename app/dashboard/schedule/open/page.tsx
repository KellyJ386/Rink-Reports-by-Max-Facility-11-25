'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OpenShift {
  id: string
  date: string
  startTime: string
  endTime: string
  isEmergency: boolean
  status: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export default function OpenShiftsPage() {
  const router = useRouter()
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pickingUp, setPickingUp] = useState<string | null>(null)

  useEffect(() => {
    fetchOpenShifts()
  }, [])

  const fetchOpenShifts = async () => {
    try {
      const response = await fetch('/api/schedule?openOnly=true')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load')
      }

      // Filter future shifts only
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const futureShifts = (data.entries || []).filter(
        (shift: OpenShift) => new Date(shift.date) >= now
      )
      setOpenShifts(futureShifts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load open shifts')
    } finally {
      setLoading(false)
    }
  }

  const handlePickupShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to pick up this shift?')) {
      return
    }

    setPickingUp(shiftId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/schedule/${shiftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pickup' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to pick up shift')
      }

      // Remove the shift from the list
      setOpenShifts(openShifts.filter((s) => s.id !== shiftId))

      // Show success message
      setSuccess('Shift picked up successfully! Check your schedule.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick up shift')
    } finally {
      setPickingUp(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  // Separate emergency and regular open shifts
  const emergencyShifts = openShifts.filter((s) => s.isEmergency)
  const regularShifts = openShifts.filter((s) => !s.isEmergency)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/schedule" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Open Shifts</h1>
          <p className="text-gray-600 text-sm mt-1">Available shifts needing coverage</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {openShifts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">All Clear!</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Shifts Covered</h2>
          <p className="text-gray-500">No open shifts at this time</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Emergency Shifts */}
          {emergencyShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">URGENT</span>
                Emergency Coverage Needed
              </h2>
              <div className="space-y-3">
                {emergencyShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="card border-l-4 border-red-500 bg-red-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-red-900">
                          {new Date(shift.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-red-700">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          Urgent
                        </span>
                        <button
                          onClick={() => handlePickupShift(shift.id)}
                          disabled={pickingUp === shift.id}
                          className="btn btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {pickingUp === shift.id ? 'Picking up...' : 'Pick Up Shift'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Open Shifts */}
          {regularShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Available Shifts</h2>
              <div className="space-y-3">
                {regularShifts.map((shift) => (
                  <div key={shift.id} className="card border-l-4 border-orange-400">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {new Date(shift.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-gray-600">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePickupShift(shift.id)}
                        disabled={pickingUp === shift.id}
                        className="btn btn-primary disabled:opacity-50"
                      >
                        {pickingUp === shift.id ? 'Picking up...' : 'Pick Up Shift'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
