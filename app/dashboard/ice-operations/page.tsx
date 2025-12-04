import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function IceOperationsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <ModulePlaceholder
      title="Ice Operations"
      description="Manage ice resurfacing, cuts, and maintenance activities"
      icon="🧊"
      features={[
        'Log ice resurfacing activities (cuts)',
        'Track water temperature and volume used',
        'Monitor blade sharpness and maintenance',
        'Schedule resurfaces based on events',
        'Calculate ice quality metrics',
        'Integration with facility schedule',
      ]}
    />
  )
}
