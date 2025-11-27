import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function IceOperationsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'iceOperations', 'access')) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ice Operations</h1>
          <p className="text-gray-600 mt-1">Ice makes, circle checks, edging, and blade changes</p>
        </div>
        <button className="btn btn-primary">New Entry</button>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ice Operations Module</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Log all ice maintenance operations including resurfaces, circle checks,
            edging work, and blade changes. Track operator activities and timing.
          </p>
          <p className="text-sm text-blue-600 mt-4">Coming in Phase 4</p>
        </div>
      </div>
    </div>
  )
}
