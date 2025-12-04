import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function IceDepthPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <ModulePlaceholder
      title="Ice Depth Tracking"
      description="Monitor and record ice thickness measurements across all rinks"
      icon="📏"
      features={[
        'Record ice depth measurements at multiple points',
        'Track measurements over time with historical charts',
        'Set minimum depth thresholds with alerts',
        'Export measurement reports for compliance',
        'Configure measurement schedules per rink',
        'Mobile-friendly data entry interface',
      ]}
    />
  )
}
