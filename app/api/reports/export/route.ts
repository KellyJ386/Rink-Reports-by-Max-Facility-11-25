import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('type') || 'ice-depth'

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)

    const facilityId = session.facilityId

    let csvContent = ''
    let filename = ''

    switch (reportType) {
      case 'ice-depth': {
        const readings = await prisma.iceDepthReading.findMany({
          where: {
            rink: { facilityId },
            recordedAt: { gte: start, lte: end },
            archivedAt: null
          },
          include: {
            rink: { select: { name: true } },
            recordedBy: { select: { firstName: true, lastName: true } }
          },
          orderBy: { recordedAt: 'desc' }
        })

        csvContent = 'Date,Time,Rink,Recorded By,Target Depth,Avg Depth,Min Depth,Max Depth,Below Target,Above Target,Notes\n'
        for (const r of readings) {
          const date = new Date(r.recordedAt)
          csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},`
          csvContent += `"${r.rink.name}",`
          csvContent += `"${r.recordedBy.firstName} ${r.recordedBy.lastName}",`
          csvContent += `${r.targetDepth},${r.averageDepth.toFixed(3)},${r.minDepth.toFixed(3)},${r.maxDepth.toFixed(3)},`
          csvContent += `${r.pointsBelowTarget},${r.pointsAboveTarget},`
          csvContent += `"${(r.notes || '').replace(/"/g, '""')}"\n`
        }
        filename = `ice-depth-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`
        break
      }

      case 'schedule': {
        const entries = await prisma.scheduleEntry.findMany({
          where: {
            facilityId,
            date: { gte: start, lte: end }
          },
          include: {
            user: { select: { firstName: true, lastName: true } },
            rink: { select: { name: true } },
            shift: { select: { name: true } }
          },
          orderBy: { date: 'asc' }
        })

        csvContent = 'Date,Shift,Rink,Employee,Start Time,End Time,Status,Open Shift,Emergency,Notes\n'
        for (const e of entries) {
          const date = new Date(e.date)
          csvContent += `${date.toLocaleDateString()},`
          csvContent += `"${e.shift?.name || 'Custom'}",`
          csvContent += `"${e.rink?.name || 'All Rinks'}",`
          csvContent += `"${e.user ? `${e.user.firstName} ${e.user.lastName}` : 'Unassigned'}",`
          csvContent += `${e.startTime},${e.endTime},`
          csvContent += `${e.status},${e.isOpenShift ? 'Yes' : 'No'},${e.isEmergency ? 'Yes' : 'No'},`
          csvContent += `"${(e.notes || '').replace(/"/g, '""')}"\n`
        }
        filename = `schedule-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`
        break
      }

      case 'incidents': {
        const incidents = await prisma.submission.findMany({
          where: {
            formTemplate: { facilityId, moduleType: 'INCIDENT' },
            submittedAt: { gte: start, lte: end },
            archivedAt: null
          },
          include: {
            submittedBy: { select: { firstName: true, lastName: true } },
            rink: { select: { name: true } },
            formTemplate: { select: { name: true } }
          },
          orderBy: { submittedAt: 'desc' }
        })

        csvContent = 'Date,Time,Rink,Reported By,Form,Status,Review Notes\n'
        for (const i of incidents) {
          const date = new Date(i.submittedAt)
          csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},`
          csvContent += `"${i.rink.name}",`
          csvContent += `"${i.submittedBy.firstName} ${i.submittedBy.lastName}",`
          csvContent += `"${i.formTemplate.name}",`
          csvContent += `${i.status},`
          csvContent += `"${(i.reviewNotes || '').replace(/"/g, '""')}"\n`
        }
        filename = `incident-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`
        break
      }

      case 'submissions': {
        const submissions = await prisma.submission.findMany({
          where: {
            formTemplate: { facilityId },
            submittedAt: { gte: start, lte: end },
            archivedAt: null
          },
          include: {
            submittedBy: { select: { firstName: true, lastName: true } },
            rink: { select: { name: true } },
            formTemplate: { select: { name: true, moduleType: true } }
          },
          orderBy: { submittedAt: 'desc' }
        })

        csvContent = 'Date,Time,Module,Form,Rink,Submitted By,Status\n'
        for (const s of submissions) {
          const date = new Date(s.submittedAt)
          csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},`
          csvContent += `${s.formTemplate.moduleType},`
          csvContent += `"${s.formTemplate.name}",`
          csvContent += `"${s.rink.name}",`
          csvContent += `"${s.submittedBy.firstName} ${s.submittedBy.lastName}",`
          csvContent += `${s.status}\n`
        }
        filename = `submissions-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`
        break
      }

      case 'users': {
        const users = await prisma.user.findMany({
          where: {
            facilityId,
            isActive: true
          },
          include: {
            role: { select: { name: true } }
          },
          orderBy: { lastName: 'asc' }
        })

        csvContent = 'Name,Email,Phone,Role,Last Login,Created At\n'
        for (const u of users) {
          csvContent += `"${u.firstName} ${u.lastName}",`
          csvContent += `${u.email},`
          csvContent += `${u.phone || 'N/A'},`
          csvContent += `"${u.role.name}",`
          csvContent += `${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'},`
          csvContent += `${new Date(u.createdAt).toLocaleDateString()}\n`
        }
        filename = `users-report-${new Date().toISOString().split('T')[0]}.csv`
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}
