'use client'

import { useMemo } from 'react'

interface DataPoint {
  date: string
  total: number
  submitted?: number
  approved?: number
  rejected?: number
}

interface TrendsChartProps {
  data: DataPoint[]
  title?: string
  height?: number
}

export default function TrendsChart({
  data,
  title = 'Submission Trends',
  height = 200,
}: TrendsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { points: [], maxValue: 0, labels: [] }

    const maxValue = Math.max(...data.map((d) => d.total), 1)
    const paddedMax = Math.ceil(maxValue * 1.1) // 10% padding

    const points = data.map((d, i) => ({
      x: (i / (data.length - 1 || 1)) * 100,
      y: 100 - (d.total / paddedMax) * 100,
      value: d.total,
      date: d.date,
    }))

    // Create path for the line
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ')

    // Create path for the area fill
    const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} 100 L 0 100 Z`

    // Get 5 evenly spaced labels
    const labelIndices = [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1]
    const labels = labelIndices.map((i) => ({
      x: points[i]?.x || 0,
      label: formatDateLabel(data[i]?.date || ''),
    }))

    return { points, maxValue: paddedMax, linePath, areaPath, labels }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Area fill */}
          <path
            d={chartData.areaPath}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path
            d={chartData.linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {chartData.points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill="#3b82f6"
              className="hover:r-3 transition-all"
            >
              <title>{`${point.date}: ${point.value} submissions`}</title>
            </circle>
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 -ml-8 w-6 text-right">
          <span>{chartData.maxValue}</span>
          <span>{Math.round(chartData.maxValue / 2)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        {chartData.labels.map((label, i) => (
          <span key={i}>{label.label}</span>
        ))}
      </div>
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
