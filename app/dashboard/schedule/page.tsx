'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar'
import { ScheduleStats } from '@/types/schedule'

export default function ScheduleDashboardPage() {
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchStats()
  }, [currentDate])

  const fetchStats = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const response = await fetch(
        `/api/schedule/entries?stats=true&startDate=${startOfMonth.toISOString().split('T')[0]}&endDate=${endOfMonth.toISOString().split('T')[0]}`
      )

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: 'Total Shifts',
      value: stats?.totalEntries || 0,
      icon: '📅',
      color: 'bg-blue-500'
    },
    {
      label: 'Published',
      value: stats?.publishedEntries || 0,
      icon: '✓',
      color: 'bg-green-500'
    },
    {
      label: 'Open Shifts',
      value: stats?.openShifts || 0,
      icon: '🔔',
      color: 'bg-yellow-500',
      href: '/dashboard/schedule/open-shifts'
    },
    {
      label: 'Emergency',
      value: stats?.emergencyShifts || 0,
      icon: '🚨',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Card = stat.href ? Link : 'div'
          return (
            <Card
              key={stat.label}
              href={stat.href || '#'}
              className={`bg-white rounded-lg shadow-sm p-6 ${stat.href ? 'hover:shadow-md cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl text-white`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/schedule/my-schedule"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Schedule
          </Link>
          <Link
            href="/dashboard/schedule/open-shifts"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Open Shifts
          </Link>
          <Link
            href="/dashboard/admin/shifts"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Manage Shift Definitions
          </Link>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Schedule Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ← Prev
            </button>
            <span className="font-medium px-4">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              Next →
            </button>
          </div>
        </div>
        <ScheduleCalendar
          year={currentDate.getFullYear()}
          month={currentDate.getMonth()}
        />
      </div>
    </div>
  )
}
