'use client'

interface ChartItem {
  label: string
  value: number
  color?: string
}

interface DistributionChartProps {
  data: ChartItem[]
  title: string
  type?: 'bar' | 'donut'
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

export default function DistributionChart({
  data,
  title,
  type = 'bar',
}: DistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32 text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  if (type === 'donut') {
    // Calculate donut segments
    let cumulativePercent = 0
    const segments = data.map((item, i) => {
      const percent = total > 0 ? (item.value / total) * 100 : 0
      const segment = {
        ...item,
        percent,
        color: item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        startAngle: cumulativePercent * 3.6, // Convert % to degrees
        endAngle: (cumulativePercent + percent) * 3.6,
      }
      cumulativePercent += percent
      return segment
    })

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>

        <div className="flex items-center gap-6">
          {/* Donut chart */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {segments.map((segment, i) => {
                const startAngle = (segments.slice(0, i).reduce((sum, s) => sum + s.percent, 0) / 100) * Math.PI * 2
                const endAngle = startAngle + (segment.percent / 100) * Math.PI * 2

                const x1 = 50 + 40 * Math.cos(startAngle)
                const y1 = 50 + 40 * Math.sin(startAngle)
                const x2 = 50 + 40 * Math.cos(endAngle)
                const y2 = 50 + 40 * Math.sin(endAngle)

                const largeArc = segment.percent > 50 ? 1 : 0

                return (
                  <path
                    key={i}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={segment.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <title>{`${segment.label}: ${segment.value} (${segment.percent.toFixed(1)}%)`}</title>
                  </path>
                )
              })}
              {/* Inner circle for donut effect */}
              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {segments.map((segment, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-gray-600">{segment.label}</span>
                </div>
                <span className="font-medium text-gray-900">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Bar chart
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 truncate">{item.label}</span>
              <span className="font-medium text-gray-900 ml-2">{item.value}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
