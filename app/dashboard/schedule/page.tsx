'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Plus,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3X3,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Filter,
  Download,
  Upload,
  Settings,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { CalendarWeekView } from '@/components/schedule/CalendarWeekView'
import { CalendarMonthView } from '@/components/schedule/CalendarMonthView'
import { ShiftCard, ShiftListItem } from '@/components/schedule/ShiftCard'
import { ShiftTemplateManager } from '@/components/schedule/ShiftTemplateManager'
import {
  Schedule,
  Shift,
  ShiftTemplate,
  ScheduleStatus,
  CalendarView,
  CreateScheduleInput,
} from '@/types/schedule'
import { formatDate, getWeekStart, getWeekEnd } from '@/lib/schedule-utils'

type ViewMode = 'calendar' | 'list' | 'templates'
type CalendarViewType = 'week' | 'month'

// Sample templates for demo
const sampleTemplates: ShiftTemplate[] = [
  {
    id: 'template-1',
    facilityId: 'facility-1',
    name: 'Morning Shift',
    description: 'Opening duties and morning ice maintenance',
    startTime: '06:00',
    endTime: '14:00',
    breakDuration: 30,
    color: '#3B82F6',
    minStaff: 2,
    maxStaff: 3,
    requiredRoles: ['Ice Technician'],
    recurrencePattern: 'WEEKLY',
    recurrenceDays: [1, 2, 3, 4, 5],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-2',
    facilityId: 'facility-1',
    name: 'Afternoon Shift',
    description: 'Afternoon ice maintenance and public skating support',
    startTime: '14:00',
    endTime: '22:00',
    breakDuration: 30,
    color: '#22C55E',
    minStaff: 2,
    maxStaff: 4,
    requiredRoles: ['Ice Technician', 'Front Desk'],
    recurrencePattern: 'WEEKLY',
    recurrenceDays: [1, 2, 3, 4, 5, 6, 0],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-3',
    facilityId: 'facility-1',
    name: 'Weekend Special',
    description: 'Weekend public skating support with extended hours',
    startTime: '10:00',
    endTime: '20:00',
    breakDuration: 60,
    color: '#A855F7',
    minStaff: 3,
    maxStaff: 5,
    requiredRoles: ['Ice Technician', 'Zamboni Operator', 'Front Desk'],
    recurrencePattern: 'WEEKLY',
    recurrenceDays: [0, 6],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default function ScheduleDashboard() {
  const router = useRouter()

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [calendarView, setCalendarView] = useState<CalendarViewType>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [templates, setTemplates] = useState<ShiftTemplate[]>(sampleTemplates)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | 'all'>('all')

  // Create schedule form state
  const [newSchedule, setNewSchedule] = useState<CreateScheduleInput>({
    name: '',
    description: '',
    startDate: getWeekStart(new Date()).toISOString().split('T')[0],
    endDate: getWeekEnd(new Date()).toISOString().split('T')[0],
  })

  // Fetch data
  useEffect(() => {
    fetchSchedules()
    fetchShifts()
  }, [currentDate])

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules')
      const data = await res.json()
      setSchedules(data.schedules || [])
      if (data.schedules?.length > 0 && !selectedSchedule) {
        setSelectedSchedule(data.schedules[0])
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    }
  }

  const fetchShifts = async () => {
    setIsLoading(true)
    try {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = getWeekEnd(currentDate)

      const res = await fetch(
        `/api/shifts?startDate=${weekStart.toISOString().split('T')[0]}&endDate=${weekEnd.toISOString().split('T')[0]}`
      )
      const data = await res.json()
      setShifts(data.shifts || [])
    } catch (error) {
      console.error('Failed to fetch shifts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      })

      if (res.ok) {
        const created = await res.json()
        setSchedules((prev) => [created, ...prev])
        setSelectedSchedule(created)
        setIsCreateDialogOpen(false)
        setNewSchedule({
          name: '',
          description: '',
          startDate: getWeekStart(new Date()).toISOString().split('T')[0],
          endDate: getWeekEnd(new Date()).toISOString().split('T')[0],
        })
      }
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }

  const handleShiftClick = (shift: Shift) => {
    setSelectedShift(shift)
    setIsShiftDialogOpen(true)
  }

  const handlePublishSchedule = async (scheduleId: string) => {
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PUBLISHED',
          publishedAt: new Date().toISOString(),
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSchedules((prev) =>
          prev.map((s) => (s.id === scheduleId ? updated : s))
        )
        if (selectedSchedule?.id === scheduleId) {
          setSelectedSchedule(updated)
        }
      }
    } catch (error) {
      console.error('Failed to publish schedule:', error)
    }
  }

  // Stats calculations
  const stats = useMemo(() => {
    const total = shifts.length
    const filled = shifts.filter((s) => s.status === 'FILLED').length
    const open = shifts.filter((s) => s.isOpen || s.status === 'OPEN').length
    const totalHours = shifts.reduce((acc, s) => {
      const start = parseInt(s.startTime.split(':')[0]) + parseInt(s.startTime.split(':')[1]) / 60
      const end = parseInt(s.endTime.split(':')[0]) + parseInt(s.endTime.split(':')[1]) / 60
      return acc + (end - start - (s.breakDuration || 0) / 60)
    }, 0)

    return { total, filled, open, totalHours }
  }, [shifts])

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (statusFilter === 'all') return schedules
    return schedules.filter((s) => s.status === statusFilter)
  }, [schedules, statusFilter])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Manage staff schedules, shifts, and availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Filled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.filled}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Shifts</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
            <p className="text-xs text-muted-foreground">Need coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Scheduled this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Schedule List */}
        <div className="w-full lg:w-72 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Schedules</CardTitle>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as ScheduleStatus | 'all')}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {filteredSchedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    className={cn(
                      'w-full p-3 text-left hover:bg-muted/50 transition-colors',
                      selectedSchedule?.id === schedule.id && 'bg-muted'
                    )}
                    onClick={() => setSelectedSchedule(schedule)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{schedule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(schedule.startDate))} -{' '}
                          {formatDate(new Date(schedule.endDate))}
                        </p>
                      </div>
                      <Badge
                        variant={
                          schedule.status === 'PUBLISHED'
                            ? 'default'
                            : schedule.status === 'DRAFT'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{schedule.totalShifts} shifts</span>
                      <span>{schedule.openShifts} open</span>
                    </div>
                  </button>
                ))}

                {filteredSchedules.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No schedules found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar/List Area */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* View Mode Tabs */}
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as ViewMode)}
                    className="w-auto"
                  >
                    <TabsList className="h-9">
                      <TabsTrigger value="calendar" className="px-3">
                        <Calendar className="h-4 w-4 mr-1" />
                        Calendar
                      </TabsTrigger>
                      <TabsTrigger value="list" className="px-3">
                        <List className="h-4 w-4 mr-1" />
                        List
                      </TabsTrigger>
                      <TabsTrigger value="templates" className="px-3">
                        <Grid3X3 className="h-4 w-4 mr-1" />
                        Templates
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Calendar View Switcher */}
                  {viewMode === 'calendar' && (
                    <Select
                      value={calendarView}
                      onValueChange={(v) => setCalendarView(v as CalendarViewType)}
                    >
                      <SelectTrigger className="w-28 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Schedule Actions */}
                {selectedSchedule && (
                  <div className="flex items-center gap-2">
                    {selectedSchedule.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishSchedule(selectedSchedule.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Calendar Views */}
              {viewMode === 'calendar' && (
                <>
                  {calendarView === 'week' ? (
                    <CalendarWeekView
                      currentDate={currentDate}
                      shifts={shifts}
                      templates={templates}
                      onDateChange={setCurrentDate}
                      onShiftClick={handleShiftClick}
                      onCreateShift={(date, time) => {
                        console.log('Create shift:', date, time)
                      }}
                      showTimeSlots
                      className="border-0 shadow-none"
                    />
                  ) : (
                    <CalendarMonthView
                      currentDate={currentDate}
                      shifts={shifts}
                      templates={templates}
                      onDateChange={setCurrentDate}
                      onShiftClick={handleShiftClick}
                      onCreateShift={(date) => {
                        console.log('Create shift on:', date)
                      }}
                      className="border-0 shadow-none"
                    />
                  )}
                </>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="divide-y">
                  {shifts.length > 0 ? (
                    shifts.map((shift) => (
                      <ShiftListItem
                        key={shift.id}
                        shift={shift}
                        onClick={handleShiftClick}
                        isActive={selectedShift?.id === shift.id}
                      />
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No shifts scheduled for this period</p>
                    </div>
                  )}
                </div>
              )}

              {/* Templates View */}
              {viewMode === 'templates' && (
                <div className="p-4">
                  <ShiftTemplateManager
                    templates={templates}
                    onCreateTemplate={async (template) => {
                      const newTemplate = { ...template, id: `template_${Date.now()}`, isActive: true } as import('@/types/schedule').ShiftTemplate
                      setTemplates((prev) => [...prev, newTemplate])
                    }}
                    onUpdateTemplate={async (id, updates) => {
                      setTemplates((prev) =>
                        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
                      )
                    }}
                    onDeleteTemplate={async (id) => {
                      setTemplates((prev) => prev.filter((t) => t.id !== id))
                    }}
                    onDuplicateTemplate={async (id) => {
                      const original = templates.find((t) => t.id === id)
                      if (original) {
                        const copy = { ...original, id: `template_${Date.now()}`, name: `${original.name} (Copy)` }
                        setTemplates((prev) => [...prev, copy])
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Create a new schedule period for your facility
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Weekly Schedule - December Week 1"
                value={newSchedule.name}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any notes about this schedule..."
                value={newSchedule.description || ''}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newSchedule.startDate}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newSchedule.endDate}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSchedule}
              disabled={!newSchedule.name || !newSchedule.startDate || !newSchedule.endDate}
            >
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Detail Dialog */}
      <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
          </DialogHeader>

          {selectedShift && (
            <div className="space-y-4">
              <ShiftCard shift={selectedShift} variant="expanded" />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    router.push(`/dashboard/schedule/shifts/${selectedShift.id}/edit`)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Staff
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
