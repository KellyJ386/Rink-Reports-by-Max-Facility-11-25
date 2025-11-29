import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { validateFormData, FormSchema } from '@/types/form-builder'
import { notifySubmissionReviewed } from '@/lib/notifications/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/submissions/[id] - Get a specific submission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await prisma.formSubmission.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            schema: true,
            version: true,
          },
        },
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rink: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    interface SubmissionWithIncludes {
      id: string
      status: string
      data: unknown
      submittedAt: Date
      reviewedAt: Date | null
      reviewNotes: string | null
      templateVersion: number
      template: {
        id: string
        name: string
        schema: unknown
        version: number
      } | null
      submitter: {
        id: string
        firstName: string
        lastName: string
        email: string
      } | null
      reviewer: {
        id: string
        firstName: string
        lastName: string
      } | null
      rink: {
        id: string
        name: string
      } | null
    }

    const s = submission as unknown as SubmissionWithIncludes

    return NextResponse.json({
      submission: {
        id: s.id,
        templateId: s.template?.id,
        templateName: s.template?.name,
        templateSchema: s.template?.schema,
        templateVersion: s.template?.version,
        submittedVersion: s.templateVersion,
        facilityId: user.facilityId,
        rinkId: s.rink?.id,
        rinkName: s.rink?.name,
        submittedBy: s.submitter?.id,
        submittedByName: s.submitter
          ? `${s.submitter.firstName} ${s.submitter.lastName}`
          : 'Unknown',
        submittedByEmail: s.submitter?.email,
        submittedAt: s.submittedAt.toISOString(),
        status: s.status,
        data: s.data,
        reviewedBy: s.reviewer?.id,
        reviewedByName: s.reviewer
          ? `${s.reviewer.firstName} ${s.reviewer.lastName}`
          : null,
        reviewedAt: s.reviewedAt?.toISOString(),
        reviewNotes: s.reviewNotes,
      },
    })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching submission' },
      { status: 500 }
    )
  }
}

// PUT /api/submissions/[id] - Update a submission (draft or review)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await prisma.formSubmission.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        template: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const body = await request.json()
    const { data, status, reviewNotes, isDraft } = body

    interface SubmissionUpdate {
      data?: unknown
      status?: string
      reviewedBy?: string
      reviewedAt?: Date
      reviewNotes?: string
      submittedAt?: Date
    }

    const updateData: SubmissionUpdate = {}

    // If updating data (for drafts or own submissions)
    if (data !== undefined) {
      interface SubmissionWithSubmitter {
        status: string
        submittedBy: string
        template: {
          schema: unknown
        } | null
      }

      const s = submission as unknown as SubmissionWithSubmitter

      // Only allow data updates for drafts or if user is the submitter
      if (s.status !== 'draft' && s.submittedBy !== user.id) {
        return NextResponse.json(
          { error: 'Cannot update submitted forms' },
          { status: 403 }
        )
      }

      // Validate if submitting (not saving as draft)
      if (!isDraft && s.template) {
        const schema = s.template.schema as unknown as FormSchema
        const validation = validateFormData(schema, data)

        if (!validation.valid) {
          return NextResponse.json(
            { error: 'Validation failed', errors: validation.errors },
            { status: 400 }
          )
        }
      }

      updateData.data = data

      if (isDraft === false && s.status === 'draft') {
        updateData.status = 'submitted'
        updateData.submittedAt = new Date()
      }
    }

    // If reviewing (admin only)
    if (status && ['reviewed', 'approved', 'rejected'].includes(status)) {
      if (!canUserAccess(user, 'admin', 'access')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      updateData.status = status
      updateData.reviewedBy = user.id
      updateData.reviewedAt = new Date()
      if (reviewNotes !== undefined) {
        updateData.reviewNotes = reviewNotes
      }
    }

    const updated = await prisma.formSubmission.update({
      where: { id },
      data: updateData,
      include: {
        submitter: {
          select: { id: true },
        },
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FormSubmission',
        entityId: id,
        newValue: {
          status: updated.status,
          ...(reviewNotes && { reviewNotes }),
        },
      },
    })

    // Send notification if submission was reviewed (approved or rejected)
    if (status && ['approved', 'rejected'].includes(status)) {
      interface UpdatedWithSubmitter {
        submitter: { id: string } | null
      }
      const u = updated as unknown as UpdatedWithSubmitter
      if (u.submitter?.id) {
        await notifySubmissionReviewed(
          user.facilityId,
          u.submitter.id,
          id,
          status as 'approved' | 'rejected',
          reviewNotes
        )
      }
    }

    return NextResponse.json({
      submission: { id: updated.id, status: updated.status },
      message: 'Submission updated successfully',
    })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating submission' },
      { status: 500 }
    )
  }
}

// DELETE /api/submissions/[id] - Delete a submission (drafts only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await prisma.formSubmission.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    interface SubmissionCheck {
      status: string
      submittedBy: string
    }

    const s = submission as unknown as SubmissionCheck

    // Only drafts can be deleted, and only by the submitter or admin
    if (s.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft submissions can be deleted' },
        { status: 403 }
      )
    }

    if (s.submittedBy !== user.id && !canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.formSubmission.delete({
      where: { id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'FormSubmission',
        entityId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting submission' },
      { status: 500 }
    )
  }
}
