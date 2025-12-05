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

// Validation schema for updating item
const UpdateItemSchema = z.object({
  sectionId: z.string(),
  itemId: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]).nullable(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'completed', 'skipped', 'issue']).optional(),
})

// Validation schema for adding issue
const AddIssueSchema = z.object({
  itemId: z.string(),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
})

// Validation schema for completing checklist
const CompleteChecklistSchema = z.object({
  notes: z.string().optional(),
  signatureUrl: z.string().url().optional(),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/checklists/[id] - Get single checklist instance
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    const instance = await prisma.checklistInstance.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        template: true,
      },
    })

    if (!instance) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Checklist not found')
    }

    return successResponse(instance)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/checklists/[id] - Update checklist item
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    // Get existing instance
    const existing = await prisma.checklistInstance.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        template: true,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Checklist not found')
    }

    if (existing.status === 'COMPLETED') {
      return errorResponse(ErrorCodes.CONFLICT, 'Cannot modify a completed checklist')
    }

    const body = await request.json()
    const data = UpdateItemSchema.parse(body)

    // Update the specific item in sections
    const sections = existing.sections as Array<{
      sectionId: string
      title: string
      items: Array<{
        itemId: string
        label: string
        value: unknown
        status: string
        completedAt: string | null
        completedBy: string | null
        notes: string | null
      }>
    }>

    let totalItems = 0
    let completedItems = 0

    const updatedSections = sections.map((section) => {
      if (section.sectionId !== data.sectionId) {
        // Count items in other sections
        section.items.forEach((item) => {
          totalItems++
          if (item.status === 'completed') completedItems++
        })
        return section
      }

      return {
        ...section,
        items: section.items.map((item) => {
          totalItems++
          if (item.itemId !== data.itemId) {
            if (item.status === 'completed') completedItems++
            return item
          }

          const newStatus = data.status || (data.value !== null ? 'completed' : 'pending')
          if (newStatus === 'completed') completedItems++

          return {
            ...item,
            value: data.value,
            notes: data.notes !== undefined ? data.notes : item.notes,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
            completedBy: newStatus === 'completed' ? user.id : null,
          }
        }),
      }
    })

    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    const instance = await prisma.checklistInstance.update({
      where: { id },
      data: {
        sections: updatedSections,
        completionPercentage,
        status: completionPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: completionPercentage === 100 ? new Date() : null,
        completedById: completionPercentage === 100 ? user.id : null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    })

    return successResponse(instance)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}

// POST /api/checklists/[id] - Add issue or complete checklist
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Get existing instance
    const existing = await prisma.checklistInstance.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Checklist not found')
    }

    const body = await request.json()

    if (action === 'issue') {
      // Add issue
      const data = AddIssueSchema.parse(body)

      const issues = (existing.issues as Array<unknown>) || []
      const newIssue = {
        id: `issue_${Date.now()}`,
        itemId: data.itemId,
        description: data.description,
        priority: data.priority,
        status: 'OPEN',
        reportedAt: new Date().toISOString(),
        reportedBy: user.id,
      }

      const instance = await prisma.checklistInstance.update({
        where: { id },
        data: {
          issues: [...issues, newIssue],
        },
      })

      return successResponse(instance)
    }

    if (action === 'complete') {
      // Complete checklist
      const data = CompleteChecklistSchema.parse(body)

      if (existing.status === 'COMPLETED') {
        return errorResponse(ErrorCodes.CONFLICT, 'Checklist is already completed')
      }

      const instance = await prisma.checklistInstance.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: user.id,
          notes: data.notes,
          signatureUrl: data.signatureUrl,
          completionPercentage: 100,
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      })

      return successResponse(instance)
    }

    return errorResponse(ErrorCodes.INVALID_INPUT, 'Invalid action. Use ?action=issue or ?action=complete')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}

// DELETE /api/checklists/[id] - Delete checklist instance
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    const existing = await prisma.checklistInstance.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Checklist not found')
    }

    await prisma.checklistInstance.delete({
      where: { id },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
