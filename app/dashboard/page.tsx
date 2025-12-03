import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

const moduleConfig = [
  {
    id: 'iceDepth',
    name: 'Ice Depth',
    description: 'Measure and track ice thickness',
    href: '/dashboard/ice-depth',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19.5h18M3 15l3-3 3 3 3-3 3 3 3-3 3 3M12 3v9" />
      </svg>
    ),
    color: 'bg-blue-500',
  },
  {
    id: 'iceOperations',
    name: 'Ice Operations',
    description: 'Daily ice maintenance logs',
    href: '/dashboard/ice-operations',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    color: 'bg-cyan-500',
  },
  {
    id: 'refrigeration',
    name: 'Refrigeration',
    description: 'Monitor refrigeration systems',
    href: '/dashboard/refrigeration',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
    color: 'bg-indigo-500',
  },
  {
    id: 'airQuality',
    name: 'Air Quality',
    description: 'CO and NO2 monitoring',
    href: '/dashboard/air-quality',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    color: 'bg-teal-500',
  },
  {
    id: 'incidents',
    name: 'Incidents',
    description: 'Report and track incidents',
    href: '/dashboard/incidents',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
    color: 'bg-red-500',
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Employee scheduling',
    href: '/dashboard/schedule',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    color: 'bg-action',
  },
  {
    id: 'dailyChecklist',
    name: 'Checklists',
    description: 'Daily operational checklists',
    href: '/dashboard/checklists',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    color: 'bg-emerald-500',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'System administration',
    href: '/dashboard/admin',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    color: 'bg-grey-600',
  },
]

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    return null
  }

  const permissions = getUserPermissions(user)

  // Filter modules based on user permissions
  const accessibleModules = moduleConfig.filter((module) => {
    const modulePermission = permissions[module.id as keyof typeof permissions]
    return modulePermission?.access === true
  })

  return (
    <div>
      {/* Welcome Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-navy mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-grey-600 text-lg">
          {user.facility.name} &bull; {user.role.name}
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {accessibleModules.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="module-btn bg-white border-grey-200 hover:border-action group"
          >
            <div className={`${module.color} text-white p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
              {module.icon}
            </div>
            <h3 className="text-xl font-bold text-navy mb-1">{module.name}</h3>
            <p className="text-sm text-grey-500 text-center">{module.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-navy text-white">
          <h3 className="text-lg font-semibold mb-2 text-grey-300">Today's Activity</h3>
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm text-grey-400 mt-1">Reports submitted</p>
        </div>
        <div className="card bg-action text-white">
          <h3 className="text-lg font-semibold mb-2 text-action-100">Pending</h3>
          <p className="text-3xl font-bold">--</p>
          <p className="text-sm text-action-100 mt-1">Items need attention</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2 text-grey-600">This Week</h3>
          <p className="text-3xl font-bold text-navy">--</p>
          <p className="text-sm text-grey-500 mt-1">Total submissions</p>
        </div>
      </div>
    </div>
  )
}
