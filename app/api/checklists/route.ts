import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const DEFAULT_CHECKLISTS = {
  'Opening Checklist': [
    { id: 'lights', label: 'Turn on all lights', required: true },
    { id: 'hvac', label: 'Check HVAC system', required: true },
    { id: 'ice_inspect', label: 'Inspect ice surface', required: true },
    { id: 'boards', label: 'Check boards and glass', required: true },
    { id: 'goals', label: 'Set up goals', required: false },
    { id: 'benches', label: 'Clean benches', required: false },
    { id: 'zamboni', label: 'Check Zamboni fuel/water', required: true },
    { id: 'first_aid', label: 'Verify first aid kit', required: true },
    { id: 'exits', label: 'Check emergency exits', required: true },
    { id: 'temp', label: 'Record building temperature', required: false }
  ],
  'Closing Checklist': [
    { id: 'resurface', label: 'Final ice resurface', required: true },
    { id: 'lights_off', label: 'Turn off rink lights', required: true },
    { id: 'hvac_adjust', label: 'Adjust HVAC for overnight', required: true },
    { id: 'locker_check', label: 'Check locker rooms empty', required: true },
    { id: 'trash', label: 'Empty trash bins', required: false },
    { id: 'doors_locked', label: 'Lock all doors', required: true },
    { id: 'alarm', label: 'Set alarm system', required: true },
    { id: 'equipment', label: 'Secure equipment room', required: true }
  ],
  'Maintenance Checklist': [
    { id: 'compressor', label: 'Check compressor readings', required: true },
    { id: 'brine', label: 'Check brine levels', required: true },
    { id: 'filters', label: 'Inspect air filters', required: false },
    { id: 'dehumidifier', label: 'Check dehumidifier', required: false },
    { id: 'edger', label: 'Sharpen edger blades', required: false },
    { id: 'zamboni_maint', label: 'Zamboni maintenance check', required: false },
    { id: 'boards_repair', label: 'Inspect boards for damage', required: false },
    { id: 'lighting', label: 'Check all lighting', required: false }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rinkId = searchParams.get('rinkId')
    const checklistType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const facilityId = session.facilityId

    const where: Record<string, unknown> = {
      formTemplate: {
        facilityId,
        moduleType: 'DAILY_CHECKLIST'
      },
      archivedAt: null
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (checklistType) {
      where.formTemplate = {
        ...(where.formTemplate as object),
        name: checklistType
      }
    }

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        (where.submittedAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999);
        (where.submittedAt as Record<string, Date>).lte = end
      }
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        formTemplate: { select: { id: true, name: true } }
      },
      orderBy: { submittedAt: 'desc' },
      take: 100
    })

    const rinks = await prisma.rink.findMany({
      where: { facilityId, isActive: true },
      select: { id: true, name: true }
    })

    return NextResponse.json({
      submissions,
      rinks,
      checklistTypes: Object.keys(DEFAULT_CHECKLISTS)
    })
  } catch (error) {
    console.error('Checklists error:', error)
    return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rinkId, checklistType, items, notes } = body

    if (!rinkId || !checklistType || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const facilityId = session.facilityId

    let template = await prisma.formTemplate.findFirst({
      where: {
        facilityId,
        moduleType: 'DAILY_CHECKLIST',
        name: checklistType
      }
    })

    const defaultItems = DEFAULT_CHECKLISTS[checklistType as keyof typeof DEFAULT_CHECKLISTS] || []

    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          facilityId,
          moduleType: 'DAILY_CHECKLIST',
          name: checklistType,
          createdBy: session.id,
          schema: {
            fields: defaultItems.map(item => ({
              id: item.id,
              type: 'checkbox',
              label: item.label,
              required: item.required
            }))
          }
        }
      })
    }

    // Calculate completion stats
    const totalItems = Object.keys(items).length
    const completedItems = Object.values(items).filter(v => v === true).length
    const completionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    const submission = await prisma.submission.create({
      data: {
        formTemplateId: template.id,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: session.id,
        data: {
          checklistType,
          items,
          notes,
          completedItems,
          totalItems,
          completionPercent
        },
        status: 'SUBMITTED'
      },
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Checklists create error:', error)
    return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 })
  }
}
