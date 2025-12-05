import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { SubmissionsList } from '@/components/reports'

export default async function ChecklistsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const canViewOwn = canUserAccess(user, 'dailyChecklist', 'viewOwn')
  const canViewAll = canUserAccess(user, 'dailyChecklist', 'viewAll')

  if (!canViewOwn && !canViewAll) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Daily Checklists</h1>
        <p className="text-gray-600 mt-1">
          Complete and track daily operational checklists for facility maintenance
        </p>
      </div>

      <SubmissionsList
        moduleType="DAILY_CHECKLIST"
        baseUrl="/dashboard/checklists"
        title="Daily Checklists"
      />
    </div>
  )
}
