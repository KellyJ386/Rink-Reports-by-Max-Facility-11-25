// Dashboard types for analytics and real-time monitoring

export interface DashboardMetrics {
  iceConditions: IceConditionsMetrics
  airQuality: AirQualityMetrics
  equipment: EquipmentMetrics
  operations: OperationsMetrics
  alerts: AlertSummary
  schedule: ScheduleSummary
  recentActivity: ActivityItem[]
}

// Ice Conditions
export interface IceConditionsMetrics {
  currentTemperature: number
  targetTemperature: number
  temperatureTrend: 'rising' | 'falling' | 'stable'
  averageThickness: number
  thicknessVariance: number
  qualityScore: number // 0-100
  lastResurfaced: string
  nextResurfaceIn: number // minutes
  rinkStatus: 'excellent' | 'good' | 'fair' | 'poor'
}

// Air Quality
export interface AirQualityMetrics {
  co2Level: number
  co2Status: 'normal' | 'warning' | 'critical'
  co2Trend: 'rising' | 'falling' | 'stable'
  coLevel: number
  coStatus: 'normal' | 'warning' | 'critical'
  no2Level: number
  no2Status: 'normal' | 'warning' | 'critical'
  humidity: number
  lastUpdated: string
  ventilationStatus: 'active' | 'idle' | 'error'
}

// Equipment Status
export interface EquipmentMetrics {
  refrigeration: RefrigerationStatus
  resurfacer: ResurfacerStatus
  hvac: HVACStatus
  dehumidifier: DehumidifierStatus
}

export interface RefrigerationStatus {
  status: 'running' | 'idle' | 'maintenance' | 'error'
  compressorTemp: number
  condenserPressure: number
  evaporatorTemp: number
  runtime: number // hours today
  efficiency: number // percentage
  nextMaintenance: string
}

export interface ResurfacerStatus {
  status: 'available' | 'in-use' | 'maintenance'
  fuelLevel: number // percentage
  waterLevel: number // percentage
  bladesCondition: 'good' | 'worn' | 'replace'
  lastUsed: string
  cutsToday: number
}

export interface HVACStatus {
  status: 'running' | 'idle' | 'error'
  mode: 'heating' | 'cooling' | 'ventilation'
  airflowRate: number // CFM
  filterStatus: 'good' | 'change-soon' | 'replace'
}

export interface DehumidifierStatus {
  status: 'running' | 'idle' | 'error'
  currentHumidity: number
  targetHumidity: number
  waterCollected: number // liters today
}

// Operations Summary
export interface OperationsMetrics {
  reportsToday: number
  reportsThisWeek: number
  pendingApprovals: number
  incidentsThisMonth: number
  incidentsTrend: 'up' | 'down' | 'stable'
  checklistsCompleted: number
  checklistsPending: number
  complianceRate: number // percentage
}

// Alert Summary
export interface AlertSummary {
  total: number
  critical: number
  warning: number
  info: number
  activeAlerts: Alert[]
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  category: 'air_quality' | 'equipment' | 'schedule' | 'incident' | 'maintenance'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  actionRequired: boolean
  link?: string
}

// Schedule Summary
export interface ScheduleSummary {
  currentEvent: ScheduleEvent | null
  nextEvent: ScheduleEvent | null
  eventsToday: number
  staffOnDuty: StaffMember[]
  upcomingShiftChanges: ShiftChange[]
}

export interface ScheduleEvent {
  id: string
  name: string
  type: 'public_skate' | 'hockey' | 'figure_skating' | 'maintenance' | 'private' | 'other'
  startTime: string
  endTime: string
  rink: string
  attendees?: number
}

export interface StaffMember {
  id: string
  name: string
  role: string
  avatar?: string
  shiftStart: string
  shiftEnd: string
  status: 'active' | 'break' | 'ending-soon'
}

export interface ShiftChange {
  time: string
  staffIn: string[]
  staffOut: string[]
}

// Activity Feed
export interface ActivityItem {
  id: string
  type: 'report' | 'alert' | 'schedule' | 'incident' | 'user' | 'system'
  action: string
  description: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: string
  link?: string
  metadata?: Record<string, unknown>
}

// Chart Data Types
export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  borderColor?: string
  backgroundColor?: string
  fill?: boolean
  tension?: number
}

export interface IceDepthTrend {
  date: string
  averageDepth: number
  minDepth: number
  maxDepth: number
  variance: number
}

export interface AirQualityTrend {
  timestamp: string
  co2: number
  co: number
  no2: number
  humidity: number
}

