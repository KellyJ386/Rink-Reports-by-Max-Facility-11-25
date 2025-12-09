import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import Sidebar from '@/components/layout/Sidebar'

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={userData} />
      <main className="flex-1 overflow-y-auto ml-64">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
