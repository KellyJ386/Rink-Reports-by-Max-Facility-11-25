import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import type { ModuleType } from '@prisma/client'

/**
 * GET /api/submissions/[id]
 * Get a single submission by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user) => {
    try {
      const { id } = params

      // Fetch the submission with all related data
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          formTemplate: {
            select: {
              id: true,
              name: true,
              description: true,
              moduleType: true,
              version: true,
              schema: true,
              conditionalRules: true,
            },
          },
          rink: {
            select: {
              id: true,
              name: true,
              facilityId: true,
              facility: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          attachments: {
            select: {
              id: true,
              fieldId: true,
              type: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              storageKey: true,
              createdAt: true,
            },
          },
        },
      })

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

      // Check if submission belongs to user's facility
      if (submission.rink.facilityId !== user.facilityId) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

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

      const moduleKey = moduleTypeMap[submission.formTemplate.moduleType]
      const hasViewAll = permissions[moduleKey]?.viewAll
      const hasViewOwn = permissions[moduleKey]?.viewOwn

      // Check if user has permission to view this submission
      if (!hasViewAll && !hasViewOwn) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view this submission' },
          { status: 403 }
        )
      }

      // If user only has viewOwn, verify they own this submission
      if (!hasViewAll && hasViewOwn && submission.submittedById !== user.id) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view this submission' },
          { status: 403 }
        )
      }

      // Check if submission is archived
      if (submission.archivedAt) {
        return NextResponse.json(
          { error: 'Submission has been archived' },
          { status: 410 } // 410 Gone
        )
      }

      return NextResponse.json({ submission })
    } catch (error) {
      console.error('Submission fetch error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

/**
 * PATCH /api/submissions/[id]
 * Update a submission (for draft editing or review)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user) => {
    try {
      const { id } = params
      const body = await request.json()
      const { data, status, reviewNotes } = body

      // Fetch the submission
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          rink: {
            select: { facilityId: true },
          },
          formTemplate: {
            select: { moduleType: true },
          },
        },
      })

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

      // Check facility ownership
      if (submission.rink.facilityId !== user.facilityId) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

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

      const moduleKey = moduleTypeMap[submission.formTemplate.moduleType]

      // If updating data, user must own the submission or have edit permission
      if (data) {
        const canEdit =
          permissions[moduleKey]?.edit ||
          submission.submittedById === user.id

        if (!canEdit) {
          return NextResponse.json(
            { error: 'Insufficient permissions to edit this submission' },
            { status: 403 }
          )
        }

        // Can only edit drafts
        if (submission.status !== 'DRAFT') {
          return NextResponse.json(
            { error: 'Can only edit draft submissions' },
            { status: 400 }
          )
        }
      }

      // If approving/rejecting, user must have approve permission
      if (status && ['APPROVED', 'REJECTED'].includes(status)) {
        if (!permissions[moduleKey]?.approve) {
          return NextResponse.json(
            { error: 'Insufficient permissions to approve/reject submissions' },
            { status: 403 }
          )
        }
      }

      // Update the submission
      const updateData: any = {}

      if (data) {
        updateData.data = data
      }

      if (status) {
        updateData.status = status

        if (['APPROVED', 'REJECTED'].includes(status)) {
          updateData.reviewedById = user.id
          updateData.reviewedAt = new Date()
          if (reviewNotes) {
            updateData.reviewNotes = reviewNotes
          }
        }
      }

      const updatedSubmission = await prisma.submission.update({
        where: { id },
        data: updateData,
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
          action: 'UPDATE',
          entityType: 'Submission',
          entityId: submission.id,
          previousValue: { data: submission.data, status: submission.status },
          newValue: updateData,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          submissionId: submission.id,
        },
      })

      return NextResponse.json({
        message: 'Submission updated successfully',
        submission: updatedSubmission,
      })
    } catch (error) {
      console.error('Submission update error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

/**
 * DELETE /api/submissions/[id]
 * Archive a submission (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (user) => {
    try {
      const { id } = params

      // Fetch the submission
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          rink: {
            select: { facilityId: true },
          },
          formTemplate: {
            select: { moduleType: true },
          },
        },
      })

      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

      // Check facility ownership
      if (submission.rink.facilityId !== user.facilityId) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        )
      }

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

      const moduleKey = moduleTypeMap[submission.formTemplate.moduleType]

      if (!permissions[moduleKey]?.delete) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete submissions' },
          { status: 403 }
        )
      }

      // Soft delete (archive) the submission
      await prisma.submission.update({
        where: { id },
        data: {
          archivedAt: new Date(),
        },
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ARCHIVE',
          entityType: 'Submission',
          entityId: submission.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          submissionId: submission.id,
        },
      })

      return NextResponse.json({
        message: 'Submission archived successfully',
      })
    } catch (error) {
      console.error('Submission archive error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
