// Ice Depth Module Types

// ==================== PRESETS ====================

export type IceDepthPreset = 'RINK_25' | 'RINK_35' | 'RINK_47' | 'CUSTOM'

export interface MeasurementPoint {
  id: string
  x: number // Percentage position (0-100)
  y: number // Percentage position (0-100)
  label: string // "A1", "B2", "G1", etc.
  zone?: string // "Goal Crease", "Center Ice", "Blue Line", etc.
}

export interface IceDepthConfiguration {
  id: string
  rinkId: string
  presetType: IceDepthPreset | null
  measurementPoints: MeasurementPoint[]
  backgroundImage?: string
  createdAt: string
  updatedAt: string
  rink?: {
    id: string
    name: string
    dimensions?: string
  }
}

// ==================== READINGS ====================

export interface PointMeasurement {
  pointId: string
  depth: number // Depth in inches
  notes?: string
  status?: 'normal' | 'low' | 'high' // Calculated based on target
}

export interface IceDepthReading {
  id: string
  rinkId: string
  recordedById: string
  recordedAt: string
  targetDepth: number
  measurements: PointMeasurement[]
  outsideTemp?: number
  outsideTempUnit: string
  iceTemp?: number
  iceTempUnit: string
  averageDepth: number
  minDepth: number
  maxDepth: number
  pointsBelowTarget: number
  pointsAboveTarget: number
  notes?: string
  hasIssues: boolean
  archivedAt?: string
  rink?: {
    id: string
    name: string
  }
  recordedBy?: {
    id: string
    firstName: string
    lastName: string
  }
}

// ==================== FORMS & API ====================

export interface CreateIceDepthReadingInput {
  rinkId: string
  targetDepth: number
  measurements: PointMeasurement[]
  outsideTemp?: number
  outsideTempUnit?: string
  iceTemp?: number
  iceTempUnit?: string
  notes?: string
}

export interface UpdateConfigurationInput {
  rinkId: string
  presetType?: IceDepthPreset
  measurementPoints?: MeasurementPoint[]
  backgroundImage?: string
}

// ==================== PRESET CONFIGURATIONS ====================

// Standard rink is ~200ft x 85ft
// Measurement points are distributed in a grid pattern

export const PRESET_25_POINTS: MeasurementPoint[] = [
  // Row 1 (Goal line to first zone - 5 points)
  { id: 'A1', x: 10, y: 15, label: 'A1', zone: 'Goal Zone' },
  { id: 'A2', x: 10, y: 35, label: 'A2', zone: 'Goal Zone' },
  { id: 'A3', x: 10, y: 50, label: 'A3', zone: 'Goal Zone' },
  { id: 'A4', x: 10, y: 65, label: 'A4', zone: 'Goal Zone' },
  { id: 'A5', x: 10, y: 85, label: 'A5', zone: 'Goal Zone' },
  // Row 2 (Blue line area - 5 points)
  { id: 'B1', x: 30, y: 15, label: 'B1', zone: 'Defensive Zone' },
  { id: 'B2', x: 30, y: 35, label: 'B2', zone: 'Defensive Zone' },
  { id: 'B3', x: 30, y: 50, label: 'B3', zone: 'Defensive Zone' },
  { id: 'B4', x: 30, y: 65, label: 'B4', zone: 'Defensive Zone' },
  { id: 'B5', x: 30, y: 85, label: 'B5', zone: 'Defensive Zone' },
  // Row 3 (Center ice - 5 points)
  { id: 'C1', x: 50, y: 15, label: 'C1', zone: 'Center Ice' },
  { id: 'C2', x: 50, y: 35, label: 'C2', zone: 'Center Ice' },
  { id: 'C3', x: 50, y: 50, label: 'C3', zone: 'Center Ice' },
  { id: 'C4', x: 50, y: 65, label: 'C4', zone: 'Center Ice' },
  { id: 'C5', x: 50, y: 85, label: 'C5', zone: 'Center Ice' },
  // Row 4 (Offensive blue line - 5 points)
  { id: 'D1', x: 70, y: 15, label: 'D1', zone: 'Offensive Zone' },
  { id: 'D2', x: 70, y: 35, label: 'D2', zone: 'Offensive Zone' },
  { id: 'D3', x: 70, y: 50, label: 'D3', zone: 'Offensive Zone' },
  { id: 'D4', x: 70, y: 65, label: 'D4', zone: 'Offensive Zone' },
  { id: 'D5', x: 70, y: 85, label: 'D5', zone: 'Offensive Zone' },
  // Row 5 (Far goal zone - 5 points)
  { id: 'E1', x: 90, y: 15, label: 'E1', zone: 'Goal Zone' },
  { id: 'E2', x: 90, y: 35, label: 'E2', zone: 'Goal Zone' },
  { id: 'E3', x: 90, y: 50, label: 'E3', zone: 'Goal Zone' },
  { id: 'E4', x: 90, y: 65, label: 'E4', zone: 'Goal Zone' },
  { id: 'E5', x: 90, y: 85, label: 'E5', zone: 'Goal Zone' },
]

