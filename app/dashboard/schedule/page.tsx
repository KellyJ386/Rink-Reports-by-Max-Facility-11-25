import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function SchedulePage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <ModulePlaceholder
      title="Schedule Management"
      description="Manage facility schedules, staff shifts, and event bookings"
      icon="📅"
      features={[
        'Visual calendar for all rinks',
        'Staff shift scheduling and management',
        'Event and booking management',
        'Conflict detection and resolution',
        'Recurring schedule templates',
        'Integration with ice operations',
      ]}
    />
  )
}
