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
import { UpdateFacilitySchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/facilities/[id] - Get facility details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Users can only access their own facility
    if (id !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        rinks: {
          orderBy: { name: 'asc' },
        },
        settings: true,
        _count: {
          select: {
            users: true,
            rinks: true,
            formTemplates: true,
          },
        },
      },
    })

    if (!facility) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Facility not found')
    }

    return successResponse(facility)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/facilities/[id] - Update facility
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Users can only update their own facility
    if (id !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Require admin access
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const body = await request.json()
    const data = validateBody(UpdateFacilitySchema, body)

    const existing = await prisma.facility.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Facility not found')
    }

    const facility = await prisma.facility.update({
      where: { id },
      data,
      include: {
        settings: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Facility',
        entityId: id,
        previousValue: {
          name: existing.name,
          address: existing.address,
          city: existing.city,
          state: existing.state,
        },
        newValue: data,
      },
    })

    return successResponse(facility)
  } catch (error) {
    return handleApiError(error)
  }
}
