import { NextRequest, NextResponse } from 'next/server'
import { ShiftSwapRequest, SwapRequestStatus } from '@/types/schedule'

// In-memory storage reference
const swapRequests = new Map<string, ShiftSwapRequest>()

// GET /api/swap-requests/[id] - Get a single swap request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const swapRequest = swapRequests.get(id)

    if (!swapRequest) {
      return NextResponse.json(
        { error: 'Swap request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(swapRequest)
  } catch (error) {
    console.error('Error fetching swap request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch swap request' },
      { status: 500 }
    )
  }
}

// PATCH /api/swap-requests/[id] - Update swap request (respond, cancel, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const swapRequest = swapRequests.get(id)

    if (!swapRequest) {
      return NextResponse.json(
        { error: 'Swap request not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, note, managerId } = body as {
      action: 'approve' | 'reject' | 'cancel' | 'manager_approve' | 'manager_reject'
      note?: string
      managerId?: string
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Check if request can still be modified
    if (swapRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot ${action} a ${swapRequest.status.toLowerCase()} request` },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(swapRequest.expiresAt) < new Date()) {
      swapRequests.set(id, {
        ...swapRequest,
        status: 'EXPIRED',
        updatedAt: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'This request has expired' },
        { status: 400 }
      )
    }

    let updatedRequest = { ...swapRequest }

    switch (action) {
      case 'approve':
        // Target employee approves
        if (updatedRequest.requiresManagerApproval) {
          // Move to manager approval stage
          updatedRequest.responseNote = note
          updatedRequest.respondedAt = new Date().toISOString()
          updatedRequest.managerApprovalStatus = 'PENDING'
        } else {
          // Complete the swap/giveaway
          updatedRequest.status = 'APPROVED'
          updatedRequest.responseNote = note
          updatedRequest.respondedAt = new Date().toISOString()
          updatedRequest.completedAt = new Date().toISOString()
        }
        break

      case 'reject':
        updatedRequest.status = 'REJECTED'
        updatedRequest.responseNote = note
        updatedRequest.respondedAt = new Date().toISOString()
        break

      case 'cancel':
        updatedRequest.status = 'CANCELLED'
        break

      case 'manager_approve':
        if (!managerId) {
          return NextResponse.json(
            { error: 'managerId is required for manager actions' },
            { status: 400 }
          )
        }
        updatedRequest.status = 'APPROVED'
        updatedRequest.managerApprovalStatus = 'APPROVED'
        updatedRequest.managerId = managerId
        updatedRequest.managerNote = note
        updatedRequest.completedAt = new Date().toISOString()
        break

      case 'manager_reject':
        if (!managerId) {
          return NextResponse.json(
            { error: 'managerId is required for manager actions' },
            { status: 400 }
          )
        }
        updatedRequest.status = 'REJECTED'
        updatedRequest.managerApprovalStatus = 'REJECTED'
        updatedRequest.managerId = managerId
        updatedRequest.managerNote = note
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    updatedRequest.updatedAt = new Date().toISOString()
    swapRequests.set(id, updatedRequest)

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating swap request:', error)
    return NextResponse.json(
      { error: 'Failed to update swap request' },
      { status: 500 }
    )
  }
}

// DELETE /api/swap-requests/[id] - Delete a swap request (only if pending and by requester)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const swapRequest = swapRequests.get(id)

    if (!swapRequest) {
      return NextResponse.json(
        { error: 'Swap request not found' },
        { status: 404 }
      )
    }

    // Only allow deleting pending requests
    if (swapRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete pending requests' },
        { status: 400 }
      )
    }

    swapRequests.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting swap request:', error)
    return NextResponse.json(
      { error: 'Failed to delete swap request' },
      { status: 500 }
    )
  }
}
