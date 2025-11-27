'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  version: number
  isActive: boolean
  isLocked: boolean
  updatedAt: string
  _count: { submissions: number }
}

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incidents',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

const MODULE_COLORS: Record<string, string> = {
  ICE_DEPTH: 'bg-blue-100 text-blue-800',
  ICE_OPERATIONS: 'bg-cyan-100 text-cyan-800',
  REFRIGERATION: 'bg-indigo-100 text-indigo-800',
  AIR_QUALITY: 'bg-green-100 text-green-800',
  INCIDENT: 'bg-red-100 text-red-800',
  SCHEDULE: 'bg-purple-100 text-purple-800',
  DAILY_CHECKLIST: 'bg-yellow-100 text-yellow-800',
}

export default function FormsListPage() {
  const router = useRouter()
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [canCreateForms, setCanCreateForms] = useState(false)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [formsRes, meRes] = await Promise.all([
        fetch('/api/forms'),
        fetch('/api/auth/me'),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()
      setCanCreateForms(meData.user?.role?.permissions?.admin?.createTemplates || false)

      if (formsRes.ok) {
        const formsData = await formsRes.json()
        setForms(formsData.forms || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter forms based on search and module filter
  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      !search ||
      form.name.toLowerCase().includes(search.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(search.toLowerCase()))

    const matchesModule = !moduleFilter || form.moduleType === moduleFilter

    return matchesSearch && matchesModule
  })

  // Group filtered forms by module
  const formsByModule: Record<string, FormTemplate[]> = {}
  for (const form of filteredForms) {
    const module = form.moduleType
    if (!formsByModule[module]) {
      formsByModule[module] = []
    }
    formsByModule[module].push(form)
  }

  // Get unique modules for filter dropdown
  const uniqueModules = Array.from(new Set(forms.map((f) => f.moduleType))).sort()

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Form Templates</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredForms.length} of {forms.length} template{forms.length !== 1 ? 's' : ''} across {Object.keys(formsByModule).length} module{Object.keys(formsByModule).length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreateForms && (
          <Link
            href="/dashboard/admin/forms/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Form
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      {forms.length > 0 && (
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search forms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="w-48">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Modules</option>
                {uniqueModules.map((module) => (
                  <option key={module} value={module}>
                    {MODULE_LABELS[module] || module}
                  </option>
                ))}
              </select>
            </div>
            {(search || moduleFilter) && (
              <button
                onClick={() => {
                  setSearch('')
                  setModuleFilter('')
                }}
                className="btn btn-secondary text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No form templates yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first form template to start collecting data.
          </p>
          {canCreateForms && (
            <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
              Create First Form
            </Link>
          )}
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          No forms match your filters
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(formsByModule).map(([moduleType, moduleForms]) => (
            <div key={moduleType}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${MODULE_COLORS[moduleType] || 'bg-gray-100 text-gray-800'}`}>
                  {MODULE_LABELS[moduleType] || moduleType}
                </span>
                <span className="text-sm text-gray-500">
                  {moduleForms.length} form{moduleForms.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {moduleForms.map((form) => (
                  <Link
                    key={form.id}
                    href={`/dashboard/admin/forms/${form.id}`}
                    className="card hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                        {form.name}
                      </h3>
                      <span className="text-xs text-gray-400">v{form.version}</span>
                    </div>
                    {form.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{form._count.submissions} submission{form._count.submissions !== 1 ? 's' : ''}</span>
                      <span>Updated {new Date(form.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {form.isLocked && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Locked (compliance)
                      </div>
                    )}
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
