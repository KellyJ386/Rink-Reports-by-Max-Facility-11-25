import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function RefrigerationPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <ModulePlaceholder
      title="Refrigeration Monitoring"
      description="Track refrigeration system performance and maintenance"
      icon="❄️"
      features={[
        'Real-time temperature monitoring',
        'Compressor status and runtime tracking',
        'Energy consumption analytics',
        'Maintenance schedule management',
        'Alert thresholds for temperature deviations',
        'Historical performance reports',
      ]}
    />
  )
}