export interface RefrigerationTrend {
  timestamp: string
  compressorTemp: number
  condenserPressure: number
  evaporatorTemp: number
  efficiency: number
}

// Quick Actions
export interface QuickAction {
  id: string
  label: string
  icon: string
  href: string
  color: string
  description?: string
  permission?: string
}

// Recent Submissions
export interface RecentSubmission {
  id: string
  type: 'ice_depth' | 'air_quality' | 'refrigeration' | 'checklist' | 'incident' | 'ice_operations'
  title: string
  submittedBy: string
  submittedAt: string
  status: 'submitted' | 'approved' | 'pending_review' | 'rejected'
  link: string
}

// Widget Configuration
export interface DashboardWidget {
  id: string
  type: 'kpi' | 'chart' | 'list' | 'alert' | 'schedule' | 'activity'
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  position: { row: number; col: number }
  config?: Record<string, unknown>
}

// Mock data generator helpers
export const generateMockDashboardData = (): DashboardMetrics => {
  return {
    iceConditions: generateIceConditions(),
    airQuality: generateAirQuality(),
    equipment: generateEquipmentMetrics(),
    operations: generateOperationsMetrics(),
    alerts: generateAlertSummary(),
    schedule: generateScheduleSummary(),
    recentActivity: generateRecentActivity(),
  }
}

const generateIceConditions = (): IceConditionsMetrics => ({
  currentTemperature: -4.2 + (Math.random() - 0.5),
  targetTemperature: -4.0,
  temperatureTrend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as 'rising' | 'falling' | 'stable',
  averageThickness: 1.125 + (Math.random() - 0.5) * 0.1,
  thicknessVariance: 0.05 + Math.random() * 0.03,
  qualityScore: 85 + Math.floor(Math.random() * 10),
  lastResurfaced: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
  nextResurfaceIn: 15 + Math.floor(Math.random() * 30),
  rinkStatus: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] as 'excellent' | 'good' | 'fair',
})

const generateAirQuality = (): AirQualityMetrics => {
  const co2 = 400 + Math.floor(Math.random() * 500)
  const co = Math.floor(Math.random() * 20)
  return {
    co2Level: co2,
    co2Status: co2 < 800 ? 'normal' : co2 < 1000 ? 'warning' : 'critical',
    co2Trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as 'rising' | 'falling' | 'stable',
    coLevel: co,
    coStatus: co < 25 ? 'normal' : co < 35 ? 'warning' : 'critical',
    no2Level: Math.floor(Math.random() * 80),
    no2Status: 'normal',
    humidity: 45 + Math.floor(Math.random() * 20),
    lastUpdated: new Date().toISOString(),
    ventilationStatus: 'active',
  }
}

