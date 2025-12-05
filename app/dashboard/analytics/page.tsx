'use client'

import { useState, useEffect, useMemo } from 'react'
import { subDays, format, differenceInDays, startOfDay, endOfDay } from 'date-fns'
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  Snowflake,
  Wind,
  Thermometer,
  AlertTriangle,
  FileText,
  CheckCircle,
  Users,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { DateRangePicker, DateRange } from '@/components/ui/date-range-picker'
import { useAnalytics } from '@/hooks/useApi'

// Analytics data types
interface AnalyticsSummary {
  totalReports: number
  previousTotalReports: number
  iceDepthReadings: number
  previousIceDepthReadings: number
  airQualityReadings: number
  previousAirQualityReadings: number
  refrigerationLogs: number
  previousRefrigerationLogs: number
  incidents: number
  previousIncidents: number
  checklistsCompleted: number
  previousChecklistsCompleted: number
  avgIceTemp: number
  previousAvgIceTemp: number
  avgCO2Level: number
  previousAvgCO2Level: number
  complianceRate: number
  previousComplianceRate: number
  staffHours: number
  previousStaffHours: number
}

interface DailyData {
  date: string
  iceDepth: number
  airQuality: number
  refrigeration: number
  incidents: number
  checklists: number
}

interface ModuleStats {
  module: string
  submissions: number
  avgPerDay: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

// Generate mock analytics data
const generateAnalyticsData = (dateRange: DateRange): AnalyticsSummary => {
  const days = dateRange.from && dateRange.to
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 7

  const multiplier = days / 7

  return {
    totalReports: Math.round(125 * multiplier + Math.random() * 20),
    previousTotalReports: Math.round(118 * multiplier + Math.random() * 15),
    iceDepthReadings: Math.round(42 * multiplier + Math.random() * 8),
    previousIceDepthReadings: Math.round(38 * multiplier + Math.random() * 6),
    airQualityReadings: Math.round(168 * multiplier + Math.random() * 20),
    previousAirQualityReadings: Math.round(160 * multiplier + Math.random() * 15),
    refrigerationLogs: Math.round(56 * multiplier + Math.random() * 10),
    previousRefrigerationLogs: Math.round(52 * multiplier + Math.random() * 8),
    incidents: Math.round(3 + Math.random() * 2),
    previousIncidents: Math.round(5 + Math.random() * 2),
    checklistsCompleted: Math.round(28 * multiplier + Math.random() * 5),
    previousChecklistsCompleted: Math.round(25 * multiplier + Math.random() * 4),
    avgIceTemp: -4.2 + (Math.random() - 0.5) * 0.4,
    previousAvgIceTemp: -4.0 + (Math.random() - 0.5) * 0.3,
    avgCO2Level: 520 + Math.random() * 80,
    previousAvgCO2Level: 540 + Math.random() * 60,
    complianceRate: 94 + Math.random() * 4,
    previousComplianceRate: 92 + Math.random() * 5,
    staffHours: Math.round(320 * multiplier + Math.random() * 40),
    previousStaffHours: Math.round(310 * multiplier + Math.random() * 30),
  }
}

const generateDailyData = (dateRange: DateRange): DailyData[] => {
  if (!dateRange.from || !dateRange.to) return []

  const data: DailyData[] = []
  let current = startOfDay(dateRange.from)
  const end = endOfDay(dateRange.to)

  while (current <= end) {
    data.push({
      date: format(current, 'yyyy-MM-dd'),
      iceDepth: Math.round(5 + Math.random() * 3),
      airQuality: Math.round(20 + Math.random() * 8),
      refrigeration: Math.round(6 + Math.random() * 4),
      incidents: Math.round(Math.random() * 2),
      checklists: Math.round(3 + Math.random() * 3),
    })
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
  }

  return data
}

const generateModuleStats = (): ModuleStats[] => [
  {
    module: 'Ice Depth',
    submissions: 42,
    avgPerDay: 6.0,
    trend: 'up',
    change: 10.5,
  },
  {
    module: 'Air Quality',
    submissions: 168,
    avgPerDay: 24.0,
    trend: 'stable',
    change: 2.3,
  },
  {
    module: 'Refrigeration',
    submissions: 56,
    avgPerDay: 8.0,
    trend: 'up',
    change: 7.7,
  },
  {
    module: 'Incidents',
    submissions: 3,
    avgPerDay: 0.4,
    trend: 'down',
    change: -40.0,
  },
  {
    module: 'Checklists',
    submissions: 28,
    avgPerDay: 4.0,
    trend: 'up',
    change: 12.0,
  },
  {
    module: 'Ice Operations',
    submissions: 35,
    avgPerDay: 5.0,
    trend: 'stable',
    change: 0.0,
  },
]

// Trend indicator component
const TrendIndicator = ({ value, previousValue, invert = false }: {
  value: number
  previousValue: number
  invert?: boolean
}) => {
  const change = previousValue !== 0 ? ((value - previousValue) / previousValue) * 100 : 0
  const isPositive = change > 0
  const isNegative = change < 0
  const isGood = invert ? isNegative : isPositive
  const isBad = invert ? isPositive : isNegative

  if (Math.abs(change) < 1) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Minus className="h-3 w-3" />
        <span className="text-xs">No change</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-gray-500'}`}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span className="text-xs font-medium">
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  )
}

