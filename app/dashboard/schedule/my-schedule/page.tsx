'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  ArrowRightLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Settings,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { CalendarWeekView } from '@/components/schedule/CalendarWeekView'
import { MiniCalendar } from '@/components/schedule/CalendarMonthView'
import { ShiftCard, ShiftListItem } from '@/components/schedule/ShiftCard'
import { ShiftSwapDialog, SwapRequestList } from '@/components/schedule/ShiftSwapDialog'
import { AvailabilityManager, WeeklyAvailabilityGrid } from '@/components/schedule/AvailabilityManager'
import {
  Shift,
  ShiftSwapRequest,
  Availability,
  CreateSwapRequestInput,
  CreateAvailabilityInput,
} from '@/types/schedule'
import { formatDate, formatTime, calculateDuration, getWeekStart, getWeekEnd } from '@/lib/schedule-utils'

// Sample employee data
const currentEmployee = {
  id: 'emp-1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@rink.com',
  role: 'Ice Technician',
  avatar: undefined,
}

// Sample colleagues for swap
const colleagues = [
  { id: 'emp-2', firstName: 'Sarah', lastName: 'Johnson', avatar: undefined, role: 'Manager' },
  { id: 'emp-3', firstName: 'Mike', lastName: 'Williams', avatar: undefined, role: 'Ice Technician' },
  { id: 'emp-4', firstName: 'Emily', lastName: 'Brown', avatar: undefined, role: 'Front Desk' },
  { id: 'emp-5', firstName: 'David', lastName: 'Lee', avatar: undefined, role: 'Zamboni Operator' },
]

