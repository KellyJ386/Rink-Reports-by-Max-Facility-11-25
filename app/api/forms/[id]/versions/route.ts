import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/forms/[id]/versions - Get version history for a form template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the template exists and belongs to the user's facility
    const template = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      select: {
        id: true,
        name: true,
        version: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    // Get version history from audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'FormTemplate',
        entityId: id,
        action: {
          in: ['CREATE', 'UPDATE'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Transform audit logs into version history
    interface AuditLogWithUser {
      createdAt: Date
      action: string
      previousValue: unknown
      newValue: unknown
      user: {
        id: string
        firstName: string
        lastName: string
        email: string
      } | null
    }

    const versions = (auditLogs as AuditLogWithUser[]).map((log, index) => ({
      version: template.version - index,
      createdAt: log.createdAt.toISOString(),
      createdBy: log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : 'Unknown',
      createdByEmail: log.user?.email || 'unknown',
      action: log.action,
      changes: summarizeChanges(log.previousValue, log.newValue),
    }))

    return NextResponse.json({
      templateId: template.id,
      templateName: template.name,
      currentVersion: template.version,
      versions,
    })
  } catch (error) {
    console.error('Error fetching form versions:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching form versions' },
      { status: 500 }
    )
  }
}

// POST /api/forms/[id]/versions - Restore a specific version (creates new version)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { version, schema } = body

    if (!version || !schema) {
      return NextResponse.json(
        { error: 'Version and schema are required' },
        { status: 400 }
      )
    }

    const template = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    if (template.isLocked) {
      return NextResponse.json(
        { error: 'This template is locked and cannot be modified' },
        { status: 403 }
      )
    }

    // Store current state before restore
    const previousValue = {
      schema: template.schema,
      version: template.version,
    }

    // Update template with restored schema
    const updatedTemplate = await prisma.formTemplate.update({
      where: { id },
      data: {
        schema,
        version: { increment: 1 },
      },
    })

    // Log the restore action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        previousValue,
        newValue: {
          schema,
          version: updatedTemplate.version,
          restoredFrom: version,
        },
      },
    })

    return NextResponse.json({
      message: `Template restored from version ${version}`,
      template: updatedTemplate,
    })
  } catch (error) {
    console.error('Error restoring form version:', error)
    return NextResponse.json(
      { error: 'An error occurred while restoring form version' },
      { status: 500 }
    )
  }
}

// Helper function to summarize changes between versions
function summarizeChanges(
  previousValue: unknown,
  newValue: unknown
): string {
  const changes: string[] = []
  const prev = (previousValue || {}) as Record<string, unknown>
  const next = (newValue || {}) as Record<string, unknown>

  if (prev.name !== next.name && next.name) {
    changes.push(`Name changed to "${next.name}"`)
  }

  if (prev.description !== next.description && next.description !== undefined) {
    changes.push('Description updated')
  }

  if (next.schema) {
    changes.push('Form schema updated')
  }

  if (prev.isActive !== next.isActive && next.isActive !== undefined) {
    changes.push(next.isActive ? 'Template activated' : 'Template deactivated')
  }

  if ((next as Record<string, unknown>).restoredFrom) {
    changes.push(`Restored from version ${(next as Record<string, unknown>).restoredFrom}`)
  }

  return changes.length > 0 ? changes.join(', ') : 'Initial version'
}
