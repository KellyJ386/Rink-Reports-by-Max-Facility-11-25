import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
} from '@/lib/api-utils'
import { z } from 'zod'

// Validation schema for updating equipment
const UpdateEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  category: z
    .enum([
      'RESURFACER',
      'REFRIGERATION',
      'COMPRESSOR',
      'EDGER',
      'SKATE_SHARPENER',
      'SAFETY_EQUIPMENT',
      'HVAC',
      'LIGHTING',
      'BOARDS_GLASS',
      'GOALS_NETS',
      'OTHER',
    ])
    .optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().datetime().optional().nullable(),
  warrantyExpiry: z.string().datetime().optional().nullable(),
  location: z.string().optional(),
  status: z
    .enum(['OPERATIONAL', 'NEEDS_MAINTENANCE', 'UNDER_REPAIR', 'OUT_OF_SERVICE', 'RETIRED'])
    .optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
})

// Validation schema for creating maintenance record
const CreateMaintenanceSchema = z.object({
  type: z.enum([
    'PREVENTIVE',
    'CORRECTIVE',
    'INSPECTION',
    'CALIBRATION',
    'REPLACEMENT',
    'EMERGENCY',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/equipment/[id] - Get single equipment
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    const equipment = await prisma.equipment.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        maintenanceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!equipment) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Equipment not found')
    }

    return successResponse(equipment)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/equipment/[id] - Update equipment
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    // Verify equipment exists and belongs to user's facility
    const existing = await prisma.equipment.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Equipment not found')
    }

    const body = await request.json()
    const data = UpdateEquipmentSchema.parse(body)

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : undefined,
      },
      include: {
        maintenanceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    return successResponse(equipment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}

// DELETE /api/equipment/[id] - Delete equipment
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    // Verify equipment exists and belongs to user's facility
    const existing = await prisma.equipment.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Equipment not found')
    }

    await prisma.equipment.delete({
      where: { id },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/equipment/[id] - Add maintenance record
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    // Verify equipment exists and belongs to user's facility
    const existing = await prisma.equipment.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Equipment not found')
    }

    const body = await request.json()
    const data = CreateMaintenanceSchema.parse(body)

    const maintenance = await prisma.maintenanceRecord.create({
      data: {
        equipmentId: id,
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        createdById: user.id,
      },
    })

    // Update equipment status if needed
    if (data.type === 'EMERGENCY' || data.priority === 'CRITICAL') {
      await prisma.equipment.update({
        where: { id },
        data: { status: 'NEEDS_MAINTENANCE' },
      })
    }

    return successResponse(maintenance, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}
