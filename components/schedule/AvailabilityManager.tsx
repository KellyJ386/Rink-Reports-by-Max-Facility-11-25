'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock, CalendarDays, Repeat, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  Availability,
  AvailabilityType,
  RecurrencePattern,
  CreateAvailabilityInput,
  AVAILABILITY_COLORS,
} from '@/types/schedule'
import { formatDate, formatTimeDisplay } from '@/lib/schedule-utils'

interface AvailabilityManagerProps {
  employeeId: string
  availabilities: Availability[]
  onAdd: (data: CreateAvailabilityInput) => Promise<void>
  onUpdate: (id: string, data: Partial<CreateAvailabilityInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
  readonly?: boolean
}

const AVAILABILITY_TYPES: { value: AvailabilityType; label: string; description: string }[] = [
  { value: 'AVAILABLE', label: 'Available', description: 'I can work during these hours' },
  { value: 'UNAVAILABLE', label: 'Unavailable', description: 'I cannot work during these hours' },
  { value: 'PREFERRED', label: 'Preferred', description: 'I prefer to work during these hours' },
  { value: 'IF_NEEDED', label: 'If Needed', description: 'I can work if absolutely necessary' },
]

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Every day' },
  { value: 'WEEKLY', label: 'Every week' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Every month' },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

export function AvailabilityManager({
  employeeId,
  availabilities,
  onAdd,
  onUpdate,
  onDelete,
  isLoading = false,
  readonly = false,
}: AvailabilityManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateAvailabilityInput>({
    date: new Date().toISOString().split('T')[0],
    type: 'AVAILABLE',
    allDay: true,
  })

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'AVAILABLE',
      allDay: true,
    })
    setEditingAvailability(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (availability: Availability) => {
    setEditingAvailability(availability)
    setFormData({
      date: availability.date,
      startTime: availability.startTime,
      endTime: availability.endTime,
      allDay: availability.allDay,
      type: availability.type,
      isRecurring: availability.isRecurring,
      recurrencePattern: availability.recurrencePattern,
      recurrenceEndDate: availability.recurrenceEndDate,
      reason: availability.reason,
      notes: availability.notes,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      if (editingAvailability) {
        await onUpdate(editingAvailability.id, formData)
      } else {
        await onAdd(formData)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save availability:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await onDelete(deleteConfirmId)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete availability:', error)
    }
  }

  const getTypeColor = (type: AvailabilityType) => {
    return AVAILABILITY_COLORS[type]
  }

  const groupedAvailabilities = availabilities.reduce((acc, avail) => {
    const key = avail.isRecurring ? 'recurring' : 'oneTime'
    if (!acc[key]) acc[key] = []
    acc[key].push(avail)
    return acc
  }, {} as Record<string, Availability[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Availability</h3>
          <p className="text-sm text-muted-foreground">
            Set your availability to help managers create better schedules
          </p>
        </div>
        {!readonly && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Availability
          </Button>
        )}
      </div>

      {/* Availability list */}
      <div className="space-y-6">
        {/* Recurring availability */}
        {groupedAvailabilities.recurring?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurring Availability
            </h4>
            <div className="grid gap-3">
              {groupedAvailabilities.recurring.map((avail) => (
                <AvailabilityCard
                  key={avail.id}
                  availability={avail}
                  onEdit={() => openEditDialog(avail)}
                  onDelete={() => setDeleteConfirmId(avail.id)}
                  readonly={readonly}
                />
              ))}
            </div>
          </div>
        )}

        {/* One-time availability */}
        {groupedAvailabilities.oneTime?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Specific Dates
            </h4>
            <div className="grid gap-3">
              {groupedAvailabilities.oneTime.map((avail) => (
                <AvailabilityCard
                  key={avail.id}
                  availability={avail}
                  onEdit={() => openEditDialog(avail)}
                  onDelete={() => setDeleteConfirmId(avail.id)}
                  readonly={readonly}
                />
              ))}
            </div>
          </div>
        )}

        {availabilities.length === 0 && (
          <Card className="p-8 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="font-medium mb-1">No availability set</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add your availability to help managers schedule you effectively
            </p>
            {!readonly && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Availability
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAvailability ? 'Edit Availability' : 'Add Availability'}
            </DialogTitle>
            <DialogDescription>
              Set your availability for scheduling purposes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Availability Type */}
            <div className="space-y-2">
              <Label>Availability Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as AvailabilityType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getTypeColor(type.value) }}
                        />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {AVAILABILITY_TYPES.find((t) => t.value === formData.type)?.description}
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="allDay">All Day</Label>
              <Switch
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allDay: checked })
                }
              />
            </div>

            {/* Time Range (if not all day) */}
            {!formData.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Recurrence Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring">Recurring</Label>
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked })
                }
              />
            </div>

            {/* Recurrence Options */}
            {formData.isRecurring && (
              <div className="space-y-4 pl-4 border-l-2">
                <div className="space-y-2">
                  <Label>Repeat</Label>
                  <Select
                    value={formData.recurrencePattern || 'WEEKLY'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        recurrencePattern: value as RecurrencePattern,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.filter((o) => o.value !== 'NONE').map(
                        (option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Until (optional)</Label>
                  <Input
                    type="date"
                    value={formData.recurrenceEndDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, recurrenceEndDate: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input
                placeholder="e.g., School, Other job, Personal"
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any additional details..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : editingAvailability ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this availability? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Individual availability card
interface AvailabilityCardProps {
  availability: Availability
  onEdit: () => void
  onDelete: () => void
  readonly?: boolean
}

function AvailabilityCard({
  availability,
  onEdit,
  onDelete,
  readonly = false,
}: AvailabilityCardProps) {
  const getTypeLabel = (type: AvailabilityType) => {
    return AVAILABILITY_TYPES.find((t) => t.value === type)?.label || type
  }

  const getRecurrenceLabel = (pattern?: RecurrencePattern) => {
    return RECURRENCE_OPTIONS.find((o) => o.value === pattern)?.label || ''
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1.5"
            style={{ backgroundColor: AVAILABILITY_COLORS[availability.type] }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{getTypeLabel(availability.type)}</span>
              {availability.isRecurring && (
                <Badge variant="outline" className="text-xs">
                  <Repeat className="h-3 w-3 mr-1" />
                  {getRecurrenceLabel(availability.recurrencePattern)}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {availability.isRecurring ? (
                <span>
                  Starting {formatDate(new Date(availability.date))}
                  {availability.recurrenceEndDate &&
                    ` until ${formatDate(new Date(availability.recurrenceEndDate))}`}
                </span>
              ) : (
                <span>{formatDate(new Date(availability.date))}</span>
              )}
            </div>
            {!availability.allDay && availability.startTime && availability.endTime && (
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {formatTimeDisplay(availability.startTime)} - {formatTimeDisplay(availability.endTime)}
              </div>
            )}
            {availability.reason && (
              <p className="text-sm mt-1">{availability.reason}</p>
            )}
          </div>
        </div>

        {!readonly && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

// Weekly availability grid view
interface WeeklyAvailabilityGridProps {
  employeeId: string
  availabilities: Availability[]
  onTimeSlotClick?: (day: number, time: string) => void
  startHour?: number
  endHour?: number
  readonly?: boolean
}

export function WeeklyAvailabilityGrid({
  employeeId,
  availabilities,
  onTimeSlotClick,
  startHour = 6,
  endHour = 22,
  readonly = false,
}: WeeklyAvailabilityGridProps) {
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)

  // Build availability map
  const availabilityMap = new Map<string, AvailabilityType>()

  availabilities.forEach((avail) => {
    if (avail.allDay) {
      // Mark all hours for that day
      const dayOfWeek = new Date(avail.date).getDay()
      hours.forEach((hour) => {
        const key = `${dayOfWeek}-${hour}`
        availabilityMap.set(key, avail.type)
      })
    } else if (avail.startTime && avail.endTime) {
      const dayOfWeek = new Date(avail.date).getDay()
      const startHr = parseInt(avail.startTime.split(':')[0])
      const endHr = parseInt(avail.endTime.split(':')[0])
      for (let h = startHr; h < endHr; h++) {
        const key = `${dayOfWeek}-${h}`
        availabilityMap.set(key, avail.type)
      }
    }
  })

  return (
    <Card className="p-4 overflow-x-auto">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="p-2 text-left text-sm font-medium text-muted-foreground w-16">
              Time
            </th>
            {DAYS_OF_WEEK.map((day) => (
              <th
                key={day.value}
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="p-1 text-xs text-muted-foreground border-t">
                {formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)}
              </td>
              {DAYS_OF_WEEK.map((day) => {
                const key = `${day.value}-${hour}`
                const availType = availabilityMap.get(key)

                return (
                  <td key={day.value} className="p-0.5 border-t">
                    <button
                      className={cn(
                        'w-full h-6 rounded transition-colors',
                        availType
                          ? ''
                          : 'bg-muted/30 hover:bg-muted/50',
                        !readonly && 'cursor-pointer'
                      )}
                      style={
                        availType
                          ? { backgroundColor: `${AVAILABILITY_COLORS[availType]}40` }
                          : undefined
                      }
                      onClick={() =>
                        !readonly &&
                        onTimeSlotClick?.(day.value, `${hour.toString().padStart(2, '0')}:00`)
                      }
                      disabled={readonly}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        {AVAILABILITY_TYPES.map((type) => (
          <div key={type.value} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: `${AVAILABILITY_COLORS[type.value]}40` }}
            />
            <span>{type.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
