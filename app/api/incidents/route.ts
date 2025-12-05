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
  parseDateRange,
} from '@/lib/api-utils'
import { z } from 'zod'

// Generate unique report number
function generateReportNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INC-${year}${month}${day}-${random}`
}

// Validation schema for injured party
const InjuredPartySchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  contact: z.string().optional(),
  injuryType: z.string(),
  injuryDescription: z.string(),
  treatmentProvided: z.string().optional(),
  ambulanceCalled: z.boolean().default(false),
  hospitalTransport: z.boolean().default(false),
})

// Validation schema for witness
const WitnessSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  statement: z.string().optional(),
})

// Validation schema for creating incident
const CreateIncidentSchema = z.object({
  rinkId: z.string().optional(),
  incidentDate: z.string().datetime(),
  incidentTime: z.string(),
  location: z.string().min(1),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']),
  type: z.string().min(1),
  description: z.string().min(1),
  injuredParties: z.array(InjuredPartySchema).default([]),
  witnesses: z.array(WitnessSchema).default([]),
  immediateActions: z.string().optional(),
})

// GET /api/incidents - List incidents
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const sort = parseSortParams(
      searchParams,
      ['incidentDate', 'severity', 'status', 'createdAt'],
      'incidentDate'
    )
    const dateRange = parseDateRange(searchParams)

    // Build where clause
    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    // Filter by severity
    const severity = searchParams.get('severity')
    if (severity) {
      where.severity = severity
    }

    // Filter by status
    const status = searchParams.get('status')
    if (status) {
      where.status = status
    }

    // Filter by rink
    const rinkId = searchParams.get('rinkId')
    if (rinkId) {
      where.rinkId = rinkId
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      where.incidentDate = {}
      if (dateRange.from) {
        (where.incidentDate as Record<string, Date>).gte = dateRange.from
      }
      if (dateRange.to) {
        (where.incidentDate as Record<string, Date>).lte = dateRange.to
      }
    }

    // Search by report number
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { reportNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.incident.count({ where })

    // Get incidents
    const incidents = await prisma.incident.findMany({
      where,
      include: {
        followUps: {
          orderBy: { dueDate: 'asc' },
          take: 3,
        },
        escalations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            followUps: true,
            escalations: true,
          },
        },
      },
      orderBy: {
        [sort.field]: sort.direction,
      },
      skip: pagination.offset,
      take: pagination.limit,
    })

    return successResponse(createPaginatedResponse(incidents, total, pagination))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/incidents - Create incident
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const body = await request.json()
    const data = CreateIncidentSchema.parse(body)

    // Generate unique report number
    let reportNumber = generateReportNumber()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.incident.findUnique({
        where: { reportNumber },
      })
      if (!existing) break
      reportNumber = generateReportNumber()
      attempts++
    }

    const incident = await prisma.incident.create({
      data: {
        facilityId: user.facilityId,
        rinkId: data.rinkId,
        reportNumber,
        incidentDate: new Date(data.incidentDate),
        incidentTime: data.incidentTime,
        location: data.location,
        severity: data.severity,
        type: data.type,
        description: data.description,
        injuredParties: data.injuredParties,
        witnesses: data.witnesses,
        immediateActions: data.immediateActions,
        reportedById: user.id,
        status: 'REPORTED',
      },
      include: {
        followUps: true,
        escalations: true,
      },
    })

    // Auto-escalate critical incidents
    if (data.severity === 'CRITICAL') {
      await prisma.incidentEscalation.create({
        data: {
          incidentId: incident.id,
          fromLevel: 'STAFF',
          toLevel: 'MANAGER',
          reason: 'Auto-escalated due to critical severity',
          escalatedById: user.id,
        },
      })
    }

    return successResponse(incident, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}
