'use client'

import { useState, useMemo } from 'react'
import {
  ArrowRightLeft,
  Gift,
  Hand,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Shift,
  ShiftSwapRequest,
  CreateSwapRequestInput,
  SwapRequestStatus,
} from '@/types/schedule'
import { formatDate, formatTime, calculateDuration } from '@/lib/schedule-utils'

// Types for swap request management
type SwapType = 'SWAP' | 'GIVEAWAY' | 'PICKUP'

interface Employee {
  id: string
  firstName: string
  lastName: string
  avatar?: string
  role: string
}

interface ShiftSwapDialogProps {
  isOpen: boolean
  onClose: () => void
  myShift: Shift
  availableEmployees: Employee[]
  availableShifts: Shift[] // Other employees' shifts available for swap
  onSubmit: (request: CreateSwapRequestInput) => Promise<void>
  isLoading?: boolean
}

const SWAP_TYPES = [
  {
    value: 'SWAP' as SwapType,
    label: 'Swap Shifts',
    description: 'Trade shifts with another employee',
    icon: ArrowRightLeft,
  },
  {
    value: 'GIVEAWAY' as SwapType,
    label: 'Give Away',
    description: 'Offer your shift to someone else',
    icon: Gift,
  },
  {
    value: 'PICKUP' as SwapType,
    label: 'Post as Open',
    description: 'Make available for anyone to claim',
    icon: Hand,
  },
]

