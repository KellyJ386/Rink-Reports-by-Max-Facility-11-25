'use client'

interface ThresholdAlertProps {
  type: 'CO' | 'NO2'
  value: number
  unit: string
  warningThreshold: number
  evacuationThreshold: number
}

export default function ThresholdAlert({
  type,
  value,
  unit,
  warningThreshold,
  evacuationThreshold,
}: ThresholdAlertProps) {
  const getStatus = () => {
    if (value >= evacuationThreshold) return 'evacuation'
    if (value >= warningThreshold) return 'warning'
    return 'normal'
  }

  const status = getStatus()

  const statusConfig = {
    normal: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✓',
      label: 'Normal',
      bar: 'bg-green-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-800',
      icon: '⚠️',
      label: 'Warning',
      bar: 'bg-yellow-500',
    },
    evacuation: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-800',
      icon: '🚨',
      label: 'EVACUATION',
      bar: 'bg-red-500',
    },
  }

  const config = statusConfig[status]

  // Calculate percentage for gauge (cap at 150% of evacuation threshold)
  const maxGauge = evacuationThreshold * 1.5
  const percentage = Math.min((value / maxGauge) * 100, 100)

  return (
    <div className={`p-4 rounded-lg border-2 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className="font-semibold">{type} Level</h4>
            <p className={`text-sm ${config.text}`}>{config.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${config.text}`}>{value.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{unit}</p>
        </div>
      </div>

      {/* Gauge Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        {/* Warning zone */}
        <div
          className="absolute h-full bg-yellow-200"
          style={{
            left: `${(warningThreshold / maxGauge) * 100}%`,
            width: `${((evacuationThreshold - warningThreshold) / maxGauge) * 100}%`,
          }}
        />
        {/* Evacuation zone */}
        <div
          className="absolute h-full bg-red-200"
          style={{
            left: `${(evacuationThreshold / maxGauge) * 100}%`,
            width: `${((maxGauge - evacuationThreshold) / maxGauge) * 100}%`,
          }}
        />
        {/* Current value */}
        <div
          className={`absolute h-full ${config.bar} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
        {/* Threshold markers */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-600"
          style={{ left: `${(warningThreshold / maxGauge) * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-600"
          style={{ left: `${(evacuationThreshold / maxGauge) * 100}%` }}
        />
      </div>

      {/* Threshold Labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>0</span>
        <span>Warning: {warningThreshold}</span>
        <span>Evac: {evacuationThreshold}</span>
      </div>

      {/* Alert Message */}
      {status === 'evacuation' && (
        <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-800 font-medium animate-pulse">
          🚨 IMMEDIATE ACTION REQUIRED - Evacuate facility and contact emergency services
        </div>
      )}
      {status === 'warning' && (
        <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
          ⚠️ Levels elevated - Increase ventilation and monitor closely
        </div>
      )}
    </div>
  )
}

// Compact version for list views
export function ThresholdBadge({
  value,
  warningThreshold,
  evacuationThreshold,
}: {
  value: number
  warningThreshold: number
  evacuationThreshold: number
}) {
  if (value >= evacuationThreshold) {
    return (
      <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full animate-pulse">
        🚨 EVAC
      </span>
    )
  }
  if (value >= warningThreshold) {
    return (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        ⚠️ Warning
      </span>
    )
  }
  return (
    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
      ✓ Normal
    </span>
  )
}
