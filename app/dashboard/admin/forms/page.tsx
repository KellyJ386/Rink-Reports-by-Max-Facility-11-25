import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

export default async function FormsListPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const permissions = getUserPermissions(user)

  if (!permissions.admin?.createTemplates) {
    redirect('/dashboard/admin')
  }

  const templates = await prisma.formTemplate.findMany({
    where: {
      facilityId: user.facilityId,
    },
    orderBy: [{ moduleType: 'asc' }, { updatedAt: 'desc' }],
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  })

  // Group templates by module type
  type TemplateWithCount = typeof templates[number]
  const groupedTemplates = templates.reduce<Record<string, TemplateWithCount[]>>(
    (acc, template) => {
      const module = template.moduleType
      if (!acc[module]) {
        acc[module] = []
      }
      acc[module].push(template)
      return acc
    },
    {}
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage custom forms for each module
          </p>
        </div>
        <Link
          href="/dashboard/admin/forms/new"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Form Templates Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first form template to start customizing your reports
          </p>
          <Link
            href="/dashboard/admin/forms/new"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([moduleType, moduleTemplates]) => (
            <div key={moduleType}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {MODULE_LABELS[moduleType] || moduleType}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/dashboard/admin/forms/${template.id}`}
                    className="card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      {template.isLocked && (
                        <span className="text-gray-400" title="Locked">
                          🔒
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span>v{template.version}</span>
                      <span>
                        {template._count.submissions} submission
                        {template._count.submissions !== 1 ? 's' : ''}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded ${
                          template.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