export const PRESET_35_POINTS: MeasurementPoint[] = [
  // 7 rows x 5 columns = 35 points
  ...['A', 'B', 'C', 'D', 'E', 'F', 'G'].flatMap((row, rowIdx) =>
    [1, 2, 3, 4, 5].map((col) => ({
      id: `${row}${col}`,
      x: 8 + rowIdx * 14, // Distribute across length
      y: 10 + (col - 1) * 20, // Distribute across width
      label: `${row}${col}`,
      zone: rowIdx < 2 ? 'Goal Zone' : rowIdx < 4 ? 'Defensive Zone' : rowIdx === 4 ? 'Center Ice' : 'Offensive Zone'
    }))
  )
]

export const PRESET_47_POINTS: MeasurementPoint[] = [
  // Additional points for more granular measurement
  // First create a denser grid with edge points
  ...['A', 'B', 'C', 'D', 'E', 'F', 'G'].flatMap((row, rowIdx) =>
    [1, 2, 3, 4, 5, 6, 7].map((col) => ({
      id: `${row}${col}`,
      x: 7 + rowIdx * 14.3,
      y: 7 + (col - 1) * 14.3,
      label: `${row}${col}`,
      zone: getZoneForPoint(rowIdx, col)
    }))
  ).slice(0, 47) // Take first 47 points
]

function getZoneForPoint(rowIdx: number, col: number): string {
  if (rowIdx === 0 || rowIdx === 6) return 'Goal Zone'
  if (rowIdx === 1 || rowIdx === 5) return rowIdx < 3 ? 'Defensive Zone' : 'Offensive Zone'
  if (rowIdx === 2 || rowIdx === 4) return rowIdx < 3 ? 'Defensive Zone' : 'Offensive Zone'
  return 'Center Ice'
}

export const PRESETS: Record<IceDepthPreset, { points: MeasurementPoint[]; description: string }> = {
  RINK_25: {
    points: PRESET_25_POINTS,
    description: '25 points - Basic coverage (5x5 grid)'
  },
  RINK_35: {
    points: PRESET_35_POINTS,
    description: '35 points - Standard coverage (7x5 grid)'
  },
  RINK_47: {
    points: PRESET_47_POINTS,
    description: '47 points - Detailed coverage (7x7 grid, trimmed corners)'
  },
  CUSTOM: {
    points: [],
    description: 'Custom configuration - Define your own points'
  }
}

// ==================== CONSTANTS & HELPERS ====================

export const DEFAULT_TARGET_DEPTH = 1.25 // Standard ice depth in inches

export const DEPTH_TOLERANCE = 0.125 // +/- 1/8 inch tolerance

export const DEPTH_STATUS_COLORS = {
  normal: '#22c55e', // Green
  low: '#ef4444',    // Red
  high: '#f59e0b'    // Amber/Orange
}

export const ZONE_COLORS: Record<string, string> = {
  'Goal Zone': '#3b82f6',
  'Defensive Zone': '#6366f1',
  'Center Ice': '#8b5cf6',
  'Offensive Zone': '#a855f7',
  'Blue Line': '#0ea5e9'
}

export function getDepthStatus(
  depth: number,
  targetDepth: number,
  tolerance: number = DEPTH_TOLERANCE
): 'normal' | 'low' | 'high' {
  if (depth < targetDepth - tolerance) return 'low'
  if (depth > targetDepth + tolerance) return 'high'
  return 'normal'
}

export function calculateReadingStats(
  measurements: PointMeasurement[],
  targetDepth: number,
  tolerance: number = DEPTH_TOLERANCE
): {
  averageDepth: number
  minDepth: number
  maxDepth: number
  pointsBelowTarget: number
  pointsAboveTarget: number
  hasIssues: boolean
} {
  if (measurements.length === 0) {
    return {
      averageDepth: 0,
      minDepth: 0,
      maxDepth: 0,
      pointsBelowTarget: 0,
      pointsAboveTarget: 0,
      hasIssues: false
    }
  }

  const depths = measurements.map(m => m.depth)
  const averageDepth = depths.reduce((a, b) => a + b, 0) / depths.length
  const minDepth = Math.min(...depths)
  const maxDepth = Math.max(...depths)

  let pointsBelowTarget = 0
  let pointsAboveTarget = 0

  measurements.forEach(m => {
    const status = getDepthStatus(m.depth, targetDepth, tolerance)
    if (status === 'low') pointsBelowTarget++
    if (status === 'high') pointsAboveTarget++
  })

  // Has issues if more than 20% of points are out of tolerance
  const hasIssues = (pointsBelowTarget + pointsAboveTarget) / measurements.length > 0.2

  return {
    averageDepth: Math.round(averageDepth * 1000) / 1000,
    minDepth,
    maxDepth,
    pointsBelowTarget,
    pointsAboveTarget,
    hasIssues
  }
}

export function formatDepth(depth: number): string {
  return `${depth.toFixed(2)}"`
}

export function formatDepthDifference(depth: number, target: number): string {
  const diff = depth - target
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(2)}"`
}

// ==================== UI HELPERS ====================

export interface IceDepthSummary {
  lastReading?: {
    date: string
    averageDepth: number
    hasIssues: boolean
  }
  readingsThisWeek: number
  readingsThisMonth: number
  averageDepthTrend: 'stable' | 'increasing' | 'decreasing'
}

export interface DepthTrendPoint {
  date: string
  averageDepth: number
  minDepth: number
  maxDepth: number
}
