'use client'

interface StatsCardProps {
  title: string
  value: number | string | null
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  href?: string
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-600',
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'bg-gray-100 text-gray-600',
    text: 'text-gray-600',
  },
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  href,
}: StatsCardProps) {
  const styles = colorStyles[color]

  const Content = (
    <div className={`card p-6 ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {value ?? '-'}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <svg
                className={`w-4 h-4 ${trend.isPositive ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{Math.abs(trend.value)}% from last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${styles.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href}>{Content}</a>
  }

  return Content
}

export function StatsCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
          <div className="h-3 w-32 bg-gray-200 rounded mt-2" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}
