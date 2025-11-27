import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function IceDepthPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'iceDepth', 'access')) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ice Depth</h1>
          <p className="text-gray-600 mt-1">Track ice thickness at measurement points</p>
        </div>
        <button className="btn btn-primary">New Reading</button>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📏</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ice Depth Module</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            This module will allow you to record ice depth measurements across your rink.
            Configure measurement points and track ice thickness over time.
          </p>
          <p className="text-sm text-blue-600 mt-4">Coming in Phase 4</p>
        </div>
      </div>
    </div>
  )
}
