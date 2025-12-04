import Link from 'next/link'

interface ModulePlaceholderProps {
  title: string
  description: string
  icon: string
  features: string[]
  phase?: string
}

export default function ModulePlaceholder({
  title,
  description,
  icon,
  features,
  phase = 'Phase 2',
}: ModulePlaceholderProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="text-6xl mb-4 block">{icon}</span>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            {phase}
          </span>
          <span className="text-gray-500 text-sm">Coming Soon</span>
        </div>

        <h2 className="text-lg font-semibold mb-3">Planned Features</h2>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-gray-400 mt-1">○</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Module Status</h3>
        <p className="text-blue-800 text-sm mb-4">
          This module is part of the development roadmap. The route is properly configured
          and ready for implementation.
        </p>
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="btn btn-secondary text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
