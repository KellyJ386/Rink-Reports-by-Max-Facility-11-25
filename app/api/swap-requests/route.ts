import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  ShiftSwapRequest,
  CreateSwapRequestInput,
  SwapRequestStatus,
  Shift,
} from '@/types/schedule'

// In-memory storage for demo
const swapRequests = new Map<string, ShiftSwapRequest>()

// Sample employees
const sampleEmployees = [
  { id: 'emp-1', firstName: 'John', lastName: 'Smith', avatar: undefined },
  { id: 'emp-2', firstName: 'Sarah', lastName: 'Johnson', avatar: undefined },
  { id: 'emp-3', firstName: 'Mike', lastName: 'Williams', avatar: undefined },
  { id: 'emp-4', firstName: 'Emily', lastName: 'Brown', avatar: undefined },
  { id: 'emp-5', firstName: 'David', lastName: 'Lee', avatar: undefined },
]

// Sample shifts for demo (simplified)
function getSampleShift(id: string, employeeId: string): Shift {
  const date = new Date()
  date.setDate(date.getDate() + Math.floor(Math.random() * 7))

  return {
    id,
    scheduleId: 'schedule-1',
    facilityId: 'facility-1',
    date: date.toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    breakDuration: 30,
    title: 'Regular Shift',
    color: '#3B82F6',
    shiftType: 'REGULAR',
    status: 'FILLED',
    isOpen: false,
    minStaff: 1,
    maxStaff: 2,
    requiredRoles: ['Ice Technician'],
    assignedEmployees: [
      {
        id: uuidv4(),
        shiftId: id,
        employeeId,
        employee: {
          ...sampleEmployees.find((e) => e.id === employeeId)!,
          email: '',
          role: 'Ice Technician',
        },
        status: 'CONFIRMED',
        assignedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
  }
}

// Initialize sample data
function initSampleData() {
  if (swapRequests.size === 0) {
    // Pending swap request
    const pendingRequest: ShiftSwapRequest = {
      id: 'swap-1',
      facilityId: 'facility-1',
      requesterId: 'emp-1',
      requester: sampleEmployees[0],
      requesterShiftId: 'shift-pending-1',
      requesterShift: getSampleShift('shift-pending-1', 'emp-1'),
      targetEmployeeId: 'emp-3',
      targetEmployee: sampleEmployees[2],
      targetShiftId: 'shift-pending-2',
      targetShift: getSampleShift('shift-pending-2', 'emp-3'),
      type: 'SWAP',
      status: 'PENDING',
      reason: 'I have a family event on that day',
      requiresManagerApproval: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
    swapRequests.set(pendingRequest.id, pendingRequest)

    // Approved giveaway
    const approvedGiveaway: ShiftSwapRequest = {
      id: 'swap-2',
      facilityId: 'facility-1',
      requesterId: 'emp-2',
      requester: sampleEmployees[1],
      requesterShiftId: 'shift-approved-1',
      requesterShift: getSampleShift('shift-approved-1', 'emp-2'),
      targetEmployeeId: 'emp-4',
      targetEmployee: sampleEmployees[3],
      type: 'GIVEAWAY',
      status: 'APPROVED',
      reason: 'Vacation plans',
      responseNote: 'Happy to help!',
      requiresManagerApproval: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
    swapRequests.set(approvedGiveaway.id, approvedGiveaway)
  }
}

// GET /api/swap-requests - List swap requests
export async function GET(request: NextRequest) {
  try {
    initSampleData()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status') as SwapRequestStatus | null
    const type = searchParams.get('type')
    const role = searchParams.get('role') // 'requester' | 'target' | 'all'

    let results = Array.from(swapRequests.values())

    // Filter by employee involvement
    if (employeeId) {
      if (role === 'requester') {
        results = results.filter((r) => r.requesterId === employeeId)
      } else if (role === 'target') {
        results = results.filter((r) => r.targetEmployeeId === employeeId)
      } else {
        results = results.filter(
          (r) => r.requesterId === employeeId || r.targetEmployeeId === employeeId
        )
      }
    }

    if (status) {
      results = results.filter((r) => r.status === status)
    }

    if (type) {
      results = results.filter((r) => r.type === type)
    }

    // Sort by created date descending
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      swapRequests: results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error fetching swap requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch swap requests' },
      { status: 500 }
    )
  }
}

// POST /api/swap-requests - Create a new swap request
export async function POST(request: NextRequest) {
  try {
    initSampleData()

    const body: CreateSwapRequestInput & { requesterId?: string } = await request.json()

    // Validate required fields
    if (!body.requesterShiftId || !body.type) {
      return NextResponse.json(
        { error: 'requesterShiftId and type are required' },
        { status: 400 }
      )
    }

    // Validate swap-specific requirements
    if (body.type === 'SWAP' && !body.targetShiftId) {
      return NextResponse.json(
        { error: 'targetShiftId is required for SWAP type' },
        { status: 400 }
      )
    }

    if ((body.type === 'SWAP' || body.type === 'GIVEAWAY') && !body.targetEmployeeId) {
      return NextResponse.json(
        { error: 'targetEmployeeId is required for SWAP and GIVEAWAY types' },
        { status: 400 }
      )
    }

    const requesterId = body.requesterId || 'emp-1'
    const requester = sampleEmployees.find((e) => e.id === requesterId)
    const targetEmployee = body.targetEmployeeId
      ? sampleEmployees.find((e) => e.id === body.targetEmployeeId)
      : undefined

    const newRequest: ShiftSwapRequest = {
      id: uuidv4(),
      facilityId: 'facility-1',
      requesterId,
      requester: requester || { id: requesterId, firstName: 'Unknown', lastName: 'User' },
      requesterShiftId: body.requesterShiftId,
      requesterShift: getSampleShift(body.requesterShiftId, requesterId),
      targetEmployeeId: body.targetEmployeeId,
      targetEmployee,
      targetShiftId: body.targetShiftId,
      targetShift: body.targetShiftId
        ? getSampleShift(body.targetShiftId, body.targetEmployeeId || requesterId)
        : undefined,
      type: body.type,
      status: 'PENDING',
      reason: body.reason,
      requiresManagerApproval: body.type === 'SWAP', // Swaps typically need approval
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    }

    swapRequests.set(newRequest.id, newRequest)

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating swap request:', error)
    return NextResponse.json(
      { error: 'Failed to create swap request' },
      { status: 500 }
    )
  }
}
