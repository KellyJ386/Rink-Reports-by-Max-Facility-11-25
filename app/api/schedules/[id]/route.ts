import { NextRequest, NextResponse } from 'next/server'
import { Schedule, ScheduleStatus } from '@/types/schedule'

// In-memory storage reference (shared with parent route in production would use DB)
const schedules = new Map<string, Schedule>()

// GET /api/schedules/[id] - Get a single schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schedule = schedules.get(id)

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PATCH /api/schedules/[id] - Update a schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schedule = schedules.get(id)

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate date range if dates are being updated
    if (body.startDate || body.endDate) {
      const startDate = body.startDate || schedule.startDate
      const endDate = body.endDate || schedule.endDate
      if (new Date(startDate) > new Date(endDate)) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        )
      }
    }

    const updatedSchedule: Schedule = {
      ...schedule,
      ...body,
      id: schedule.id, // Prevent ID changes
      createdAt: schedule.createdAt, // Prevent createdAt changes
      updatedAt: new Date().toISOString(),
    }

    schedules.set(id, updatedSchedule)

    return NextResponse.json(updatedSchedule)
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schedule = schedules.get(id)

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Only allow deleting draft schedules
    if (schedule.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot delete a published schedule. Archive it instead.' },
        { status: 400 }
      )
    }

    schedules.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
