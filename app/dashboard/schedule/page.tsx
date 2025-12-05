'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ScheduleEntry {
  id: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'FILLED' | 'CANCELLED'
  user: {
    id: string
    firstName: string
    lastName: string
  }
  rinkId: string | null
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'month'>('week')
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedule()
  }, [currentDate, view])

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const startDate = getStartOfWeek(currentDate)
      const endDate = view === 'week'
        ? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        : getEndOfMonth(currentDate)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const res = await fetch(`/api/schedule?${params}`)
      if (res.ok) {
        const data = await res.json()
        setScheduleEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getEndOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  const getWeekDays = () => {
    const start = getStartOfWeek(currentDate)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const weekDays = getWeekDays()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Schedule</h1>
          <p className="text-gray-600 mt-1">
            Manage operator shifts and coverage
          </p>
        </div>
        <Link href="/dashboard/schedule/manage" className="btn btn-primary">
          Manage Shifts
        </Link>
      </div>

      {/* Calendar Navigation */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">
              {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
            </h2>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn btn-secondary text-sm"
            >
              Today
            </button>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as 'week' | 'month')}
              className="input text-sm"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weekly View */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div
                  key={i}
                  className={`p-4 text-center border-r last:border-r-0 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-sm text-gray-500">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDays.map((day, i) => {
              const dayEntries = scheduleEntries.filter(
                (e) => new Date(e.date).toDateString() === day.toDateString()
              )
              return (
                <div key={i} className="border-r last:border-r-0 p-2">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No shifts</p>
                  ) : (
                    <div className="space-y-1">
                      {dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-2 rounded text-xs ${
                            entry.isEmergency
                              ? 'bg-red-100 text-red-800'
                              : entry.isOpenShift
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <p className="font-medium">
                            {entry.startTime} - {entry.endTime}
                          </p>
                          <p className="truncate">
                            {entry.user.firstName} {entry.user.lastName.charAt(0)}.
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Open Shifts */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Shifts</h3>
        <div className="card p-8 text-center text-gray-500">
          <p>No open shifts at this time</p>
        </div>
      </div>
    </div>
  )
}
