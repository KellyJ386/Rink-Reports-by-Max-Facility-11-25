import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/submissions/[id] - Get a single submission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
            version: true,
            schema: true,
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
        attachments: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify submission belongs to user's facility
    if (submission.formTemplate.id) {
      const template = await prisma.formTemplate.findUnique({
        where: { id: submission.formTemplateId },
      })
      if (template?.facilityId !== user.facilityId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

// PUT /api/submissions/[id] - Update a submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify submission belongs to user's facility
    if (existing.formTemplate.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check permissions
    const permissions = getUserPermissions(user)
    const isOwner = existing.submittedById === user.id
    const canEdit = isOwner || permissions.admin?.access

    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this submission' },
        { status: 403 }
      )
    }

    // Can only edit if status is DRAFT or SUBMITTED (not after review)
    if (!['DRAFT', 'SUBMITTED'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Cannot edit a submission that has been reviewed' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { data, outsideTemp, outsideTempUnit, rinkId } = body

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...(data !== undefined && { data }),
        ...(outsideTemp !== undefined && { outsideTemp }),
        ...(outsideTempUnit !== undefined && { outsideTempUnit }),
        ...(rinkId !== undefined && { rinkId }),
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
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
          },
        },
      },
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}

// DELETE /api/submissions/[id] - Archive a submission
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.delete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Get existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify submission belongs to user's facility
    if (existing.formTemplate.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Archive instead of delete (for compliance)
    await prisma.submission.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    return NextResponse.json({ message: 'Submission archived' })
  } catch (error) {
    console.error('Error archiving submission:', error)
    return NextResponse.json(
      { error: 'Failed to archive submission' },
      { status: 500 }
    )
  }
}
