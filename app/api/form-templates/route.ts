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
  parsePagination,
  createPaginatedResponse,
} from '@/lib/api-utils'
import { CreateFormTemplateSchema } from '@/lib/validations'

// GET /api/form-templates - List form templates
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)

    // Build where clause
    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    // Filter by module type
    const moduleType = searchParams.get('moduleType')
    if (moduleType) {
      where.moduleType = moduleType
    }

    // Filter by active status
    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Get total count
    const total = await prisma.formTemplate.count({ where })

    // Get templates
    const templates = await prisma.formTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        moduleType: true,
        version: true,
        isActive: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: [{ moduleType: 'asc' }, { name: 'asc' }],
      skip: pagination.offset,
      take: pagination.limit,
    })

    return successResponse(createPaginatedResponse(templates, total, pagination))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/form-templates - Create form template
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Require admin access with createTemplates permission
    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to create form templates')
    }

    const body = await request.json()
    const data = validateBody(CreateFormTemplateSchema, body)

    // Verify facility access
    if (data.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Cannot create templates for other facilities')
    }

    const template = await prisma.formTemplate.create({
      data: {
        facilityId: data.facilityId,
        moduleType: data.moduleType,
        name: data.name,
        description: data.description,
        schema: data.schema,
        conditionalRules: data.conditionalRules,
        calculatedFields: data.calculatedFields,
        createdBy: user.id,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        newValue: { name: template.name, moduleType: template.moduleType },
      },
    })

    return successResponse(template, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
