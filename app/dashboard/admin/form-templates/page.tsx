import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function FormTemplatesPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const permissions = getUserPermissions(user)

  if (!permissions.admin?.access || !permissions.admin?.editForms) {
    redirect('/dashboard')
  }

  // Fetch templates
  const templates = await prisma.formTemplate.findMany({
    where: {
      facilityId: user.facilityId,
    },
    orderBy: [
      { moduleType: 'asc' },
      { name: 'asc' },
    ],
  })

  // Group by module type
  const groupedTemplates = templates.reduce((acc, template) => {
    const key = template.moduleType
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(template)
    return acc
  }, {} as Record<string, typeof templates>)

  const moduleLabels: Record<string, { label: string; icon: string }> = {
    ICE_DEPTH: { label: 'Ice Depth', icon: '📏' },
    ICE_OPERATIONS: { label: 'Ice Operations', icon: '🏒' },
    REFRIGERATION: { label: 'Refrigeration', icon: '❄️' },
    AIR_QUALITY: { label: 'Air Quality', icon: '🌡️' },
    INCIDENT: { label: 'Incidents', icon: '⚠️' },
    SCHEDULE: { label: 'Schedule', icon: '📅' },
    DAILY_CHECKLIST: { label: 'Daily Checklist', icon: '✓' },
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/admin" className="hover:text-blue-600">
              Admin
            </Link>
            <span>/</span>
            <span>Form Templates</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage form templates for all modules
          </p>
        </div>
        <Link
          href="/dashboard/admin/form-templates/new"
          className="btn btn-primary"
        >
          + New Template
        </Link>
      </div>

      {/* Templates by Module */}
      {Object.entries(moduleLabels).map(([moduleType, { label, icon }]) => {
        const moduleTemplates = groupedTemplates[moduleType] || []

        return (
          <div key={moduleType} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>{icon}</span>
              {label}
              <span className="text-sm font-normal text-gray-500">
                ({moduleTemplates.length})
              </span>
            </h2>

            {moduleTemplates.length === 0 ? (
              <div className="card bg-gray-50 text-center py-6">
                <p className="text-gray-500 text-sm">
                  No templates yet.{' '}
                  <Link
                    href={`/dashboard/admin/form-templates/new?module=${moduleType}`}
                    className="text-blue-600 hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {moduleTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/dashboard/admin/form-templates/${template.id}`}
                    className="card block hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {template.name}
                          {!template.isActive && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                          {template.isLocked && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                              Locked
                            </span>
                          )}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>v{template.version}</div>
                        <div>
                          Updated {new Date(template.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
