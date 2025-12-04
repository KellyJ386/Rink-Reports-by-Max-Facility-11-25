import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  Schedule,
  ScheduleWithShifts,
  CreateScheduleInput,
  ScheduleStatus,
  ScheduleFilters,
} from '@/types/schedule'

// In-memory storage for demo (replace with database in production)
const schedules = new Map<string, Schedule>()

// Initialize with sample data
function initSampleData() {
  if (schedules.size === 0) {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const sampleSchedule: Schedule = {
      id: 'schedule-1',
      facilityId: 'facility-1',
      name: 'Weekly Schedule - Week 1',
      description: 'Main rink operations schedule',
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      publishedBy: 'user-1',
      totalShifts: 21,
      filledShifts: 18,
      openShifts: 3,
      totalHours: 168,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
    }
    schedules.set(sampleSchedule.id, sampleSchedule)

    // Add another schedule
    const nextWeekStart = new Date(endOfWeek)
    nextWeekStart.setDate(endOfWeek.getDate() + 1)
    const nextWeekEnd = new Date(nextWeekStart)
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6)

    const draftSchedule: Schedule = {
      id: 'schedule-2',
      facilityId: 'facility-1',
      name: 'Weekly Schedule - Week 2',
      description: 'Next week schedule (draft)',
      startDate: nextWeekStart.toISOString().split('T')[0],
      endDate: nextWeekEnd.toISOString().split('T')[0],
      status: 'DRAFT',
      totalShifts: 14,
      filledShifts: 8,
      openShifts: 6,
      totalHours: 112,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
    }
    schedules.set(draftSchedule.id, draftSchedule)
  }
}

// GET /api/schedules - List all schedules with optional filters
export async function GET(request: NextRequest) {
  try {
    initSampleData()

    const { searchParams } = new URL(request.url)
    const facilityId = searchParams.get('facilityId')
    const status = searchParams.get('status') as ScheduleStatus | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let results = Array.from(schedules.values())

    // Apply filters
    if (facilityId) {
      results = results.filter((s) => s.facilityId === facilityId)
    }
    if (status) {
      results = results.filter((s) => s.status === status)
    }
    if (startDate) {
      results = results.filter((s) => s.startDate >= startDate)
    }
    if (endDate) {
      results = results.filter((s) => s.endDate <= endDate)
    }

    // Sort by start date descending
    results.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    return NextResponse.json({
      schedules: results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    initSampleData()

    const body: CreateScheduleInput & { facilityId?: string } = await request.json()

    // Validate required fields
    if (!body.name || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Validate date range
    if (new Date(body.startDate) > new Date(body.endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    const newSchedule: Schedule = {
      id: uuidv4(),
      facilityId: body.facilityId || 'facility-1',
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      status: 'DRAFT',
      totalShifts: 0,
      filledShifts: 0,
      openShifts: 0,
      totalHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1', // Would come from auth context
    }

    schedules.set(newSchedule.id, newSchedule)

    return NextResponse.json(newSchedule, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
