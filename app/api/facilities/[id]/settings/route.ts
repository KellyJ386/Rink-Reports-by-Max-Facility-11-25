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
import { FacilitySettingsSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/facilities/[id]/settings - Get facility settings
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

    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: id },
    })

    if (!settings) {
      // Create default settings if none exist
      const newSettings = await prisma.facilitySettings.create({
        data: { facilityId: id },
      })
      return successResponse(newSettings)
    }

    return successResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/facilities/[id]/settings - Update facility settings
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
    const data = validateBody(FacilitySettingsSchema.partial(), body)

    // Get existing settings for audit log
    const existing = await prisma.facilitySettings.findUnique({
      where: { facilityId: id },
    })

    const settings = await prisma.facilitySettings.upsert({
      where: { facilityId: id },
      update: data,
      create: {
        facilityId: id,
        ...data,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: existing ? 'UPDATE' : 'CREATE',
        entityType: 'FacilitySettings',
        entityId: settings.id,
        previousValue: existing ? { ...existing } : null,
        newValue: data,
      },
    })

    return successResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}
