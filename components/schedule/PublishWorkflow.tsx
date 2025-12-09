'use client'

import { useState, useMemo } from 'react'
import {
  Send,
  Check,
  AlertCircle,
  AlertTriangle,
  Users,
  Clock,
  Calendar,
  Mail,
  MessageSquare,
  Bell,
  Loader2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { Schedule, Shift, ScheduleStats } from '@/types/schedule'
import { formatDate, calculateScheduleStats } from '@/lib/schedule-utils'

interface PublishWorkflowProps {
  schedule: Schedule
  shifts: Shift[]
  onPublish: (options: PublishOptions) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

interface PublishOptions {
  notifyEmployees: boolean
  notifyManagers: boolean
  sendEmail: boolean
  sendPush: boolean
  sendSMS: boolean
  customMessage?: string
  publishAt?: string // ISO date for scheduled publish
}

interface ValidationIssue {
  type: 'error' | 'warning'
  message: string
  shiftId?: string
  category: 'staffing' | 'conflicts' | 'availability' | 'other'
}

export function PublishWorkflow({
  schedule,
  shifts,
  onPublish,
  onCancel,
  isOpen,
}: PublishWorkflowProps) {
  const [step, setStep] = useState<'review' | 'options' | 'confirm' | 'publishing' | 'complete'>(
    'review'
  )
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)

  const [options, setOptions] = useState<PublishOptions>({
    notifyEmployees: true,
    notifyManagers: true,
    sendEmail: true,
    sendPush: true,
    sendSMS: false,
    customMessage: '',
  })

  // Validation
  const validation = useMemo(() => {
    const issues: ValidationIssue[] = []

    // Check for open shifts
    const openShifts = shifts.filter((s) => s.isOpen || s.status === 'OPEN')
    if (openShifts.length > 0) {
      issues.push({
        type: 'warning',
        message: `${openShifts.length} shift${openShifts.length > 1 ? 's' : ''} still need${openShifts.length === 1 ? 's' : ''} staff coverage`,
        category: 'staffing',
      })
    }

    // Check for understaffed shifts
    const understaffed = shifts.filter(
      (s) => s.assignedEmployees.length < s.minStaff && !s.isOpen
    )
    if (understaffed.length > 0) {
      issues.push({
        type: 'error',
        message: `${understaffed.length} shift${understaffed.length > 1 ? 's are' : ' is'} understaffed`,
        category: 'staffing',
      })
    }

    // Check for unconfirmed assignments
    const unconfirmed = shifts.flatMap((s) =>
      s.assignedEmployees.filter((a) => a.status === 'ASSIGNED')
    )
    if (unconfirmed.length > 0) {
      issues.push({
        type: 'warning',
        message: `${unconfirmed.length} assignment${unconfirmed.length > 1 ? 's' : ''} not yet confirmed by employees`,
        category: 'staffing',
      })
    }

    // Check for shifts without required roles
    const missingRoles = shifts.filter((s) => {
      if (!s.requiredRoles.length) return false
      const assignedRoles = s.assignedEmployees.map((a) => a.employee.role)
      return !s.requiredRoles.every((role) => assignedRoles.includes(role))
    })
    if (missingRoles.length > 0) {
      issues.push({
        type: 'warning',
        message: `${missingRoles.length} shift${missingRoles.length > 1 ? 's' : ''} missing required role coverage`,
        category: 'staffing',
      })
    }

    const errors = issues.filter((i) => i.type === 'error')
    const warnings = issues.filter((i) => i.type === 'warning')

    return {
      issues,
      errors,
      warnings,
      canPublish: errors.length === 0,
      isValid: issues.length === 0,
    }
  }, [shifts])

  // Stats
  const stats = useMemo(() => calculateScheduleStats(shifts), [shifts])

  const handlePublish = async () => {
    setStep('publishing')
    setIsPublishing(true)

    // Simulate publish progress
    const progressSteps = [
      { progress: 20, delay: 500 },
      { progress: 40, delay: 800 },
      { progress: 60, delay: 600 },
      { progress: 80, delay: 700 },
      { progress: 100, delay: 500 },
    ]

    for (const { progress, delay } of progressSteps) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      setPublishProgress(progress)
    }

    try {
      await onPublish(options)
      setStep('complete')
    } catch (error) {
      console.error('Publish failed:', error)
      // Handle error
    } finally {
      setIsPublishing(false)
    }
  }

  const handleClose = () => {
    setStep('review')
    setPublishProgress(0)
    onCancel()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'review' && 'Review Schedule'}
            {step === 'options' && 'Notification Options'}
            {step === 'confirm' && 'Confirm Publish'}
            {step === 'publishing' && 'Publishing Schedule...'}
            {step === 'complete' && 'Schedule Published!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'review' && 'Review the schedule before publishing'}
            {step === 'options' && 'Choose how to notify employees'}
            {step === 'confirm' && 'Review and confirm your publish settings'}
            {step === 'publishing' && 'Please wait while we publish your schedule'}
            {step === 'complete' && 'Your schedule has been published successfully'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              {/* Schedule Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{schedule.name}</CardTitle>
                  <CardDescription>
                    {formatDate(new Date(schedule.startDate))} -{' '}
                    {formatDate(new Date(schedule.endDate))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Shifts</p>
                      <p className="text-lg font-semibold">{shifts.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Coverage</p>
                      <p className="text-lg font-semibold">
                        {stats.coveragePercentage.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Hours</p>
                      <p className="text-lg font-semibold">{stats.totalHours.toFixed(0)}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Issues */}
              {!validation.isValid && (
                <div className="space-y-3">
                  {validation.errors.length > 0 && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-red-800 dark:text-red-200">
                          <XCircle className="h-5 w-5" />
                          {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {validation.errors.map((issue, i) => (
                            <li
                              key={i}
                              className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2"
                            >
                              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {validation.warnings.length > 0 && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                          <AlertTriangle className="h-5 w-5" />
                          {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {validation.warnings.map((issue, i) => (
                            <li
                              key={i}
                              className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2"
                            >
                              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                              {issue.message}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {validation.isValid && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Ready to Publish
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          No issues found with this schedule
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Staff Summary */}
              <Accordion type="single" collapsible>
                <AccordionItem value="staff">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Staff Summary
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {stats.employeeHours.slice(0, 5).map((emp) => (
                        <div
                          key={emp.employeeId}
                          className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                        >
                          <span>{emp.employeeName}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              {emp.shifts} shift{emp.shifts !== 1 ? 's' : ''}
                            </span>
                            <span className="font-medium">{emp.hours.toFixed(1)}h</span>
                            {emp.overtime > 0 && (
                              <Badge variant="outline" className="text-xs">
                                +{emp.overtime.toFixed(1)}h OT
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Step 2: Notification Options */}
          {step === 'options' && (
            <div className="space-y-6">
              {/* Who to notify */}
              <div className="space-y-4">
                <Label className="text-base">Who should be notified?</Label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Employees</p>
                        <p className="text-sm text-muted-foreground">
                          All staff with assigned shifts
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={options.notifyEmployees}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, notifyEmployees: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Managers</p>
                        <p className="text-sm text-muted-foreground">
                          All facility managers
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={options.notifyManagers}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, notifyManagers: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* How to notify */}
              <div className="space-y-4">
                <Label className="text-base">Notification methods</Label>

                <div className="grid grid-cols-3 gap-3">
                  <label
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors',
                      options.sendEmail
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/25'
                    )}
                  >
                    <Checkbox
                      checked={options.sendEmail}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, sendEmail: !!checked })
                      }
                      className="sr-only"
                    />
                    <Mail className="h-6 w-6" />
                    <span className="text-sm font-medium">Email</span>
                  </label>

                  <label
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors',
                      options.sendPush
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/25'
                    )}
                  >
                    <Checkbox
                      checked={options.sendPush}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, sendPush: !!checked })
                      }
                      className="sr-only"
                    />
                    <Bell className="h-6 w-6" />
                    <span className="text-sm font-medium">Push</span>
                  </label>

                  <label
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors',
                      options.sendSMS
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/25'
                    )}
                  >
                    <Checkbox
                      checked={options.sendSMS}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, sendSMS: !!checked })
                      }
                      className="sr-only"
                    />
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm font-medium">SMS</span>
                  </label>
                </div>
              </div>

              <Separator />

              {/* Custom message */}
              <div className="space-y-2">
                <Label htmlFor="customMessage">Custom message (optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a personal note to include with the schedule notification..."
                  value={options.customMessage}
                  onChange={(e) =>
                    setOptions({ ...options, customMessage: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{schedule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(new Date(schedule.startDate))} -{' '}
                          {formatDate(new Date(schedule.endDate))}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shifts</span>
                        <span>{shifts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Hours</span>
                        <span>{stats.totalHours.toFixed(0)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coverage</span>
                        <span>{stats.coveragePercentage.toFixed(0)}%</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Notifications will be sent via:</p>
                      <div className="flex flex-wrap gap-2">
                        {options.sendEmail && (
                          <Badge variant="outline">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {options.sendPush && (
                          <Badge variant="outline">
                            <Bell className="h-3 w-3 mr-1" />
                            Push
                          </Badge>
                        )}
                        {options.sendSMS && (
                          <Badge variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            SMS
                          </Badge>
                        )}
                      </div>
                    </div>

                    {options.customMessage && (
                      <>
                        <Separator />
                        <div className="text-sm">
                          <p className="font-medium mb-1">Custom message:</p>
                          <p className="text-muted-foreground italic">
                            "{options.customMessage}"
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {!validation.canPublish && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle className="h-5 w-5 mt-0.5" />
                      <p className="text-sm">
                        Cannot publish due to unresolved errors. Please go back and fix the issues.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 4: Publishing */}
          {step === 'publishing' && (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">Publishing your schedule...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sending notifications to staff
                </p>
              </div>
              <div className="max-w-xs mx-auto">
                <Progress value={publishProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{publishProgress}%</p>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-lg">Schedule Published!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All staff have been notified of their shifts
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <p>
                  {options.sendEmail && (
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" /> Email notifications sent
                    </span>
                  )}
                </p>
                <p>
                  {options.sendPush && (
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" /> Push notifications sent
                    </span>
                  )}
                </p>
                <p>
                  {options.sendSMS && (
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4 text-green-500" /> SMS notifications sent
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('options')}>
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === 'options' && (
            <>
              <Button variant="outline" onClick={() => setStep('review')}>
                Back
              </Button>
              <Button onClick={() => setStep('confirm')}>
                Review & Publish
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('options')}>
                Back
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!validation.canPublish}
              >
                <Send className="h-4 w-4 mr-2" />
                Publish Schedule
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
