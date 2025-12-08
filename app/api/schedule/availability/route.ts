import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { createEmployeeAvailabilitySchema, bulkUpdateAvailabilitySchema } from '@/types/schedule'

// GET /api/schedule/availability - Get availability records
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const dayOfWeek = searchParams.get('dayOfWeek')

    const where: any = {
      facilityId: user.facilityId,
    }

    // Check view permissions
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    if (!canViewAll) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      where.dayOfWeek = parseInt(dayOfWeek)
    }

    const availability = await prisma.employeeAvailability.findMany({
      where,
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
      orderBy: [{ userId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule/availability - Create or bulk update availability
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    // Check if this is a bulk update
    if (body.availability && Array.isArray(body.availability)) {
      const result = bulkUpdateAvailabilitySchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json({ error: result.error.errors }, { status: 400 })
      }

      // Determine which user's availability is being updated
      const targetUserId = body.userId || user.id

      // Check permissions if updating someone else's availability
      if (targetUserId !== user.id && !canUserAccess(user, 'schedule', 'edit')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Delete existing availability and recreate
      await prisma.$transaction(async (tx) => {
        // Delete existing entries for this user
        await tx.employeeAvailability.deleteMany({
          where: {
            userId: targetUserId,
            facilityId: user.facilityId,
          },
        })

        // Create new entries
        for (const item of result.data.availability) {
          await tx.employeeAvailability.create({
            data: {
              userId: targetUserId,
              facilityId: user.facilityId,
              dayOfWeek: item.dayOfWeek,
              startTime: item.startTime,
              endTime: item.endTime,
              isAvailable: item.isAvailable,
              preferenceLevel: item.preferenceLevel,
              notes: item.notes || null,
            },
          })
        }
      })

      const availability = await prisma.employeeAvailability.findMany({
        where: {
          userId: targetUserId,
          facilityId: user.facilityId,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'EmployeeAvailability',
          entityId: targetUserId,
          newValue: { count: availability.length },
        },
      })

      return NextResponse.json({ availability })
    }

    // Single availability create
    const result = createEmployeeAvailabilitySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const data = result.data
    const targetUserId = body.userId || user.id

    // Check permissions if creating for someone else
    if (targetUserId !== user.id && !canUserAccess(user, 'schedule', 'edit')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const availability = await prisma.employeeAvailability.create({
      data: {
        userId: targetUserId,
        facilityId: user.facilityId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isAvailable: data.isAvailable,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        preferenceLevel: data.preferenceLevel,
        notes: data.notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'EmployeeAvailability',
        entityId: availability.id,
        newValue: availability,
      },
    })

    return NextResponse.json({ availability }, { status: 201 })
  } catch (error) {
    console.error('Error creating availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
