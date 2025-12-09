import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  parsePagination,
  createPaginatedResponse,
  parseSortParams,
} from '@/lib/api-utils'
import { z } from 'zod'

// Validation schema for creating equipment
const CreateEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum([
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
  ]),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  location: z.string().optional(),
  status: z
    .enum(['OPERATIONAL', 'NEEDS_MAINTENANCE', 'UNDER_REPAIR', 'OUT_OF_SERVICE', 'RETIRED'])
    .default('OPERATIONAL'),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

// GET /api/equipment - List equipment
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const sort = parseSortParams(searchParams, ['name', 'category', 'status', 'createdAt'], 'name')

    // Build where clause
    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    // Filter by category
    const category = searchParams.get('category')
    if (category) {
      where.category = category
    }

    // Filter by status
    const status = searchParams.get('status')
    if (status) {
      where.status = status
    }

    // Search by name
    const search = searchParams.get('search')
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    // Get total count
    const total = await prisma.equipment.count({ where })

    // Get equipment
    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        maintenanceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            type: true,
            status: true,
            scheduledDate: true,
            completedDate: true,
          },
        },
        _count: {
          select: {
            maintenanceRecords: true,
          },
        },
      },
      orderBy: {
        [sort.field]: sort.direction,
      },
      skip: pagination.offset,
      take: pagination.limit,
    })

    return successResponse(createPaginatedResponse(equipment, total, pagination))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/equipment - Create equipment
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const body = await request.json()
    const data = CreateEquipmentSchema.parse(body)

    const equipment = await prisma.equipment.create({
      data: {
        ...data,
        facilityId: user.facilityId,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      },
      include: {
        maintenanceRecords: true,
      },
    })

    return successResponse(equipment, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}
