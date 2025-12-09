'use client'

import Link from 'next/link'

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
  description?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

interface QuickActionsProps {
  actions: QuickAction[]
  title?: string
}

const colorStyles = {
  blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
  green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
  yellow: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
  red: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
  purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
}

export function QuickActions({ actions, title = 'Quick Actions' }: QuickActionsProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`p-4 rounded-lg border transition-colors ${colorStyles[action.color || 'blue']}`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="text-2xl">{action.icon}</div>
              <span className="font-medium text-sm">{action.label}</span>
              {action.description && (
                <span className="text-xs opacity-75">{action.description}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
