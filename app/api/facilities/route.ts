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
import { CreateFacilitySchema } from '@/lib/validations'

// GET /api/facilities - List facilities (user's facility only, or all for super admin)
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Regular users only see their own facility
    const facility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
      include: {
        rinks: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        settings: true,
        _count: {
          select: {
            users: true,
            rinks: true,
          },
        },
      },
    })

    if (!facility) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Facility not found')
    }

    return successResponse([facility])
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/facilities - Create facility (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Only admins can create facilities
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const body = await request.json()
    const data = validateBody(CreateFacilitySchema, body)

    const facility = await prisma.facility.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        timezone: data.timezone,
        settings: {
          create: {}, // Create with defaults
        },
      },
      include: {
        settings: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Facility',
        entityId: facility.id,
        newValue: { name: facility.name },
      },
    })

    return successResponse(facility, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