export function ShiftSwapDialog({
  isOpen,
  onClose,
  myShift,
  availableEmployees,
  availableShifts,
  onSubmit,
  isLoading = false,
}: ShiftSwapDialogProps) {
  const [swapType, setSwapType] = useState<SwapType>('SWAP')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [selectedShiftId, setSelectedShiftId] = useState<string>('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter shifts by selected employee
  const employeeShifts = useMemo(() => {
    if (!selectedEmployeeId) return []
    return availableShifts.filter((shift) =>
      shift.assignedEmployees.some((a) => a.employeeId === selectedEmployeeId)
    )
  }, [selectedEmployeeId, availableShifts])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const request: CreateSwapRequestInput = {
        requesterShiftId: myShift.id,
        type: swapType,
        reason: reason || undefined,
      }

      if (swapType === 'SWAP' || swapType === 'GIVEAWAY') {
        request.targetEmployeeId = selectedEmployeeId || undefined
        if (swapType === 'SWAP' && selectedShiftId) {
          request.targetShiftId = selectedShiftId
        }
      }

      await onSubmit(request)
      handleClose()
    } catch (error) {
      console.error('Failed to submit swap request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSwapType('SWAP')
    setSelectedEmployeeId('')
    setSelectedShiftId('')
    setReason('')
    onClose()
  }

  const canSubmit = () => {
    if (swapType === 'PICKUP') return true
    if (swapType === 'GIVEAWAY') return !!selectedEmployeeId
    if (swapType === 'SWAP') return !!selectedEmployeeId && !!selectedShiftId
    return false
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Request Shift Change</DialogTitle>
          <DialogDescription>
            Request to swap, give away, or post your shift as open
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Your Shift Info */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Shift
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShiftPreview shift={myShift} />
            </CardContent>
          </Card>

          {/* Swap Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to do?</Label>
            <RadioGroup
              value={swapType}
              onValueChange={(value) => {
                setSwapType(value as SwapType)
                setSelectedEmployeeId('')
                setSelectedShiftId('')
              }}
              className="grid grid-cols-3 gap-3"
            >
              {SWAP_TYPES.map((type) => (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors',
                    swapType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/25'
                  )}
                >
                  <RadioGroupItem
                    value={type.value}
                    id={type.value}
                    className="sr-only"
                  />
                  <type.icon className="h-6 w-6" />
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {type.description}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Target Employee Selection */}
          {(swapType === 'SWAP' || swapType === 'GIVEAWAY') && (
            <div className="space-y-3">
              <Label>Select Employee</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={(value) => {
                  setSelectedEmployeeId(value)
                  setSelectedShiftId('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={employee.avatar} />
                          <AvatarFallback>
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {employee.firstName} {employee.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {employee.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Target Shift Selection (for SWAP only) */}
          {swapType === 'SWAP' && selectedEmployeeId && (
            <div className="space-y-3">
              <Label>Select their shift to swap with</Label>
              {employeeShifts.length > 0 ? (
                <ScrollArea className="h-48 border rounded-lg p-2">
                  <div className="space-y-2">
                    {employeeShifts.map((shift) => (
                      <button
                        key={shift.id}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-colors',
                          selectedShiftId === shift.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => setSelectedShiftId(shift.id)}
                      >
                        <ShiftPreview shift={shift} compact />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <Card className="p-4 text-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    This employee has no available shifts to swap
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Explain why you need this shift change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Summary */}
          {canSubmit() && (
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Request Summary
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      {swapType === 'PICKUP' &&
                        'Your shift will be posted as open for anyone to claim.'}
                      {swapType === 'GIVEAWAY' &&
                        `You're offering your shift to the selected employee.`}
                      {swapType === 'SWAP' &&
                        `You're requesting to swap shifts with the selected employee.`}
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 mt-1 text-xs">
                      {swapType !== 'PICKUP'
                        ? 'The employee will need to accept your request.'
                        : 'A manager may need to approve the final assignment.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Shift preview component
interface ShiftPreviewProps {
  shift: Shift
  compact?: boolean
}

function ShiftPreview({ shift, compact = false }: ShiftPreviewProps) {
  const duration = calculateDuration(shift.startTime, shift.endTime, shift.breakDuration)

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{shift.title}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date(shift.date))}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>
            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
          </p>
          <p className="text-muted-foreground">{duration.toFixed(1)}h</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4">
      <div
        className="w-2 h-full min-h-[60px] rounded-full"
        style={{ backgroundColor: shift.color }}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{shift.title}</h4>
          <Badge variant="outline">{shift.shiftType}</Badge>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(new Date(shift.date))}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
          </span>
          <span>{duration.toFixed(1)} hours</span>
        </div>
      </div>
    </div>
  )
}

// Swap request list component
interface SwapRequestListProps {
  requests: ShiftSwapRequest[]
  currentUserId: string
  onRespond?: (requestId: string, action: 'APPROVE' | 'REJECT', note?: string) => Promise<void>
  onCancel?: (requestId: string) => Promise<void>
  isLoading?: boolean
}

const STATUS_CONFIG: Record<
  SwapRequestStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: Clock },
}

export function SwapRequestList({
  requests,
  currentUserId,
  onRespond,
  onCancel,
  isLoading = false,
}: SwapRequestListProps) {
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState('')

  const incomingRequests = requests.filter(
    (r) => r.targetEmployeeId === currentUserId && r.status === 'PENDING'
  )
  const outgoingRequests = requests.filter((r) => r.requesterId === currentUserId)
  const historyRequests = requests.filter(
    (r) =>
      (r.targetEmployeeId === currentUserId || r.requesterId === currentUserId) &&
      r.status !== 'PENDING'
  )

  const handleRespond = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    if (!onRespond) return
    try {
      await onRespond(requestId, action, responseNote || undefined)
      setRespondingTo(null)
      setResponseNote('')
    } catch (error) {
      console.error('Failed to respond:', error)
    }
  }

  return (
    <Tabs defaultValue="incoming" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="incoming" className="relative">
          Incoming
          {incomingRequests.length > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {incomingRequests.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="incoming" className="mt-4">
        {incomingRequests.length > 0 ? (
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <SwapRequestCard
                key={request.id}
                request={request}
                currentUserId={currentUserId}
                onRespond={onRespond}
                isResponding={respondingTo === request.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No incoming swap requests" />
        )}
      </TabsContent>

      <TabsContent value="outgoing" className="mt-4">
        {outgoingRequests.length > 0 ? (
          <div className="space-y-4">
            {outgoingRequests.map((request) => (
              <SwapRequestCard
                key={request.id}
                request={request}
                currentUserId={currentUserId}
                onCancel={onCancel}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No outgoing swap requests" />
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        {historyRequests.length > 0 ? (
          <div className="space-y-4">
            {historyRequests.map((request) => (
              <SwapRequestCard
                key={request.id}
                request={request}
                currentUserId={currentUserId}
                showStatus
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No swap request history" />
        )}
      </TabsContent>
    </Tabs>
  )
}

// Individual swap request card
interface SwapRequestCardProps {
  request: ShiftSwapRequest
  currentUserId: string
  onRespond?: (requestId: string, action: 'APPROVE' | 'REJECT', note?: string) => Promise<void>
  onCancel?: (requestId: string) => Promise<void>
  isResponding?: boolean
  showStatus?: boolean
}

function SwapRequestCard({
  request,
  currentUserId,
  onRespond,
  onCancel,
  isResponding = false,
  showStatus = false,
}: SwapRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [note, setNote] = useState('')

  const isIncoming = request.targetEmployeeId === currentUserId
  const statusConfig = STATUS_CONFIG[request.status]
  const StatusIcon = statusConfig.icon

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!onRespond) return
    setIsProcessing(true)
    try {
      await onRespond(request.id, action, note || undefined)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!onCancel) return
    setIsProcessing(true)
    try {
      await onCancel(request.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const getTypeIcon = () => {
    switch (request.type) {
      case 'SWAP':
        return ArrowRightLeft
      case 'GIVEAWAY':
        return Gift
      case 'PICKUP':
        return Hand
      default:
        return ArrowRightLeft
    }
  }

  const TypeIcon = getTypeIcon()

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {request.type === 'SWAP' && 'Shift Swap Request'}
                  {request.type === 'GIVEAWAY' && 'Shift Giveaway'}
                  {request.type === 'PICKUP' && 'Open Shift'}
                </p>
                {(showStatus || request.status !== 'PENDING') && (
                  <Badge className={cn('text-xs', statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={request.requester.avatar} />
                  <AvatarFallback className="text-xs">
                    {request.requester.firstName[0]}
                    {request.requester.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span>
                  {request.requester.firstName} {request.requester.lastName}
                </span>
                {request.targetEmployee && (
                  <>
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>
                      {request.targetEmployee.firstName} {request.targetEmployee.lastName}
                    </span>
                  </>
                )}
              </div>

              {/* Shifts involved */}
              <div className="mt-3 space-y-2">
                <div className="p-2 rounded bg-muted/50 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isIncoming ? 'Their shift:' : 'Your shift:'}
                  </p>
                  <ShiftPreview shift={request.requesterShift} compact />
                </div>

                {request.targetShift && (
                  <div className="p-2 rounded bg-muted/50 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">
                      {isIncoming ? 'Your shift:' : 'Their shift:'}
                    </p>
                    <ShiftPreview shift={request.targetShift} compact />
                  </div>
                )}
              </div>

              {request.reason && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">Reason:</span> {request.reason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {isIncoming && request.status === 'PENDING' && onRespond && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-3">
              <Textarea
                placeholder="Add a note (optional)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAction('REJECT')}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleAction('APPROVE')}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isIncoming && request.status === 'PENDING' && onCancel && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel Request
            </Button>
          </div>
        )}

        {request.responseNote && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Response:</span> {request.responseNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-8 text-center">
      <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </Card>
  )
}
