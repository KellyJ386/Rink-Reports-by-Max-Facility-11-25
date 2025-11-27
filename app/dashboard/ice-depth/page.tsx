import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canUserAccess } from '@/lib/permissions'
import IceDepthClient from './IceDepthClient'

export const dynamic = 'force-dynamic'

export default async function IceDepthPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'iceDepth', 'access')) {
    redirect('/dashboard')
  }

  const canSubmit = canUserAccess(user, 'iceDepth', 'submit')

  return <IceDepthClient canSubmit={canSubmit} />
}
