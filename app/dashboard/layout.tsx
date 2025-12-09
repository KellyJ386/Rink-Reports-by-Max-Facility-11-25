import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import DashboardHeader from '@/components/layout/DashboardHeader'
import OfflineIndicator from '@/components/layout/OfflineIndicator'

// Force dynamic rendering - this layout requires database access
export const dynamic = 'force-dynamic'

export const dynamic = 'force-dynamic'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const permissions = getUserPermissions(user)

  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: {
      name: user.role.name,
    },
    facility: {
      name: user.facility.name,
    },
    permissions,
  }

  return (
    <div className="min-h-screen bg-grey-50">
      <DashboardHeader user={userData} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <OfflineIndicator />
    </div>
  )
}
