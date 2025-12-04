import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function ChecklistsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <ModulePlaceholder
      title="Daily Checklists"
      description="Manage and complete daily operational checklists"
      icon="✅"
      features={[
        'Customizable checklist templates',
        'Daily, weekly, and monthly checklists',
        'Mobile-friendly completion interface',
        'Photo documentation for items',
        'Supervisor review and approval workflow',
        'Completion tracking and reminders',
      ]}
    />
  )
}
