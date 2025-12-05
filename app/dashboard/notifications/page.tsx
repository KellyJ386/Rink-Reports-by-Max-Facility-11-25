import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { NotificationCenter } from '@/components/notifications'

export default async function NotificationsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return <NotificationCenter />
}
