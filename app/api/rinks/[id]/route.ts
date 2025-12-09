import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  validateBody,
} from '@/lib/api-utils'
import { UpdateRinkSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/rinks/[id] - Get rink details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    const rink = await prisma.rink.findUnique({
      where: { id },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        iceDepthConfiguration: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!rink) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Rink not found')
    }

    // Check facility access
    if (rink.facility.id !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    return successResponse(rink)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/rinks/[id] - Update rink
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Require admin access
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const body = await request.json()
    const data = validateBody(UpdateRinkSchema, body)

    const existing = await prisma.rink.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Rink not found')
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    const rink = await prisma.rink.update({
      where: { id },
      data,
      include: {
        iceDepthConfiguration: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Rink',
        entityId: id,
        previousValue: {
          name: existing.name,
          isActive: existing.isActive,
        },
        newValue: data,
      },
    })

    return successResponse(rink)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/rinks/[id] - Deactivate rink (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Require admin access
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const existing = await prisma.rink.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Rink not found')
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Soft delete - just mark as inactive
    await prisma.rink.update({
      where: { id },
      data: { isActive: false },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'Rink',
        entityId: id,
        previousValue: { isActive: true },
        newValue: { isActive: false },
      },
    })

    return successResponse({ message: 'Rink deactivated successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
