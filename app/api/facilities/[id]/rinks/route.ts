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
import { CreateRinkSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/facilities/[id]/rinks - List rinks for facility
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

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const rinks = await prisma.rink.findMany({
      where: {
        facilityId: id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        iceDepthConfiguration: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return successResponse(rinks)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/facilities/[id]/rinks - Create rink
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Users can only add to their own facility
    if (id !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Require admin access
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const body = await request.json()
    const data = validateBody(CreateRinkSchema.omit({ facilityId: true }), body)

    const rink = await prisma.rink.create({
      data: {
        facilityId: id,
        name: data.name,
        dimensions: data.dimensions,
        surfaceType: data.surfaceType,
        isActive: data.isActive,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Rink',
        entityId: rink.id,
        newValue: { name: rink.name },
      },
    })

    return successResponse(rink, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
