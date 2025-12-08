import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { respondToSwapRequestSchema, managerReviewSwapRequestSchema } from '@/types/schedule'
import { SwapStatus, SwapType, ScheduleStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/schedule/swap/[id] - Get single swap request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
    })

    if (!swapRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (swapRequest.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check permissions
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    const isInvolved = swapRequest.requesterId === user.id || swapRequest.targetUserId === user.id

    if (!canViewAll && !isInvolved) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ request: swapRequest })
  } catch (error) {
    console.error('Error fetching swap request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/schedule/swap/[id] - Respond to or review swap request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id },
      include: {
        originalShift: true,
        targetShift: true,
        requester: true,
        targetUser: true,
      },
    })

    if (!swapRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (swapRequest.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Handle peer response
    if (body.peerResponse !== undefined) {
      if (swapRequest.targetUserId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (swapRequest.status !== SwapStatus.PENDING_PEER) {
        return NextResponse.json({
          error: 'Request is not pending peer response',
        }, { status: 400 })
      }

      const result = respondToSwapRequestSchema.safeParse(body.peerResponse)
      if (!result.success) {
        return NextResponse.json({ error: result.error.errors }, { status: 400 })
      }

      const { accept, notes } = result.data

      if (accept) {
        // Move to manager approval
        const updated = await prisma.shiftSwapRequest.update({
          where: { id },
          data: {
            status: SwapStatus.PENDING_MANAGER,
            peerApprovedAt: new Date(),
          },
        })

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
              type: 'SWAP_PEER_RESPONSE',
              title: 'Shift Swap Awaiting Approval',
              message: `A shift swap between ${swapRequest.requester.firstName} and ${user.firstName} is awaiting manager approval.`,
              relatedEntityType: 'ShiftSwapRequest',
              relatedEntityId: id,
            },
          })
        }

        // Notify requester
        await prisma.notification.create({
          data: {
            facilityId: user.facilityId,
            recipientUserId: swapRequest.requesterId,
            type: 'SWAP_PEER_RESPONSE',
            title: 'Swap Request Accepted',
            message: `${user.firstName} has accepted your swap request. Awaiting manager approval.`,
            relatedEntityType: 'ShiftSwapRequest',
            relatedEntityId: id,
          },
        })

        return NextResponse.json({ request: updated })
      } else {
        // Peer declined
        const updated = await prisma.shiftSwapRequest.update({
          where: { id },
          data: {
            status: SwapStatus.DENIED_PEER,
            managerNotes: notes || null,
          },
        })

        // Notify requester
        await prisma.notification.create({
          data: {
            facilityId: user.facilityId,
            recipientUserId: swapRequest.requesterId,
            type: 'SWAP_DENIED',
            title: 'Swap Request Declined',
            message: `${user.firstName} has declined your swap request.${notes ? ` Reason: ${notes}` : ''}`,
            relatedEntityType: 'ShiftSwapRequest',
            relatedEntityId: id,
          },
        })

        return NextResponse.json({ request: updated })
      }
    }

    // Handle manager review
    if (body.managerReview !== undefined) {
      if (!canUserAccess(user, 'schedule', 'approve')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (swapRequest.status !== SwapStatus.PENDING_MANAGER) {
        return NextResponse.json({
          error: 'Request is not pending manager approval',
        }, { status: 400 })
      }

      const result = managerReviewSwapRequestSchema.safeParse(body.managerReview)
      if (!result.success) {
        return NextResponse.json({ error: result.error.errors }, { status: 400 })
      }

      const { approve, notes } = result.data

      if (approve) {
        // Execute the swap
        await prisma.$transaction(async (tx) => {
          // Update the swap request
          await tx.shiftSwapRequest.update({
            where: { id },
            data: {
              status: SwapStatus.APPROVED,
              managerApprovedById: user.id,
              managerApprovedAt: new Date(),
              managerNotes: notes || null,
            },
          })

          if (swapRequest.swapType === SwapType.SWAP && swapRequest.targetShift) {
            // Swap the users between the two shifts
            const originalUserId = swapRequest.originalShift.userId
            const targetUserId = swapRequest.targetShift.userId

            await tx.scheduleEntry.update({
              where: { id: swapRequest.originalShiftId },
              data: { userId: targetUserId },
            })

            await tx.scheduleEntry.update({
              where: { id: swapRequest.targetShiftId! },
              data: { userId: originalUserId },
            })
          } else if (swapRequest.swapType === SwapType.GIVEAWAY) {
            if (swapRequest.targetUserId) {
              // Assign to specific user
              await tx.scheduleEntry.update({
                where: { id: swapRequest.originalShiftId },
                data: { userId: swapRequest.targetUserId },
              })
            } else {
              // Make it an open shift
              await tx.scheduleEntry.update({
                where: { id: swapRequest.originalShiftId },
                data: {
                  userId: null,
                  isOpenShift: true,
                },
              })
            }
          } else if (swapRequest.swapType === SwapType.PICKUP) {
            // Assign the shift to the requester
            await tx.scheduleEntry.update({
              where: { id: swapRequest.originalShiftId },
              data: {
                userId: swapRequest.requesterId,
                isOpenShift: false,
              },
            })
          }
        })

        // Notify involved parties
        await prisma.notification.create({
          data: {
            facilityId: user.facilityId,
            recipientUserId: swapRequest.requesterId,
            type: 'SWAP_APPROVED',
            title: 'Swap Request Approved',
            message: `Your ${swapRequest.swapType.toLowerCase()} request has been approved.`,
            relatedEntityType: 'ShiftSwapRequest',
            relatedEntityId: id,
          },
        })

        if (swapRequest.targetUserId) {
          await prisma.notification.create({
            data: {
              facilityId: user.facilityId,
              recipientUserId: swapRequest.targetUserId,
              type: 'SWAP_APPROVED',
              title: 'Swap Request Approved',
              message: `The shift swap with ${swapRequest.requester.firstName} has been approved.`,
              relatedEntityType: 'ShiftSwapRequest',
              relatedEntityId: id,
            },
          })
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'SWAP_APPROVE',
            entityType: 'ShiftSwapRequest',
            entityId: id,
            previousValue: swapRequest,
            newValue: { approved: true, notes },
          },
        })
      } else {
        // Manager denied
        await prisma.shiftSwapRequest.update({
          where: { id },
          data: {
            status: SwapStatus.DENIED_MANAGER,
            managerApprovedById: user.id,
            managerApprovedAt: new Date(),
            managerNotes: notes || null,
          },
        })

        // Notify involved parties
        await prisma.notification.create({
          data: {
            facilityId: user.facilityId,
            recipientUserId: swapRequest.requesterId,
            type: 'SWAP_DENIED',
            title: 'Swap Request Denied',
            message: `Your ${swapRequest.swapType.toLowerCase()} request has been denied by management.${notes ? ` Reason: ${notes}` : ''}`,
            relatedEntityType: 'ShiftSwapRequest',
            relatedEntityId: id,
          },
        })

        if (swapRequest.targetUserId) {
          await prisma.notification.create({
            data: {
              facilityId: user.facilityId,
              recipientUserId: swapRequest.targetUserId,
              type: 'SWAP_DENIED',
              title: 'Swap Request Denied',
              message: `The shift swap request has been denied by management.`,
              relatedEntityType: 'ShiftSwapRequest',
              relatedEntityId: id,
            },
          })
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'SWAP_DENY',
            entityType: 'ShiftSwapRequest',
            entityId: id,
            previousValue: swapRequest,
            newValue: { denied: true, notes },
          },
        })
      }

      const updated = await prisma.shiftSwapRequest.findUnique({
        where: { id },
        include: {
          requester: { select: { firstName: true, lastName: true } },
          targetUser: { select: { firstName: true, lastName: true } },
          originalShift: { include: { shift: true } },
          targetShift: { include: { shift: true } },
        },
      })

      return NextResponse.json({ request: updated })
    }

    // Handle cancellation by requester
    if (body.cancel === true) {
      if (swapRequest.requesterId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (![SwapStatus.PENDING_PEER, SwapStatus.PENDING_MANAGER].includes(swapRequest.status)) {
        return NextResponse.json({
          error: 'Can only cancel pending requests',
        }, { status: 400 })
      }

      const updated = await prisma.shiftSwapRequest.update({
        where: { id },
        data: { status: SwapStatus.CANCELLED },
      })

      return NextResponse.json({ request: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating swap request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