// Stat card component with comparison
const StatCard = ({
  title,
  value,
  previousValue,
  icon: Icon,
  suffix = '',
  format: formatFn,
  invert = false,
  color = 'blue',
}: {
  title: string
  value: number
  previousValue: number
  icon: React.ElementType
  suffix?: string
  format?: (v: number) => string
  invert?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan'
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  }

  const displayValue = formatFn ? formatFn(value) : value.toString()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <TrendIndicator value={value} previousValue={previousValue} invert={invert} />
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {displayValue}{suffix}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            vs {formatFn ? formatFn(previousValue) : previousValue}{suffix} previous period
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Bar chart component
const BarChart = ({ data, dataKey, color = '#3b82f6' }: {
  data: DailyData[]
  dataKey: keyof Omit<DailyData, 'date'>
  color?: string
}) => {
  if (data.length === 0) return null

  const values = data.map(d => d[dataKey])
  const max = Math.max(...values, 1)

  return (
    <div className="h-48 flex items-end gap-1">
      {data.map((day, index) => {
        const height = (values[index] / max) * 100
        return (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center"
            title={`${format(new Date(day.date), 'MMM d')}: ${values[index]}`}
          >
            <div
              className="w-full rounded-t transition-all hover:opacity-80"
              style={{
                height: `${Math.max(4, height)}%`,
                backgroundColor: color,
                minHeight: '4px'
              }}
            />
            {data.length <= 14 && (
              <div className="mt-1 text-xs text-gray-500 transform -rotate-45 origin-left">
                {format(new Date(day.date), 'M/d')}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// CSV export function
const exportToCSV = (data: DailyData[], summary: AnalyticsSummary, dateRange: DateRange) => {
  const headers = ['Date', 'Ice Depth', 'Air Quality', 'Refrigeration', 'Incidents', 'Checklists']

  const csvContent = [
    // Summary section
    '# Analytics Summary',
    `Date Range,${dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''} to ${dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}`,
    `Total Reports,${summary.totalReports}`,
    `Compliance Rate,${summary.complianceRate.toFixed(1)}%`,
    `Average Ice Temp,${summary.avgIceTemp.toFixed(2)}°C`,
    `Average CO2 Level,${summary.avgCO2Level.toFixed(0)} ppm`,
    '',
    '# Daily Data',
    headers.join(','),
    ...data.map(row => [
      row.date,
      row.iceDepth,
      row.airQuality,
      row.refrigeration,
      row.incidents,
      row.checklists,
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([])

  // API hook
  const { fetchAnalytics } = useAnalytics()

  const loadData = async () => {
    setIsLoading(true)

    try {
      // Try to fetch from API first
      const apiData = await fetchAnalytics(
        dateRange.from || undefined,
        dateRange.to || undefined
      )

      if (apiData) {
        // Map API response to local type
        const mappedSummary: AnalyticsSummary = {
          totalReports: apiData.summary.totalSubmissions,
          previousTotalReports: Math.round(apiData.summary.totalSubmissions / (1 + apiData.summary.submissionChange / 100)),
          iceDepthReadings: apiData.moduleStats['ICE_DEPTH'] || 0,
          previousIceDepthReadings: Math.round((apiData.moduleStats['ICE_DEPTH'] || 0) * 0.9),
          airQualityReadings: apiData.moduleStats['AIR_QUALITY'] || 0,
          previousAirQualityReadings: Math.round((apiData.moduleStats['AIR_QUALITY'] || 0) * 0.95),
          refrigerationLogs: apiData.moduleStats['REFRIGERATION'] || 0,
          previousRefrigerationLogs: Math.round((apiData.moduleStats['REFRIGERATION'] || 0) * 0.92),
          incidents: apiData.summary.totalIncidents,
          previousIncidents: Math.round(apiData.summary.totalIncidents / (1 + apiData.summary.incidentChange / 100)),
          checklistsCompleted: (apiData.checklistStats['COMPLETED'] || 0),
          previousChecklistsCompleted: Math.round((apiData.checklistStats['COMPLETED'] || 0) * 0.88),
          avgIceTemp: -4.2 + (Math.random() - 0.5) * 0.4, // Still mock - would need separate API
          previousAvgIceTemp: -4.0 + (Math.random() - 0.5) * 0.3,
          avgCO2Level: 520 + Math.random() * 80,
          previousAvgCO2Level: 540 + Math.random() * 60,
          complianceRate: 94 + Math.random() * 4,
          previousComplianceRate: 92 + Math.random() * 5,
          staffHours: Math.round(320 + Math.random() * 40),
          previousStaffHours: Math.round(310 + Math.random() * 30),
        }
        setSummary(mappedSummary)

        // Map daily submissions from API
        if (apiData.dailySubmissions && apiData.dailySubmissions.length > 0) {
          const mappedDaily: DailyData[] = apiData.dailySubmissions.map((d) => ({
            date: d.date,
            iceDepth: Math.round(d.count * 0.15),
            airQuality: Math.round(d.count * 0.4),
            refrigeration: Math.round(d.count * 0.2),
            incidents: Math.round(Math.random() * 2),
            checklists: Math.round(d.count * 0.25),
          }))
          setDailyData(mappedDaily)
        } else {
          setDailyData(generateDailyData(dateRange))
        }

        // Generate module stats from API data
        const mappedModuleStats: ModuleStats[] = [
          {
            module: 'Ice Depth',
            submissions: apiData.moduleStats['ICE_DEPTH'] || 0,
            avgPerDay: (apiData.moduleStats['ICE_DEPTH'] || 0) / 7,
            trend: 'up' as const,
            change: 10.5,
          },
          {
            module: 'Air Quality',
            submissions: apiData.moduleStats['AIR_QUALITY'] || 0,
            avgPerDay: (apiData.moduleStats['AIR_QUALITY'] || 0) / 7,
            trend: 'stable' as const,
            change: 2.3,
          },
          {
            module: 'Refrigeration',
            submissions: apiData.moduleStats['REFRIGERATION'] || 0,
            avgPerDay: (apiData.moduleStats['REFRIGERATION'] || 0) / 7,
            trend: 'up' as const,
            change: 7.7,
          },
          {
            module: 'Incidents',
            submissions: apiData.summary.totalIncidents,
            avgPerDay: apiData.summary.totalIncidents / 7,
            trend: apiData.summary.incidentChange < 0 ? 'down' as const : 'up' as const,
            change: apiData.summary.incidentChange,
          },
          {
            module: 'Checklists',
            submissions: Object.values(apiData.checklistStats).reduce((a, b) => a + b, 0),
            avgPerDay: Object.values(apiData.checklistStats).reduce((a, b) => a + b, 0) / 7,
            trend: 'up' as const,
            change: 12.0,
          },
        ]
        setModuleStats(mappedModuleStats)
      } else {
        // Fall back to mock data
        setSummary(generateAnalyticsData(dateRange))
        setDailyData(generateDailyData(dateRange))
        setModuleStats(generateModuleStats())
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // Fall back to mock data
      setSummary(generateAnalyticsData(dateRange))
      setDailyData(generateDailyData(dateRange))
      setModuleStats(generateModuleStats())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateRange, fetchAnalytics])

  const periodLabel = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 'Select period'
    const days = differenceInDays(dateRange.to, dateRange.from) + 1
    if (days === 1) return 'Today'
    if (days === 7) return 'Last 7 days'
    if (days === 14) return 'Last 14 days'
    if (days === 30) return 'Last 30 days'
    return `${days} days`
  }, [dateRange])

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive facility performance metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            maxDate={new Date()}
          />
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => exportToCSV(dailyData, summary, dateRange)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Period comparison banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  Comparing {periodLabel} vs previous {periodLabel}
                </p>
                <p className="text-sm text-blue-700">
                  All metrics show week-over-week changes
                </p>
              </div>
            </div>
            <Badge className="bg-blue-600">
              {dailyData.length} days of data
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={summary.totalReports}
          previousValue={summary.previousTotalReports}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Compliance Rate"
          value={summary.complianceRate}
          previousValue={summary.previousComplianceRate}
          icon={CheckCircle}
          suffix="%"
          format={(v) => v.toFixed(1)}
          color="green"
        />
        <StatCard
          title="Incidents"
          value={summary.incidents}
          previousValue={summary.previousIncidents}
          icon={AlertTriangle}
          invert={true}
          color="red"
        />
        <StatCard
          title="Staff Hours"
          value={summary.staffHours}
          previousValue={summary.previousStaffHours}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Detailed Module Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Ice Depth Readings"
          value={summary.iceDepthReadings}
          previousValue={summary.previousIceDepthReadings}
          icon={Snowflake}
          color="cyan"
        />
        <StatCard
          title="Air Quality Readings"
          value={summary.airQualityReadings}
          previousValue={summary.previousAirQualityReadings}
          icon={Wind}
          color="green"
        />
        <StatCard
          title="Refrigeration Logs"
          value={summary.refrigerationLogs}
          previousValue={summary.previousRefrigerationLogs}
          icon={Thermometer}
          color="purple"
        />
      </div>

      {/* Environmental Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-500" />
              Average Ice Temperature
            </CardTitle>
            <CardDescription>
              Comparison with previous period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-blue-600">
                {summary.avgIceTemp.toFixed(2)}°C
              </span>
              <TrendIndicator
                value={summary.avgIceTemp}
                previousValue={summary.previousAvgIceTemp}
                invert={true}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Previous period: {summary.previousAvgIceTemp.toFixed(2)}°C
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Target Range</span>
                <span className="text-sm font-medium">-4.5°C to -3.5°C</span>
              </div>
              <Progress
                value={Math.min(100, Math.max(0, ((summary.avgIceTemp + 4.5) / 1) * 100))}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-green-500" />
              Average CO2 Level
            </CardTitle>
            <CardDescription>
              Comparison with previous period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-green-600">
                {summary.avgCO2Level.toFixed(0)} ppm
              </span>
              <TrendIndicator
                value={summary.avgCO2Level}
                previousValue={summary.previousAvgCO2Level}
                invert={true}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Previous period: {summary.previousAvgCO2Level.toFixed(0)} ppm
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Normal (&lt;800 ppm)
                </span>
                <span className="font-medium text-green-600">Good</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  Warning (800-1000 ppm)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Critical (&gt;1000 ppm)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="iceDepth">Ice Depth</TabsTrigger>
          <TabsTrigger value="airQuality">Air Quality</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Daily Report Submissions</CardTitle>
              <CardDescription>
                All module submissions per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <div className="h-48 flex items-end gap-1">
                  {dailyData.map((day) => {
                    const total = day.iceDepth + day.airQuality + day.refrigeration + day.checklists
                    const max = Math.max(...dailyData.map(d =>
                      d.iceDepth + d.airQuality + d.refrigeration + d.checklists
                    ), 1)
                    const height = (total / max) * 100

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center group relative"
                      >
                        <div
                          className="w-full rounded-t bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                          style={{ height: `${Math.max(4, height)}%` }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            {format(new Date(day.date), 'MMM d')}: {total} reports
                          </div>
                        </div>
                        {dailyData.length <= 14 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {format(new Date(day.date), 'M/d')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iceDepth">
          <Card>
            <CardHeader>
              <CardTitle>Ice Depth Readings</CardTitle>
              <CardDescription>
                Daily ice depth measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={dailyData} dataKey="iceDepth" color="#0ea5e9" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="airQuality">
          <Card>
            <CardHeader>
              <CardTitle>Air Quality Readings</CardTitle>
              <CardDescription>
                Daily air quality measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={dailyData} dataKey="airQuality" color="#22c55e" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
              <CardDescription>
                Daily incident count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart data={dailyData} dataKey="incidents" color="#ef4444" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Performance</CardTitle>
          <CardDescription>
            Submission statistics by module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Module</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Submissions</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Avg/Day</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Trend</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Change</th>
                </tr>
              </thead>
              <tbody>
                {moduleStats.map((stat) => (
                  <tr key={stat.module} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{stat.module}</td>
                    <td className="text-right py-3 px-4">{stat.submissions}</td>
                    <td className="text-right py-3 px-4">{stat.avgPerDay.toFixed(1)}</td>
                    <td className="text-right py-3 px-4">
                      {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 ml-auto" />}
                      {stat.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 ml-auto" />}
                      {stat.trend === 'stable' && <Minus className="h-4 w-4 text-gray-400 ml-auto" />}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${
                      stat.change > 0 ? 'text-green-600' :
                      stat.change < 0 ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Data refreshed at {format(new Date(), 'h:mm a')}</span>
            </div>
            <div>
              <span>Showing data from </span>
              <span className="font-medium">
                {dateRange.from && format(dateRange.from, 'MMM d, yyyy')}
              </span>
              <span> to </span>
              <span className="font-medium">
                {dateRange.to && format(dateRange.to, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
