import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function AirQualityPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <ModulePlaceholder
      title="Air Quality Monitoring"
      description="Monitor CO, NO2, and other air quality metrics for safety compliance"
      icon="💨"
      features={[
        'Real-time air quality sensor readings',
        'CO and NO2 level monitoring',
        'Automatic alerts when levels exceed thresholds',
        'Compliance reporting for safety standards',
        'Historical trend analysis',
        'Integration with ventilation systems',
      ]}
    />
  )
}
