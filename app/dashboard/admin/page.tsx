import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/shared'

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Get counts for dashboard
  const [userCount, roleCount, templateCount, facilitySettings] = await Promise.all([
    prisma.user.count({
      where: { facilityId: session.user.facilityId },
    }),
    prisma.role.count({
      where: {
        OR: [
          { facilityId: session.user.facilityId },
          { isSystemDefault: true },
        ],
      },
    }),
    prisma.formTemplate.count({
      where: { facilityId: session.user.facilityId, isActive: true },
    }),
    prisma.facilitySettings.findUnique({
      where: { facilityId: session.user.facilityId },
    }),
  ])

  const adminCards = [
    {
      title: 'Users',
      description: 'Manage user accounts and permissions',
      icon: '👥',
      href: '/dashboard/admin/users',
      count: userCount,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Roles',
      description: 'Configure roles and permissions',
      icon: '🔐',
      href: '/dashboard/admin/roles',
      count: roleCount,
      color: 'bg-purple-50 border-purple-200',
    },
    {
      title: 'Form Templates',
      description: 'Build and manage form templates',
      icon: '📝',
      href: '/dashboard/admin/forms',
      count: templateCount,
      color: 'bg-green-50 border-green-200',
    },
    {
      title: 'Facility Settings',
      description: 'Configure facility preferences',
      icon: '⚙️',
      href: '/dashboard/admin/settings',
      count: null,
      color: 'bg-orange-50 border-orange-200',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Manage users, roles, forms, and facility settings"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={`block p-6 rounded-lg border-2 hover:shadow-md transition-shadow ${card.color}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{card.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              </div>
              {card.count !== null && (
                <span className="text-3xl font-bold text-gray-400">{card.count}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Facility Overview</h2>
        <div className="bg-white rounded-lg border p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Facility Name</p>
              <p className="font-semibold">{session.user.facility.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="font-semibold">{userCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Form Templates</p>
              <p className="font-semibold">{templateCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Settings Configured</p>
              <p className="font-semibold">{facilitySettings ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
