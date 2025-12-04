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
import { UpdateFormTemplateSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/form-templates/[id] - Get form template details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    const template = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        previousVersion: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
        nextVersions: {
          select: {
            id: true,
            version: true,
            name: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!template) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Form template not found')
    }

    // Check facility access
    if (template.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    return successResponse(template)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/form-templates/[id] - Update form template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Require admin access with createTemplates permission
    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to edit form templates')
    }

    const { id } = await params
    const body = await request.json()
    const data = validateBody(UpdateFormTemplateSchema, body)

    const existing = await prisma.formTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Form template not found')
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Cannot edit locked templates
    if (existing.isLocked && !canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'This template is locked and cannot be edited')
    }

    const previousValue = {
      name: existing.name,
      schema: existing.schema,
      isActive: existing.isActive,
    }

    const template = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.schema && { schema: data.schema }),
        ...(data.conditionalRules !== undefined && { conditionalRules: data.conditionalRules }),
        ...(data.calculatedFields !== undefined && { calculatedFields: data.calculatedFields }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isLocked !== undefined && { isLocked: data.isLocked }),
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: id,
        previousValue,
        newValue: data,
      },
    })

    return successResponse(template)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/form-templates/[id] - Archive form template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Require admin access
    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to delete form templates')
    }

    const { id } = await params

    const existing = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Form template not found')
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Cannot delete locked templates
    if (existing.isLocked) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'This template is locked and cannot be deleted')
    }

    // Soft delete - mark as inactive if has submissions
    if (existing._count.submissions > 0) {
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ARCHIVE',
          entityType: 'FormTemplate',
          entityId: id,
        },
      })

      return successResponse({ message: 'Form template archived (has existing submissions)' })
    }

    // Hard delete if no submissions
    await prisma.formTemplate.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'FormTemplate',
        entityId: id,
        previousValue: { name: existing.name },
      },
    })

    return successResponse({ message: 'Form template deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/form-templates/[id] - Publish new version
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Require admin access with createTemplates permission
    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to publish form templates')
    }

    const { id } = await params

    const existing = await prisma.formTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Form template not found')
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Create new version
    const newVersion = await prisma.formTemplate.create({
      data: {
        facilityId: existing.facilityId,
        moduleType: existing.moduleType,
        name: existing.name,
        description: existing.description,
        schema: existing.schema as object,
        conditionalRules: existing.conditionalRules as object | null,
        calculatedFields: existing.calculatedFields as object | null,
        version: existing.version + 1,
        previousVersionId: existing.id,
        createdBy: user.id,
      },
    })

    // Mark old version as inactive
    await prisma.formTemplate.update({
      where: { id },
      data: { isActive: false },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'FormTemplate',
        entityId: newVersion.id,
        newValue: {
          name: newVersion.name,
          version: newVersion.version,
          previousVersionId: id,
        },
      },
    })

    return successResponse(newVersion, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
