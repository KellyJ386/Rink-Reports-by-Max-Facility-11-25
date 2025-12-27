import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface BulkOperation {
  date: string
  shiftId: string
  userId: string | null
  existingEntryId?: string
}

// POST /api/schedule/entries/bulk - Create or update multiple schedule entries
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.create) {
      return NextResponse.json(
        { error: 'You do not have permission to modify schedules' },
        { status: 403 }
      )
    }

    const { operations } = await request.json() as { operations: BulkOperation[] }

    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: 'No operations provided' },
        { status: 400 }
      )
    }

    // Validate all shift IDs exist
    const shiftIds = [...new Set(operations.map(op => op.shiftId))]
    const shifts = await prisma.shiftDefinition.findMany({
      where: {
        id: { in: shiftIds },
        facilityId: user.facilityId
      }
    })

    if (shifts.length !== shiftIds.length) {
      return NextResponse.json(
        { error: 'One or more invalid shift definitions' },
        { status: 400 }
      )
    }

    const shiftMap = new Map(shifts.map(s => [s.id, s]))

    // Process operations in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const processed: string[] = []

      for (const op of operations) {
        const shift = shiftMap.get(op.shiftId)!

        if (op.existingEntryId) {
          // Update existing entry
          if (op.userId === null) {
            // Remove assignment, make it an open shift
            await tx.scheduleEntry.update({
              where: { id: op.existingEntryId },
              data: {
                userId: null,
                isOpenShift: true
              }
            })
          } else {
            // Assign user
            await tx.scheduleEntry.update({
              where: { id: op.existingEntryId },
              data: {
                userId: op.userId,
                isOpenShift: false
              }
            })
          }
          processed.push(op.existingEntryId)
        } else {
          // Create new entry
          const entry = await tx.scheduleEntry.create({
            data: {
              facilityId: user.facilityId,
              shiftId: op.shiftId,
              userId: op.userId,
              date: new Date(op.date),
              startTime: shift.startTime,
              endTime: shift.endTime,
              isOpenShift: op.userId === null,
              status: 'DRAFT',
              createdById: user.id
            }
          })
          processed.push(entry.id)
        }
      }

      return processed
    })

    return NextResponse.json({
      success: true,
      processed: results.length
    })
  } catch (error) {
    console.error('Error processing bulk schedule operations:', error)
    return NextResponse.json(
      { error: 'Failed to process schedule updates' },
      { status: 500 }
    )
  }
}
