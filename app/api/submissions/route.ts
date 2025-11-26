import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withPermission } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import type { FormData, UniversalHeaderData } from '@/types/forms'
import type { ModuleType, SubmissionStatus } from '@prisma/client'
import { triggerSubmissionNotifications } from '@/lib/services/notificationTriggers'

/**
 * POST /api/submissions
 * Create a new submission
 *
 * Body:
 * {
 *   formTemplateId: string
 *   rinkId: string
 *   headerData: UniversalHeaderData
 *   formData: FormData
 *   status?: 'DRAFT' | 'SUBMITTED'
 *   clientId?: string  // For offline dedup
 * }
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json()
      const {
        formTemplateId,
        rinkId,
        headerData,
        formData,
        status = 'SUBMITTED',
        clientId,
      } = body

      // Validate required fields
      if (!formTemplateId || !rinkId || !headerData || !formData) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Get the form template to determine module type
      const formTemplate = await prisma.formTemplate.findUnique({
        where: { id: formTemplateId },
        select: {
          id: true,
          moduleType: true,
          version: true,
          isActive: true,
        },
      })

      if (!formTemplate) {
        return NextResponse.json(
          { error: 'Form template not found' },
          { status: 404 }
        )
      }

      if (!formTemplate.isActive) {
        return NextResponse.json(
          { error: 'Form template is not active' },
          { status: 400 }
        )
      }

      // Check if user has permission to submit for this module
      // Convert module type from enum to permission key format
      const moduleTypeMap: Record<ModuleType, string> = {
        ICE_DEPTH: 'iceDepth',
        ICE_OPERATIONS: 'iceOperations',
        REFRIGERATION: 'refrigeration',
        AIR_QUALITY: 'airQuality',
        INCIDENT: 'incidents',
        SCHEDULE: 'schedule',
        DAILY_CHECKLIST: 'dailyChecklist',
      }

      const moduleKey = moduleTypeMap[formTemplate.moduleType]
      const permissions = user.role.permissions as any

      if (!permissions[moduleKey]?.submit) {
        return NextResponse.json(
          { error: 'Insufficient permissions to submit this form' },
          { status: 403 }
        )
      }

      // Verify rink exists and belongs to user's facility
      const rink = await prisma.rink.findUnique({
        where: { id: rinkId },
        select: { id: true, facilityId: true },
      })

      if (!rink) {
        return NextResponse.json(
          { error: 'Rink not found' },
          { status: 404 }
        )
      }

      if (rink.facilityId !== user.facilityId) {
        return NextResponse.json(
          { error: 'Rink does not belong to your facility' },
          { status: 403 }
        )
      }

      // Check for duplicate submission (offline sync)
      if (clientId) {
        const existing = await prisma.submission.findFirst({
          where: { clientId },
        })

        if (existing) {
          return NextResponse.json(
            {
              message: 'Submission already exists',
              submission: existing,
            },
            { status: 200 }
          )
        }
      }

      // Create the submission
      const submission = await prisma.submission.create({
        data: {
          formTemplateId,
          formVersionAtSubmission: formTemplate.version,
          rinkId,
          submittedById: user.id,
          submittedAt: headerData.submittedAt || new Date(),
          outsideTemp: headerData.outsideTemp,
          outsideTempUnit: headerData.outsideTempUnit || 'F',
          data: formData as any,
          status: status as SubmissionStatus,
          clientId,
          syncedAt: new Date(),
        },
        include: {
          formTemplate: {
            select: {
              name: true,
              moduleType: true,
            },
          },
          rink: {
            select: {
              name: true,
            },
          },
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'Submission',
          entityId: submission.id,
          newValue: { formData, headerData },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          submissionId: submission.id,
        },
      })

      // Trigger automated notifications for submitted forms (not drafts)
      if (status === 'SUBMITTED') {
        // Run in background - don't wait for completion
        triggerSubmissionNotifications(submission.id, formTemplate.moduleType).catch((error) => {
          console.error('Error triggering submission notifications:', error)
        })
      }

      return NextResponse.json(
        {
          message: 'Submission created successfully',
          submission,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Submission creation error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

/**
 * GET /api/submissions
 * List submissions with filters
 *
 * Query params:
 * - moduleType: ICE_OPERATIONS, ICE_DEPTH, etc.
 * - rinkId: specific rink
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - status: DRAFT, SUBMITTED, etc.
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const moduleType = searchParams.get('moduleType') as ModuleType | null
      const rinkId = searchParams.get('rinkId')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const status = searchParams.get('status') as SubmissionStatus | null
      const limit = Math.min(
        parseInt(searchParams.get('limit') || '50'),
        100
      )
      const offset = parseInt(searchParams.get('offset') || '0')

      // Build where clause
      const where: any = {}

      // Check permissions
      const permissions = user.role.permissions as any
      const moduleTypeMap: Record<ModuleType, string> = {
        ICE_DEPTH: 'iceDepth',
        ICE_OPERATIONS: 'iceOperations',
        REFRIGERATION: 'refrigeration',
        AIR_QUALITY: 'airQuality',
        INCIDENT: 'incidents',
        SCHEDULE: 'schedule',
        DAILY_CHECKLIST: 'dailyChecklist',
      }

      // If moduleType is specified, check permission for that module
      if (moduleType) {
        const moduleKey = moduleTypeMap[moduleType]
        const hasViewAll = permissions[moduleKey]?.viewAll
        const hasViewOwn = permissions[moduleKey]?.viewOwn

        if (!hasViewAll && !hasViewOwn) {
          return NextResponse.json(
            { error: 'Insufficient permissions to view submissions' },
            { status: 403 }
          )
        }

        // Filter by module type
        where.formTemplate = {
          moduleType,
        }

        // If user only has viewOwn, restrict to their submissions
        if (!hasViewAll && hasViewOwn) {
          where.submittedById = user.id
        }
      }

      // Filter by rink (must belong to user's facility)
      if (rinkId) {
        const rink = await prisma.rink.findUnique({
          where: { id: rinkId },
          select: { facilityId: true },
        })

        if (!rink || rink.facilityId !== user.facilityId) {
          return NextResponse.json(
            { error: 'Invalid rink' },
            { status: 400 }
          )
        }

        where.rinkId = rinkId
      } else {
        // Ensure submissions are from user's facility
        where.rink = {
          facilityId: user.facilityId,
        }
      }

      // Filter by date range
      if (startDate || endDate) {
        where.submittedAt = {}
        if (startDate) {
          where.submittedAt.gte = new Date(startDate)
        }
        if (endDate) {
          where.submittedAt.lte = new Date(endDate)
        }
      }

      // Filter by status
      if (status) {
        where.status = status
      }

      // Exclude archived submissions
      where.archivedAt = null

      // Fetch submissions
      const [submissions, total] = await Promise.all([
        prisma.submission.findMany({
          where,
          include: {
            formTemplate: {
              select: {
                id: true,
                name: true,
                moduleType: true,
                version: true,
              },
            },
            rink: {
              select: {
                id: true,
                name: true,
              },
            },
            submittedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            submittedAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        prisma.submission.count({ where }),
      ])

      return NextResponse.json({
        submissions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      })
    } catch (error) {
      console.error('Submissions list error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
