import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function RefrigerationPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'refrigeration', 'access')) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refrigeration</h1>
          <p className="text-gray-600 mt-1">Monitor refrigeration system readings</p>
        </div>
        <button className="btn btn-primary">New Reading</button>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❄️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Refrigeration Module</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Record and monitor your refrigeration system parameters.
            Custom fields allow adaptation to any refrigeration setup.
          </p>
          <p className="text-sm text-blue-600 mt-4">Coming in Phase 5</p>
        </div>
      </div>
    </div>
  )
}
