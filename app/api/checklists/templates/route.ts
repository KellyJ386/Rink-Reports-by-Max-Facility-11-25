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

// Validation schema for checklist item
const ChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['CHECKBOX', 'YES_NO', 'PASS_FAIL', 'NUMERIC', 'TEXT', 'PHOTO', 'SIGNATURE']),
  order: z.number().int().positive(),
  isRequired: z.boolean().default(true),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
})

// Validation schema for checklist section
const ChecklistSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().positive(),
  items: z.array(ChecklistItemSchema),
  isRequired: z.boolean().default(true),
})

// Validation schema for creating template
const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum([
    'OPENING',
    'CLOSING',
    'SAFETY',
    'EQUIPMENT',
    'ICE_MAINTENANCE',
    'HVAC',
    'CLEANING',
    'RESURFACER',
    'EMERGENCY',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'CUSTOM',
  ]),
  frequency: z
    .enum(['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'])
    .default('ONCE'),
  estimatedDuration: z.number().int().positive().default(30),
  sections: z.array(ChecklistSectionSchema),
  requiredRoles: z.array(z.string()).default([]),
})

// GET /api/checklists/templates - List templates
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const sort = parseSortParams(searchParams, ['name', 'category', 'createdAt'], 'name')

    // Build where clause
    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    // Filter by category
    const category = searchParams.get('category')
    if (category) {
      where.category = category
    }

    // Filter by active status
    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Search by name
    const search = searchParams.get('search')
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    // Get total count
    const total = await prisma.checklistTemplate.count({ where })

    // Get templates
    const templates = await prisma.checklistTemplate.findMany({
      where,
      include: {
        _count: {
          select: {
            instances: true,
          },
        },
      },
      orderBy: {
        [sort.field]: sort.direction,
      },
      skip: pagination.offset,
      take: pagination.limit,
    })

    return successResponse(createPaginatedResponse(templates, total, pagination))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/checklists/templates - Create template
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const body = await request.json()
    const data = CreateTemplateSchema.parse(body)

    const template = await prisma.checklistTemplate.create({
      data: {
        ...data,
        facilityId: user.facilityId,
        createdById: user.id,
        sections: data.sections,
      },
    })

    return successResponse(template, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}
