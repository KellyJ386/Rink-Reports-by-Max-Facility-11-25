'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Thermometer,
  Wind,
  Droplets,
  Activity,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Bell,
  Settings,
  ChevronRight,
  RefreshCw,
  Snowflake,
  Gauge,
  Zap,
  Wrench,
  ClipboardList,
  BarChart3,
  PlusCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Timer,
  User,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DashboardMetrics,
  Alert,
  ActivityItem,
  StaffMember,
  generateMockDashboardData,
  generateIceDepthTrends,
  generateAirQualityTrends,
  IceDepthTrend,
  AirQualityTrend,
} from '@/types/dashboard'

// Trend indicator component
const TrendIndicator = ({ trend, size = 'sm' }: { trend: 'up' | 'down' | 'stable' | 'rising' | 'falling'; size?: 'sm' | 'md' }) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  if (trend === 'up' || trend === 'rising') {
    return <TrendingUp className={`${iconSize} text-red-500`} />
  }
  if (trend === 'down' || trend === 'falling') {
    return <TrendingDown className={`${iconSize} text-green-500`} />
  }
  return <Minus className={`${iconSize} text-gray-400`} />
}

// Status badge component
const StatusBadge = ({ status }: { status: 'normal' | 'warning' | 'critical' | 'excellent' | 'good' | 'fair' | 'poor' }) => {
  const config = {
    normal: { label: 'Normal', color: 'bg-green-100 text-green-800' },
    excellent: { label: 'Excellent', color: 'bg-green-100 text-green-800' },
    good: { label: 'Good', color: 'bg-blue-100 text-blue-800' },
    fair: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
    warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
    poor: { label: 'Poor', color: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
  }
  const { label, color } = config[status]
  return <Badge className={color}>{label}</Badge>
}

// Mini sparkline chart
const Sparkline = ({ data, color = '#3b82f6' }: { data: number[]; color?: string }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const height = 30
  const width = 80

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  )
}