const generateEquipmentMetrics = (): EquipmentMetrics => ({
  refrigeration: {
    status: 'running',
    compressorTemp: 35 + Math.random() * 10,
    condenserPressure: 180 + Math.random() * 20,
    evaporatorTemp: -8 + Math.random() * 2,
    runtime: 8 + Math.random() * 4,
    efficiency: 92 + Math.random() * 6,
    nextMaintenance: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  resurfacer: {
    status: 'available',
    fuelLevel: 60 + Math.random() * 30,
    waterLevel: 70 + Math.random() * 25,
    bladesCondition: 'good',
    lastUsed: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
    cutsToday: Math.floor(Math.random() * 8),
  },
  hvac: {
    status: 'running',
    mode: 'ventilation',
    airflowRate: 5000 + Math.random() * 1000,
    filterStatus: 'good',
  },
  dehumidifier: {
    status: 'running',
    currentHumidity: 48 + Math.random() * 10,
    targetHumidity: 50,
    waterCollected: 15 + Math.random() * 10,
  },
})

const generateOperationsMetrics = (): OperationsMetrics => ({
  reportsToday: Math.floor(Math.random() * 15) + 5,
  reportsThisWeek: Math.floor(Math.random() * 50) + 30,
  pendingApprovals: Math.floor(Math.random() * 5),
  incidentsThisMonth: Math.floor(Math.random() * 8),
  incidentsTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
  checklistsCompleted: Math.floor(Math.random() * 10) + 5,
  checklistsPending: Math.floor(Math.random() * 3),
  complianceRate: 90 + Math.random() * 8,
})

const generateAlertSummary = (): AlertSummary => {
  const alerts: Alert[] = [
    {
      id: 'alert-1',
      type: 'warning',
      category: 'air_quality',
      title: 'CO2 Levels Elevated',
      message: 'CO2 levels approaching warning threshold in Rink A',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      acknowledged: false,
      actionRequired: true,
      link: '/dashboard/air-quality',
    },
    {
      id: 'alert-2',
      type: 'info',
      category: 'maintenance',
      title: 'Scheduled Maintenance',
      message: 'Refrigeration system maintenance due in 14 days',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      acknowledged: true,
      actionRequired: false,
    },
  ]

  return {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
    activeAlerts: alerts,
  }
}

const generateScheduleSummary = (): ScheduleSummary => ({
  currentEvent: {
    id: 'event-1',
    name: 'Public Skating',
    type: 'public_skate',
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    rink: 'Rink A',
    attendees: 45,
  },
  nextEvent: {
    id: 'event-2',
    name: 'Youth Hockey Practice',
    type: 'hockey',
    startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
    rink: 'Rink A',
  },
  eventsToday: 8,
  staffOnDuty: [
    { id: 'staff-1', name: 'John Smith', role: 'Ice Technician', shiftStart: '06:00', shiftEnd: '14:00', status: 'active' },
    { id: 'staff-2', name: 'Sarah Johnson', role: 'Front Desk', shiftStart: '08:00', shiftEnd: '16:00', status: 'active' },
    { id: 'staff-3', name: 'Mike Williams', role: 'Supervisor', shiftStart: '07:00', shiftEnd: '15:00', status: 'ending-soon' },
  ],
  upcomingShiftChanges: [
    { time: '14:00', staffIn: ['Tom Brown'], staffOut: ['John Smith'] },
    { time: '15:00', staffIn: ['Lisa Davis'], staffOut: ['Mike Williams'] },
  ],
})

const generateRecentActivity = (): ActivityItem[] => [
  {
    id: 'activity-1',
    type: 'report',
    action: 'submitted',
    description: 'Ice Depth measurement completed for Rink A',
    user: { id: 'user-1', name: 'John Smith' },
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    link: '/dashboard/ice-depth',
  },
  {
    id: 'activity-2',
    type: 'alert',
    action: 'triggered',
    description: 'CO2 warning threshold reached',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    link: '/dashboard/air-quality',
  },
  {
    id: 'activity-3',
    type: 'schedule',
    action: 'updated',
    description: 'Public skating session extended by 30 minutes',
    user: { id: 'user-2', name: 'Sarah Manager' },
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'activity-4',
    type: 'incident',
    action: 'resolved',
    description: 'Minor equipment issue resolved',
    user: { id: 'user-1', name: 'John Smith' },
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'activity-5',
    type: 'system',
    action: 'maintenance',
    description: 'Automatic backup completed successfully',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
]

// Generate trend data for charts
export const generateIceDepthTrends = (days: number = 7): IceDepthTrend[] => {
  const trends: IceDepthTrend[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const baseDepth = 1.1 + Math.random() * 0.1
    trends.push({
      date: date.toISOString().split('T')[0],
      averageDepth: baseDepth,
      minDepth: baseDepth - 0.05 - Math.random() * 0.03,
      maxDepth: baseDepth + 0.05 + Math.random() * 0.03,
      variance: 0.03 + Math.random() * 0.04,
    })
  }

  return trends
}

export const generateAirQualityTrends = (hours: number = 24): AirQualityTrend[] => {
  const trends: AirQualityTrend[] = []
  const now = new Date()

  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    trends.push({
      timestamp: timestamp.toISOString(),
      co2: 400 + Math.sin(i / 3) * 200 + Math.random() * 100,
      co: Math.floor(5 + Math.random() * 15),
      no2: Math.floor(20 + Math.random() * 40),
      humidity: 45 + Math.sin(i / 4) * 10 + Math.random() * 5,
    })
  }

  return trends
}

export const generateRefrigerationTrends = (hours: number = 24): RefrigerationTrend[] => {
  const trends: RefrigerationTrend[] = []
  const now = new Date()

  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    trends.push({
      timestamp: timestamp.toISOString(),
      compressorTemp: 38 + Math.sin(i / 2) * 3 + Math.random() * 2,
      condenserPressure: 185 + Math.sin(i / 3) * 10 + Math.random() * 5,
      evaporatorTemp: -7 + Math.sin(i / 4) * 1 + Math.random() * 0.5,
      efficiency: 94 + Math.sin(i / 5) * 2 + Math.random(),
    })
  }

  return trends
}
