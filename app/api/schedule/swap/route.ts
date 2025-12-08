import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { createShiftSwapRequestSchema } from '@/types/schedule'
import { SwapStatus, SwapType, ScheduleStatus } from '@prisma/client'

// GET /api/schedule/swap - Get swap requests
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as SwapStatus | null
    const myRequests = searchParams.get('myRequests') === 'true'
    const pendingForMe = searchParams.get('pendingForMe') === 'true'

    const where: any = {
      facilityId: user.facilityId,
    }

    if (status) where.status = status

    // Check view permissions
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')

    if (myRequests) {
      where.requesterId = user.id
    } else if (pendingForMe) {
      where.AND = [
        { targetUserId: user.id },
        { status: SwapStatus.PENDING_PEER },
      ]
    } else if (!canViewAll) {
      // Can only see own requests or requests targeting them
      where.OR = [
        { requesterId: user.id },
        { targetUserId: user.id },
      ]
    }

    const requests = await prisma.shiftSwapRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        originalShift: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            shift: true,
          },
        },
        targetShift: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            shift: true,
          },
        },
        managerApprovedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching swap requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule/swap - Create swap request
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const result = createShiftSwapRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const data = result.data

    // Verify the original shift exists and belongs to the user
    const originalShift = await prisma.scheduleEntry.findUnique({
      where: { id: data.originalShiftId },
    })

    if (!originalShift) {
      return NextResponse.json({ error: 'Original shift not found' }, { status: 404 })
    }

    if (originalShift.userId !== user.id) {
      return NextResponse.json({
        error: 'You can only request swaps for your own shifts',
      }, { status: 403 })
    }

    if (originalShift.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if the shift is in the future
    if (originalShift.date < new Date()) {
      return NextResponse.json({
        error: 'Cannot swap past shifts',
      }, { status: 400 })
    }

    // Validate based on swap type
    if (data.swapType === SwapType.SWAP) {
      if (!data.targetShiftId) {
        return NextResponse.json({
          error: 'Target shift is required for swap requests',
        }, { status: 400 })
      }

      const targetShift = await prisma.scheduleEntry.findUnique({
        where: { id: data.targetShiftId },
      })

      if (!targetShift) {
        return NextResponse.json({ error: 'Target shift not found' }, { status: 404 })
      }

      if (targetShift.userId === user.id) {
        return NextResponse.json({
          error: 'Cannot swap with your own shift',
        }, { status: 400 })
      }
    } else if (data.swapType === SwapType.GIVEAWAY) {
      if (!data.targetUserId && !data.targetShiftId) {
        // Open giveaway - anyone can pick up
      }
    }

    // Check for existing pending requests for this shift
    const existingRequest = await prisma.shiftSwapRequest.findFirst({
      where: {
        originalShiftId: data.originalShiftId,
        status: {
          in: [SwapStatus.PENDING_PEER, SwapStatus.PENDING_MANAGER],
        },
      },
    })

    if (existingRequest) {
      return NextResponse.json({
        error: 'There is already a pending swap request for this shift',
      }, { status: 400 })
    }

    // Determine initial status
    let initialStatus = SwapStatus.PENDING_PEER
    if (data.swapType === SwapType.GIVEAWAY && !data.targetUserId) {
      // Open giveaway goes directly to pending manager
      initialStatus = SwapStatus.PENDING_MANAGER
    } else if (data.swapType === SwapType.PICKUP) {
      // Pickup requests also go to manager
      initialStatus = SwapStatus.PENDING_MANAGER
    }

    const swapRequest = await prisma.shiftSwapRequest.create({
      data: {
        requesterId: user.id,
        originalShiftId: data.originalShiftId,
        targetShiftId: data.targetShiftId || null,
        targetUserId: data.targetUserId || null,
        swapType: data.swapType,
        reason: data.reason || null,
        status: initialStatus,
        facilityId: user.facilityId,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        originalShift: {
          include: { shift: true },
        },
        targetShift: {
          include: { shift: true },
        },
        targetUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create notification for target user or managers
    if (data.targetUserId && initialStatus === SwapStatus.PENDING_PEER) {
      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          recipientUserId: data.targetUserId,
          type: 'SWAP_REQUESTED',
          title: 'Shift Swap Request',
          message: `${user.firstName} ${user.lastName} has requested to swap shifts with you.`,
          relatedEntityType: 'ShiftSwapRequest',
          relatedEntityId: swapRequest.id,
        },
      })
    } else if (initialStatus === SwapStatus.PENDING_MANAGER) {
      // Notify managers
      const managerRoles = await prisma.role.findMany({
        where: {
          OR: [
            { name: { contains: 'Manager' } },
            { name: { contains: 'Supervisor' } },
          ],
        },
      })

      for (const role of managerRoles) {
        await prisma.notification.create({
          data: {
            facilityId: user.facilityId,
            recipientRoleId: role.id,
            type: 'SWAP_REQUESTED',
            title: 'Shift Swap Request Pending Approval',
            message: `${user.firstName} ${user.lastName} has submitted a ${data.swapType.toLowerCase()} request that needs approval.`,
            relatedEntityType: 'ShiftSwapRequest',
            relatedEntityId: swapRequest.id,
          },
        })
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SWAP_REQUEST',
        entityType: 'ShiftSwapRequest',
        entityId: swapRequest.id,
        newValue: swapRequest,
      },
    })

    return NextResponse.json({ request: swapRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating swap request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