export default function MySchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('schedule')
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([])
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Swap dialog state
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false)
  const [selectedShiftForSwap, setSelectedShiftForSwap] = useState<Shift | null>(null)

  useEffect(() => {
    fetchData()
  }, [currentDate])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = getWeekEnd(currentDate)

      // Fetch my shifts
      const shiftsRes = await fetch(
        `/api/shifts?employeeId=${currentEmployee.id}&startDate=${weekStart.toISOString().split('T')[0]}&endDate=${weekEnd.toISOString().split('T')[0]}`
      )
      const shiftsData = await shiftsRes.json()
      setMyShifts(shiftsData.shifts || [])

      // Fetch open shifts
      const openRes = await fetch(
        `/api/shifts?isOpen=true&startDate=${weekStart.toISOString().split('T')[0]}&endDate=${weekEnd.toISOString().split('T')[0]}`
      )
      const openData = await openRes.json()
      setAvailableShifts(openData.shifts || [])

      // Fetch swap requests
      const swapRes = await fetch(`/api/swap-requests?employeeId=${currentEmployee.id}`)
      const swapData = await swapRes.json()
      setSwapRequests(swapData.swapRequests || [])

      // Fetch my availability
      const availRes = await fetch(`/api/availability?employeeId=${currentEmployee.id}`)
      const availData = await availRes.json()
      setAvailabilities(availData.availabilities || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Stats
  const stats = useMemo(() => {
    const totalHours = myShifts.reduce((acc, shift) => {
      return acc + calculateDuration(shift.startTime, shift.endTime, shift.breakDuration)
    }, 0)

    const confirmedShifts = myShifts.filter(
      (s) => s.assignedEmployees.some(
        (a) => a.employeeId === currentEmployee.id && a.status === 'CONFIRMED'
      )
    ).length

    const pendingConfirmation = myShifts.filter(
      (s) => s.assignedEmployees.some(
        (a) => a.employeeId === currentEmployee.id && a.status === 'ASSIGNED'
      )
    ).length

    const pendingSwaps = swapRequests.filter((r) => r.status === 'PENDING').length

    return { totalHours, confirmedShifts, pendingConfirmation, pendingSwaps, totalShifts: myShifts.length }
  }, [myShifts, swapRequests])

  // Upcoming shifts (next 7 days)
  const upcomingShifts = useMemo(() => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    return myShifts
      .filter((shift) => {
        const shiftDate = new Date(shift.date)
        return shiftDate >= today && shiftDate <= nextWeek
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })
  }, [myShifts])

  const handleSwapRequest = async (data: CreateSwapRequestInput) => {
    try {
      const res = await fetch('/api/swap-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          requesterId: currentEmployee.id,
        }),
      })

      if (res.ok) {
        const newRequest = await res.json()
        setSwapRequests((prev) => [newRequest, ...prev])
        setIsSwapDialogOpen(false)
        setSelectedShiftForSwap(null)
      }
    } catch (error) {
      console.error('Failed to create swap request:', error)
    }
  }

  const handleAvailabilityAdd = async (data: CreateAvailabilityInput) => {
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          employeeId: currentEmployee.id,
        }),
      })

      if (res.ok) {
        const newAvail = await res.json()
        setAvailabilities((prev) => [...prev, newAvail])
      }
    } catch (error) {
      console.error('Failed to add availability:', error)
    }
  }

  const openSwapDialog = (shift: Shift) => {
    setSelectedShiftForSwap(shift)
    setIsSwapDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={currentEmployee.avatar} />
            <AvatarFallback className="text-lg">
              {currentEmployee.firstName[0]}
              {currentEmployee.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {currentEmployee.firstName}!
            </h1>
            <p className="text-muted-foreground">{currentEmployee.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShifts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHours.toFixed(1)} hours scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmedShifts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingConfirmation} pending confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Shifts</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableShifts.length}</div>
            <p className="text-xs text-muted-foreground">Available to pick up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Swap Requests</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSwaps}</div>
            <p className="text-xs text-muted-foreground">Pending requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Calendar & Upcoming */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="schedule">
                <Calendar className="h-4 w-4 mr-2" />
                My Schedule
              </TabsTrigger>
              <TabsTrigger value="availability">
                <Clock className="h-4 w-4 mr-2" />
                Availability
              </TabsTrigger>
              <TabsTrigger value="swaps">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Swap Requests
                {stats.pendingSwaps > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {stats.pendingSwaps}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="m-0">
              <CalendarWeekView
                currentDate={currentDate}
                shifts={myShifts}
                onDateChange={setCurrentDate}
                onShiftClick={(shift) => console.log('Shift clicked:', shift)}
                showTimeSlots
              />
            </TabsContent>

            <TabsContent value="availability" className="m-0">
              <div className="space-y-6">
                <WeeklyAvailabilityGrid
                  employeeId={currentEmployee.id}
                  availabilities={availabilities}
                  onTimeSlotClick={(day, time) => {
                    console.log('Time slot clicked:', day, time)
                  }}
                />

                <AvailabilityManager
                  employeeId={currentEmployee.id}
                  availabilities={availabilities}
                  onAdd={handleAvailabilityAdd}
                  onUpdate={async (id, data) => {
                    console.log('Update availability:', id, data)
                  }}
                  onDelete={async (id) => {
                    setAvailabilities((prev) => prev.filter((a) => a.id !== id))
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="swaps" className="m-0">
              <Card>
                <CardContent className="pt-6">
                  <SwapRequestList
                    requests={swapRequests}
                    currentUserId={currentEmployee.id}
                    onRespond={async (requestId, action, note) => {
                      const res = await fetch(`/api/swap-requests/${requestId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: action.toLowerCase(),
                          note,
                        }),
                      })
                      if (res.ok) {
                        const updated = await res.json()
                        setSwapRequests((prev) =>
                          prev.map((r) => (r.id === requestId ? updated : r))
                        )
                      }
                    }}
                    onCancel={async (requestId) => {
                      const res = await fetch(`/api/swap-requests/${requestId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'cancel' }),
                      })
                      if (res.ok) {
                        const updated = await res.json()
                        setSwapRequests((prev) =>
                          prev.map((r) => (r.id === requestId ? updated : r))
                        )
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Mini Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniCalendar
                selectedDate={currentDate}
                onSelectDate={setCurrentDate}
                highlightedDates={myShifts.map((s) => s.date)}
              />
            </CardContent>
          </Card>

          {/* Upcoming Shifts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Upcoming Shifts</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {upcomingShifts.length > 0 ? (
                  upcomingShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => openSwapDialog(shift)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1 h-full min-h-[40px] rounded-full"
                          style={{ backgroundColor: shift.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{shift.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(shift.date))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {calculateDuration(shift.startTime, shift.endTime, shift.breakDuration).toFixed(1)}h
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No upcoming shifts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Open Shifts to Pick Up */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Open Shifts</CardTitle>
                <Badge variant="secondary">{availableShifts.length}</Badge>
              </div>
              <CardDescription>Available for pickup</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[250px] overflow-y-auto">
                {availableShifts.length > 0 ? (
                  availableShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1 h-full min-h-[40px] rounded-full"
                          style={{ backgroundColor: shift.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{shift.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(shift.date))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0">
                          <Plus className="h-3 w-3 mr-1" />
                          Claim
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No open shifts available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Swap Dialog */}
      {selectedShiftForSwap && (
        <ShiftSwapDialog
          isOpen={isSwapDialogOpen}
          onClose={() => {
            setIsSwapDialogOpen(false)
            setSelectedShiftForSwap(null)
          }}
          myShift={selectedShiftForSwap}
          availableEmployees={colleagues}
          availableShifts={[]} // Would fetch colleague's shifts
          onSubmit={handleSwapRequest}
        />
      )}
    </div>
  )
}
