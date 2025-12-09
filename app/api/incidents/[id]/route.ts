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

// Validation schema for updating incident
const UpdateIncidentSchema = z.object({
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']).optional(),
  status: z
    .enum(['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_REVIEW', 'RESOLVED', 'CLOSED', 'REOPENED'])
    .optional(),
  description: z.string().optional(),
  immediateActions: z.string().optional(),
  rootCause: z.string().optional(),
  preventiveMeasures: z.string().optional(),
  assignedToId: z.string().optional(),
})

// Validation schema for adding follow-up
const AddFollowUpSchema = z.object({
  type: z.enum([
    'PHONE_CALL',
    'MEDICAL_CHECK',
    'INSURANCE_CLAIM',
    'INVESTIGATION',
    'DOCUMENTATION',
    'TRAINING',
    'EQUIPMENT_INSPECTION',
    'OTHER',
  ]),
  dueDate: z.string().datetime(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
})

// Validation schema for escalation
const EscalateSchema = z.object({
  toLevel: z.enum(['STAFF', 'SUPERVISOR', 'MANAGER', 'DIRECTOR', 'EXECUTIVE', 'EXTERNAL']),
  reason: z.string().min(1),
})

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/incidents/[id] - Get single incident
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    const incident = await prisma.incident.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        followUps: {
          orderBy: { dueDate: 'asc' },
        },
        escalations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!incident) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Incident not found')
    }

    return successResponse(incident)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/incidents/[id] - Update incident
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    // Verify incident exists and belongs to user's facility
    const existing = await prisma.incident.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Incident not found')
    }

    const body = await request.json()
    const data = UpdateIncidentSchema.parse(body)

    // Prepare update data
    const updateData: Record<string, unknown> = { ...data }

    // Handle status changes
    if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
      updateData.closedAt = new Date()
      updateData.closedById = user.id
    }

    if (data.status === 'PENDING_REVIEW') {
      updateData.reviewedAt = new Date()
      updateData.reviewedById = user.id
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        followUps: {
          orderBy: { dueDate: 'asc' },
        },
        escalations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return successResponse(incident)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}

// POST /api/incidents/[id] - Add follow-up or escalate
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Verify incident exists and belongs to user's facility
    const existing = await prisma.incident.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        escalations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Incident not found')
    }

    const body = await request.json()

    if (action === 'follow-up') {
      // Add follow-up
      const data = AddFollowUpSchema.parse(body)

      const followUp = await prisma.incidentFollowUp.create({
        data: {
          incidentId: id,
          type: data.type,
          dueDate: new Date(data.dueDate),
          assignedToId: data.assignedToId,
          notes: data.notes,
          status: 'PENDING',
          createdById: user.id,
        },
      })

      return successResponse(followUp, 201)
    }

    if (action === 'escalate') {
      // Escalate incident
      const data = EscalateSchema.parse(body)

      // Determine current level
      const currentLevel = existing.escalations[0]?.toLevel || 'STAFF'

      const escalation = await prisma.incidentEscalation.create({
        data: {
          incidentId: id,
          fromLevel: currentLevel,
          toLevel: data.toLevel,
          reason: data.reason,
          escalatedById: user.id,
        },
      })

      // Update incident status if not already under investigation
      if (existing.status === 'REPORTED') {
        await prisma.incident.update({
          where: { id },
          data: { status: 'UNDER_INVESTIGATION' },
        })
      }

      return successResponse(escalation, 201)
    }

    if (action === 'complete-followup') {
      // Complete a follow-up
      const followUpId = body.followUpId
      if (!followUpId) {
        return errorResponse(ErrorCodes.INVALID_INPUT, 'Follow-up ID is required')
      }

      const followUp = await prisma.incidentFollowUp.update({
        where: { id: followUpId },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
          notes: body.notes,
        },
      })

      return successResponse(followUp)
    }

    return errorResponse(
      ErrorCodes.INVALID_INPUT,
      'Invalid action. Use ?action=follow-up, ?action=escalate, or ?action=complete-followup'
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}

// DELETE /api/incidents/[id] - Delete incident (soft delete by closing)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await context.params

    const existing = await prisma.incident.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Incident not found')
    }

    // Soft delete by marking as closed
    await prisma.incident.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: user.id,
      },
    })

    return successResponse({ closed: true })
  } catch (error) {
    return handleApiError(error)
  }
}
