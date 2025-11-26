import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { PageHeader, StatusBadge } from '@/components/shared'
import { UniversalHeaderView } from '@/components/forms'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChecklistDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'DAILY_CHECKLIST',
      },
    },
    include: {
      rink: true,
      submittedBy: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  if (!submission) notFound()

  const data = submission.data as any
  const items = data.items || []
  const completedCount = items.filter((i: any) => i.checked).length
  const totalCount = items.length
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const typeLabels: Record<string, string> = {
    opening: 'Opening Checklist',
    closing: 'Closing Checklist',
    shift_change: 'Shift Change Checklist',
  }

  return (
    <div>
      <PageHeader
        title={typeLabels[data.checklistType] || 'Daily Checklist'}
        backHref="/dashboard/checklists"
        backLabel="Back to Checklists"
        actions={<StatusBadge status={submission.status} size="md" />}
      />

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <UniversalHeaderView
          rinkName={submission.rink.name}
          submittedAt={submission.submittedAt}
          outsideTemp={submission.outsideTemp ?? undefined}
          outsideTempUnit={submission.outsideTempUnit}
          submittedBy={`${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`}
        />

        {/* Completion Summary */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Completion Status</span>
            <span className={`font-semibold ${completionPct === 100 ? 'text-green-600' : 'text-blue-600'}`}>
              {completedCount} of {totalCount} items ({completionPct}%)
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${completionPct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Checklist Items</h3>
          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div
                key={item.id || index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  item.checked ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span className={`mt-0.5 text-lg ${item.checked ? 'text-green-600' : 'text-red-400'}`}>
                  {item.checked ? '✓' : '○'}
                </span>
                <div className="flex-1">
                  <p className={`font-medium ${item.checked ? 'text-green-800' : 'text-red-800'}`}>
                    {item.label}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incomplete Items Warning */}
        {completionPct < 100 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">
              ⚠️ {totalCount - completedCount} item(s) not completed
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {items
                .filter((i: any) => !i.checked)
                .map((item: any, index: number) => (
                  <li key={index}>{item.label}</li>
                ))}
            </ul>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-6 text-xs text-gray-400">
          <p>Submission ID: {submission.id}</p>
        </div>
      </div>
    </div>
  )
}
