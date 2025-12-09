import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import Header from '@/components/layout/Header'

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
    <div className="min-h-screen bg-gray-50">
      <Header user={userData} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
