import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function IncidentsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <ModulePlaceholder
      title="Incident Reports"
      description="Document and track facility incidents, injuries, and safety concerns"
      icon="⚠️"
      features={[
        'Quick incident report submission',
        'Photo and document attachments',
        'Incident categorization and severity levels',
        'Follow-up action tracking',
        'Notification workflows for management',
        'Compliance and insurance reporting',
      ]}
    />
  )
}
