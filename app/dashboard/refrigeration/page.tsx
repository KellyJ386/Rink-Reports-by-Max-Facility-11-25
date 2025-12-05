import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { SubmissionsList } from '@/components/reports'

export default async function RefrigerationPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const canViewOwn = canUserAccess(user, 'refrigeration', 'viewOwn')
  const canViewAll = canUserAccess(user, 'refrigeration', 'viewAll')

  if (!canViewOwn && !canViewAll) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Refrigeration Logs</h1>
        <p className="text-gray-600 mt-1">
          Monitor compressor readings, temperatures, and refrigeration system status
        </p>
      </div>

      <SubmissionsList
        moduleType="REFRIGERATION"
        baseUrl="/dashboard/refrigeration"
        title="Refrigeration Reports"
      />
    </div>
  )
}