// Quick action card
const QuickActionCard = ({
  icon: Icon,
  label,
  href,
  color,
  count
}: {
  icon: React.ElementType
  label: string
  href: string
  color: string
  count?: number
}) => (
  <Link href={href}>
    <Card className="hover:shadow-md transition-all cursor-pointer group">
      <CardContent className="p-4 flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm group-hover:text-blue-600">{label}</p>
          {count !== undefined && (
            <p className="text-xs text-gray-500">{count} pending</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
      </CardContent>
    </Card>
  </Link>
)

// Alert item component
const AlertItem = ({ alert }: { alert: Alert }) => {
  const typeConfig = {
    critical: { color: 'border-red-500 bg-red-50', icon: AlertTriangle, iconColor: 'text-red-500' },
    warning: { color: 'border-yellow-500 bg-yellow-50', icon: AlertTriangle, iconColor: 'text-yellow-500' },
    info: { color: 'border-blue-500 bg-blue-50', icon: Bell, iconColor: 'text-blue-500' },
  }
  const config = typeConfig[alert.type]
  const Icon = config.icon

  return (
    <div className={`p-3 rounded-lg border-l-4 ${config.color}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{alert.title}</p>
          <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs text-gray-400">
              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {alert.link && (
              <Link href={alert.link} className="text-xs text-blue-600 hover:underline">
                View details
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Activity item component
const ActivityItemComponent = ({ item }: { item: ActivityItem }) => {
  const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
    report: { icon: FileText, color: 'bg-blue-100 text-blue-600' },
    alert: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' },
    schedule: { icon: Calendar, color: 'bg-purple-100 text-purple-600' },
    incident: { icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
    user: { icon: User, color: 'bg-green-100 text-green-600' },
    system: { icon: Settings, color: 'bg-gray-100 text-gray-600' },
  }
  const config = typeConfig[item.type] || typeConfig.system
  const Icon = config.icon

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex items-start space-x-3 py-3 border-b last:border-0">
      <div className={`p-2 rounded-full ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {item.user && (
            <span className="font-medium">{item.user.name} </span>
          )}
          <span className="text-gray-600">{item.description}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">{formatTime(item.timestamp)}</p>
      </div>
    </div>
  )
}

// Staff member card
const StaffCard = ({ staff }: { staff: StaffMember }) => {
  const statusConfig = {
    active: { color: 'bg-green-500', label: 'On Duty' },
    break: { color: 'bg-yellow-500', label: 'On Break' },
    'ending-soon': { color: 'bg-orange-500', label: 'Shift Ending' },
  }
  const status = statusConfig[staff.status]

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
      <Avatar className="h-10 w-10">
        <AvatarImage src={staff.avatar} />
        <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{staff.name}</p>
        <p className="text-xs text-gray-500">{staff.role}</p>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-1">
          <div className={`h-2 w-2 rounded-full ${status.color}`} />
          <span className="text-xs text-gray-500">{status.label}</span>
        </div>
        <p className="text-xs text-gray-400">{staff.shiftStart} - {staff.shiftEnd}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [iceDepthTrends, setIceDepthTrends] = useState<IceDepthTrend[]>([])
  const [airQualityTrends, setAirQualityTrends] = useState<AirQualityTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadData = () => {
    setMetrics(generateMockDashboardData())
    setIceDepthTrends(generateIceDepthTrends(7))
    setAirQualityTrends(generateAirQualityTrends(24))
    setLastRefresh(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const { iceConditions, airQuality, equipment, operations, alerts, schedule, recentActivity } = metrics

  // Generate sparkline data from trends
  const co2SparklineData = airQualityTrends.slice(-12).map(t => t.co2)
  const iceDepthSparklineData = iceDepthTrends.map(t => t.averageDepth)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Real-time facility overview • Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alert Banner (if any critical alerts) */}
      {alerts.critical > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-medium text-red-800">
                {alerts.critical} Critical Alert{alerts.critical > 1 ? 's' : ''} Require Attention
              </p>
              <p className="text-sm text-red-600">
                Immediate action may be required
              </p>
            </div>
          </div>
          <Button variant="destructive" size="sm">
            View Alerts
          </Button>
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ice Conditions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Snowflake className="h-6 w-6 text-blue-600" />
              </div>
              <StatusBadge status={iceConditions.rinkStatus} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Ice Temperature</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{iceConditions.currentTemperature.toFixed(1)}°C</p>
                <TrendIndicator trend={iceConditions.temperatureTrend} />
              </div>
              <p className="text-xs text-gray-400">Target: {iceConditions.targetTemperature}°C</p>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quality Score</span>
                <span className="font-medium">{iceConditions.qualityScore}%</span>
              </div>
              <Progress value={iceConditions.qualityScore} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Air Quality */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wind className="h-6 w-6 text-green-600" />
              </div>
              <StatusBadge status={airQuality.co2Status} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">CO2 Level</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{airQuality.co2Level}</p>
                <span className="text-sm text-gray-400">ppm</span>
                <TrendIndicator trend={airQuality.co2Trend} />
              </div>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-400">CO: {airQuality.coLevel} ppm</p>
                <p className="text-xs text-gray-400">Humidity: {airQuality.humidity}%</p>
              </div>
              <Sparkline data={co2SparklineData} color="#22c55e" />
            </div>
          </CardContent>
        </Card>

        {/* Equipment Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gauge className="h-6 w-6 text-purple-600" />
              </div>
              <Badge className="bg-green-100 text-green-800">
                All Systems Normal
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Refrigeration Efficiency</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{equipment.refrigeration.efficiency.toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-600">Compressor</span>
                </div>
                <span>{equipment.refrigeration.compressorTemp.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-gray-600">Evaporator</span>
                </div>
                <span>{equipment.refrigeration.evaporatorTemp.toFixed(1)}°C</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Reports Submitted</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{operations.reportsToday}</p>
                <span className="text-sm text-gray-400">/ {operations.reportsThisWeek} this week</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-yellow-600">{operations.pendingApprovals}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold text-green-600">{operations.complianceRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Schedule & Resurfacer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Event & Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
              <Link href="/dashboard/schedule" className="text-sm text-blue-600 hover:underline">
                View full schedule
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Event */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-blue-800">Now Playing</span>
                </div>
                {schedule.currentEvent ? (
                  <>
                    <p className="font-bold text-lg">{schedule.currentEvent.name}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(schedule.currentEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(schedule.currentEvent.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {schedule.currentEvent.rink}
                      </span>
                    </div>
                    {schedule.currentEvent.attendees && (
                      <div className="flex items-center mt-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        {schedule.currentEvent.attendees} attendees
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">No active event</p>
                )}
              </div>

              {/* Next Event */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Up Next</span>
                </div>
                {schedule.nextEvent ? (
                  <>
                    <p className="font-bold text-lg">{schedule.nextEvent.name}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(schedule.nextEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {schedule.nextEvent.rink}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">No upcoming events</p>
                )}
              </div>
            </div>

            {/* Events count */}
            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total events today</span>
              <Badge variant="outline">{schedule.eventsToday} events</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Resurfacer Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>Resurfacer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Badge className={
                equipment.resurfacer.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : equipment.resurfacer.status === 'in-use'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }>
                {equipment.resurfacer.status.replace('-', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-500">
                {equipment.resurfacer.cutsToday} cuts today
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Fuel Level</span>
                  <span className="font-medium">{equipment.resurfacer.fuelLevel.toFixed(0)}%</span>
                </div>
                <Progress value={equipment.resurfacer.fuelLevel} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Water Level</span>
                  <span className="font-medium">{equipment.resurfacer.waterLevel.toFixed(0)}%</span>
                </div>
                <Progress value={equipment.resurfacer.waterLevel} className="h-2" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Blade Condition</span>
                <Badge variant="outline" className={
                  equipment.resurfacer.bladesCondition === 'good'
                    ? 'border-green-300 text-green-700'
                    : equipment.resurfacer.bladesCondition === 'worn'
                    ? 'border-yellow-300 text-yellow-700'
                    : 'border-red-300 text-red-700'
                }>
                  {equipment.resurfacer.bladesCondition}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Next Resurface</span>
                <span className="font-medium text-blue-600">
                  in {iceConditions.nextResurfaceIn} min
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Alerts, Activity, Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Active Alerts</span>
                {alerts.total > 0 && (
                  <Badge variant="destructive">{alerts.total}</Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.activeAlerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.activeAlerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
                <p className="text-sm">All systems operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Link href="/admin/audit-logs" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 max-h-[300px] overflow-y-auto">
              {recentActivity.map((item) => (
                <ActivityItemComponent key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff On Duty */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Staff On Duty</span>
              </CardTitle>
              <Badge variant="outline">{schedule.staffOnDuty.length} active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedule.staffOnDuty.map((staff) => (
                <StaffCard key={staff.id} staff={staff} />
              ))}
            </div>
            {schedule.upcomingShiftChanges.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Upcoming Changes</p>
                {schedule.upcomingShiftChanges.slice(0, 2).map((change, i) => (
                  <div key={i} className="flex items-center text-sm text-gray-600 mb-1">
                    <Clock className="h-3 w-3 mr-2" />
                    <span>{change.time}: </span>
                    <span className="text-green-600 ml-1">+{change.staffIn.join(', ')}</span>
                    <span className="text-red-600 ml-1">-{change.staffOut.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickActionCard
            icon={Snowflake}
            label="Ice Depth"
            href="/dashboard/ice-depth/new"
            color="bg-blue-500"
          />
          <QuickActionCard
            icon={Wind}
            label="Air Quality"
            href="/dashboard/air-quality/new"
            color="bg-green-500"
          />
          <QuickActionCard
            icon={Thermometer}
            label="Refrigeration"
            href="/dashboard/refrigeration/new"
            color="bg-purple-500"
          />
          <QuickActionCard
            icon={ClipboardList}
            label="Checklist"
            href="/dashboard/checklists/new"
            color="bg-orange-500"
          />
          <QuickActionCard
            icon={AlertTriangle}
            label="Incident"
            href="/dashboard/incidents/new"
            color="bg-red-500"
          />
          <QuickActionCard
            icon={FileText}
            label="Ice Operations"
            href="/dashboard/ice-operations/new"
            color="bg-cyan-500"
          />
        </div>
      </div>

      {/* Ice Depth & Air Quality Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ice Depth Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ice Depth Trend</CardTitle>
                <CardDescription>Last 7 days average depth</CardDescription>
              </div>
              <Link href="/dashboard/ice-depth" className="text-sm text-blue-600 hover:underline">
                View details
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {iceDepthTrends.map((day, index) => {
                const height = ((day.averageDepth - 1.0) / 0.2) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(20, height)}%` }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="text-xs font-medium">
                      {day.averageDepth.toFixed(2)}&quot;
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Air Quality 24h */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Air Quality (24h)</CardTitle>
                <CardDescription>CO2 levels over time</CardDescription>
              </div>
              <Link href="/dashboard/air-quality" className="text-sm text-blue-600 hover:underline">
                View details
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Warning threshold line */}
              <div className="absolute w-full border-t-2 border-dashed border-yellow-400" style={{ bottom: '60%' }}>
                <span className="absolute right-0 -top-4 text-xs text-yellow-600 bg-white px-1">800 ppm</span>
              </div>
              {/* Critical threshold line */}
              <div className="absolute w-full border-t-2 border-dashed border-red-400" style={{ bottom: '80%' }}>
                <span className="absolute right-0 -top-4 text-xs text-red-600 bg-white px-1">1000 ppm</span>
              </div>
              <div className="h-full flex items-end gap-0.5">
                {airQualityTrends.map((point, index) => {
                  const height = (point.co2 / 1200) * 100
                  const isWarning = point.co2 >= 800
                  const isCritical = point.co2 >= 1000
                  return (
                    <div
                      key={index}
                      className={`flex-1 rounded-t transition-all ${
                        isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${new Date(point.timestamp).toLocaleTimeString()}: ${point.co2.toFixed(0)} ppm`}
                    />
                  )
                })}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>24h ago</span>
              <span>Now</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-900">MFO Ice Rink Management System</h3>
              <p className="text-sm text-blue-700">
                Phase 10: Analytics Dashboard • Real-time monitoring and insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/settings" className="text-sm text-blue-600 hover:underline flex items-center">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Link>
              <Link href="/dashboard/notifications" className="text-sm text-blue-600 hover:underline flex items-center">
                <Bell className="h-4 w-4 mr-1" />
                Notifications
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
