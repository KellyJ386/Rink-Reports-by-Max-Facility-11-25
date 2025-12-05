'use client'

interface TrendChartProps {
  data: {
    label: string
    value: number
  }[]
  title?: string
  color?: string
}

export function TrendChart({ data, title, color = '#3B82F6' }: TrendChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="card p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-700">{item.value}</span>
              <div className="w-full bg-gray-100 rounded-t-sm relative" style={{ height: '100px' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ModuleChartProps {
  data: Record<string, number>
  title?: string
}

const moduleColors: Record<string, string> = {
  ICE_DEPTH: '#3B82F6',
  ICE_OPERATIONS: '#10B981',
  REFRIGERATION: '#6366F1',
  AIR_QUALITY: '#F59E0B',
  INCIDENT: '#EF4444',
  SCHEDULE: '#8B5CF6',
  DAILY_CHECKLIST: '#14B8A6',
}

const moduleLabels: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Ops',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incidents',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Checklists',
}

export function ModuleChart({ data, title }: ModuleChartProps) {
  const entries = Object.entries(data).filter(([, value]) => value > 0)
  const total = entries.reduce((sum, [, value]) => sum + value, 0)

  if (entries.length === 0) {
    return (
      <div className="card p-6">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        <div className="text-center text-gray-500 py-8">
          No submissions this month
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      {/* Horizontal bar chart */}
      <div className="space-y-3">
        {entries.map(([module, value]) => {
          const percentage = (value / total) * 100
          return (
            <div key={module}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {moduleLabels[module] || module}
                </span>
                <span className="text-gray-500">{value}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: moduleColors[module] || '#6B7280',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
        <span className="text-gray-500">Total this month</span>
        <span className="font-semibold text-gray-900">{total}</span>
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="flex items-end justify-between gap-2 h-32">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="h-3 w-4 bg-gray-200 rounded" />
            <div className="w-full bg-gray-200 rounded-t-sm" style={{ height: `${20 + Math.random() * 60}%` }} />
            <div className="h-3 w-6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
