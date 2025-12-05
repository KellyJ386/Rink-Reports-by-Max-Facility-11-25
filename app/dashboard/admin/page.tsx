import Link from 'next/link'

export default function AdminPage() {
  const quickActions = [
    {
      title: 'Create Form Template',
      description: 'Build a new custom form for data collection',
      href: '/dashboard/admin/forms/new',
      icon: '📝',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove user accounts',
      href: '/dashboard/admin/users',
      icon: '👥',
      color: 'bg-green-500'
    },
    {
      title: 'Facility Settings',
      description: 'Configure facility-wide settings',
      href: '/dashboard/admin/settings',
      icon: '⚙️',
      color: 'bg-purple-500'
    }
  ]

  const stats = [
    { label: 'Active Forms', value: '7', change: '+2 this month' },
    { label: 'Total Submissions', value: '1,234', change: '+156 this week' },
    { label: 'Active Users', value: '12', change: '3 online now' },
    { label: 'Pending Reviews', value: '5', change: '2 urgent' }
  ]

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
              {action.icon}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 text-center text-gray-500">
          <p>Activity log will appear here once forms are created and submissions are received.</p>
        </div>
      </div>
    </div>
  )
}
