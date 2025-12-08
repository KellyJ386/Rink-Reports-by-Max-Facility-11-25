// Ice Depth Module Types and Preset Configurations

export interface MeasurementPoint {
  id: string
  x: number // Percentage (0-100) from left edge
  y: number // Percentage (0-100) from top edge
  label: string // Display label (e.g., "A1", "B2", "Center")
  zone?: 'goal-left' | 'neutral' | 'goal-right' | 'crease-left' | 'crease-right'
}

export interface IceDepthReading {
  pointId: string
  depth: number // Measured depth in current unit
  unit: 'inches' | 'mm'
}

export interface IceDepthSubmission {
  id: string
  rinkId: string
  submittedById: string
  submittedAt: Date
  outsideTemp?: number
  outsideTempUnit: 'F' | 'C'
  readings: IceDepthReading[]
  notes?: string
  status: 'draft' | 'submitted'
}

export interface IceDepthConfiguration {
  id: string
  rinkId: string
  presetType: 'RINK_25' | 'RINK_35' | 'RINK_47' | 'CUSTOM'
  measurementPoints: MeasurementPoint[]
  backgroundImage?: string
  targetDepth?: number // Ideal ice depth
  minDepth?: number // Minimum acceptable depth
  maxDepth?: number // Maximum acceptable depth
  depthUnit: 'inches' | 'mm'
}

export interface IceDepthHistoryEntry {
  id: string
  submittedAt: Date
  submittedBy: {
    firstName: string
    lastName: string
  }
  averageDepth: number
  minDepth: number
  maxDepth: number
  pointsBelowMin: number
  pointsAboveMax: number
}

// Color thresholds for visualization
export const DEPTH_COLORS = {
  tooThin: '#ef4444', // red-500 - below minimum
  warning: '#f59e0b', // amber-500 - approaching minimum
  optimal: '#22c55e', // green-500 - within range
  tooThick: '#3b82f6', // blue-500 - above maximum
} as const

// Standard ice depth targets (in inches)
export const DEFAULT_DEPTH_TARGETS = {
  target: 1.0, // Ideal: 1 inch
  min: 0.75, // Minimum: 3/4 inch
  max: 1.25, // Maximum: 1.25 inches
} as const

// ==================== PRESET CONFIGURATIONS ====================

/**
 * 25-Point Preset (5x5 Grid)
 * Standard configuration for smaller rinks or basic monitoring
 *
 * Layout:
 *   A1  A2  A3  A4  A5
 *   B1  B2  B3  B4  B5
 *   C1  C2  C3  C4  C5
 *   D1  D2  D3  D4  D5
 *   E1  E2  E3  E4  E5
 */
export const PRESET_RINK_25: MeasurementPoint[] = [
  // Row A (10% from top)
  { id: 'A1', x: 10, y: 10, label: 'A1', zone: 'goal-left' },
  { id: 'A2', x: 30, y: 10, label: 'A2', zone: 'goal-left' },
  { id: 'A3', x: 50, y: 10, label: 'A3', zone: 'neutral' },
  { id: 'A4', x: 70, y: 10, label: 'A4', zone: 'goal-right' },
  { id: 'A5', x: 90, y: 10, label: 'A5', zone: 'goal-right' },
  // Row B (30% from top)
  { id: 'B1', x: 10, y: 30, label: 'B1', zone: 'goal-left' },
  { id: 'B2', x: 30, y: 30, label: 'B2', zone: 'goal-left' },
  { id: 'B3', x: 50, y: 30, label: 'B3', zone: 'neutral' },
  { id: 'B4', x: 70, y: 30, label: 'B4', zone: 'goal-right' },
  { id: 'B5', x: 90, y: 30, label: 'B5', zone: 'goal-right' },
  // Row C (50% from top - center)
  { id: 'C1', x: 10, y: 50, label: 'C1', zone: 'goal-left' },
  { id: 'C2', x: 30, y: 50, label: 'C2', zone: 'goal-left' },
  { id: 'C3', x: 50, y: 50, label: 'C3', zone: 'neutral' },
  { id: 'C4', x: 70, y: 50, label: 'C4', zone: 'goal-right' },
  { id: 'C5', x: 90, y: 50, label: 'C5', zone: 'goal-right' },
  // Row D (70% from top)
  { id: 'D1', x: 10, y: 70, label: 'D1', zone: 'goal-left' },
  { id: 'D2', x: 30, y: 70, label: 'D2', zone: 'goal-left' },
  { id: 'D3', x: 50, y: 70, label: 'D3', zone: 'neutral' },
  { id: 'D4', x: 70, y: 70, label: 'D4', zone: 'goal-right' },
  { id: 'D5', x: 90, y: 70, label: 'D5', zone: 'goal-right' },
  // Row E (90% from top)
  { id: 'E1', x: 10, y: 90, label: 'E1', zone: 'goal-left' },
  { id: 'E2', x: 30, y: 90, label: 'E2', zone: 'goal-left' },
  { id: 'E3', x: 50, y: 90, label: 'E3', zone: 'neutral' },
  { id: 'E4', x: 70, y: 90, label: 'E4', zone: 'goal-right' },
  { id: 'E5', x: 90, y: 90, label: 'E5', zone: 'goal-right' },
]

/**
 * 35-Point Preset (5x7 Grid)
 * Enhanced configuration for standard rinks
 *
 * Layout:
 *   A1  A2  A3  A4  A5  A6  A7
 *   B1  B2  B3  B4  B5  B6  B7
 *   C1  C2  C3  C4  C5  C6  C7
 *   D1  D2  D3  D4  D5  D6  D7
 *   E1  E2  E3  E4  E5  E6  E7
 */
export const PRESET_RINK_35: MeasurementPoint[] = [
  // Row A (10% from top)
  { id: 'A1', x: 7, y: 10, label: 'A1', zone: 'goal-left' },
  { id: 'A2', x: 21, y: 10, label: 'A2', zone: 'goal-left' },
  { id: 'A3', x: 36, y: 10, label: 'A3', zone: 'goal-left' },
  { id: 'A4', x: 50, y: 10, label: 'A4', zone: 'neutral' },
  { id: 'A5', x: 64, y: 10, label: 'A5', zone: 'goal-right' },
  { id: 'A6', x: 79, y: 10, label: 'A6', zone: 'goal-right' },
  { id: 'A7', x: 93, y: 10, label: 'A7', zone: 'goal-right' },
  // Row B (30% from top)
  { id: 'B1', x: 7, y: 30, label: 'B1', zone: 'goal-left' },
  { id: 'B2', x: 21, y: 30, label: 'B2', zone: 'goal-left' },
  { id: 'B3', x: 36, y: 30, label: 'B3', zone: 'goal-left' },
  { id: 'B4', x: 50, y: 30, label: 'B4', zone: 'neutral' },
  { id: 'B5', x: 64, y: 30, label: 'B5', zone: 'goal-right' },
  { id: 'B6', x: 79, y: 30, label: 'B6', zone: 'goal-right' },
  { id: 'B7', x: 93, y: 30, label: 'B7', zone: 'goal-right' },
  // Row C (50% from top - center)
  { id: 'C1', x: 7, y: 50, label: 'C1', zone: 'goal-left' },
  { id: 'C2', x: 21, y: 50, label: 'C2', zone: 'goal-left' },
  { id: 'C3', x: 36, y: 50, label: 'C3', zone: 'goal-left' },
  { id: 'C4', x: 50, y: 50, label: 'C4', zone: 'neutral' },
  { id: 'C5', x: 64, y: 50, label: 'C5', zone: 'goal-right' },
  { id: 'C6', x: 79, y: 50, label: 'C6', zone: 'goal-right' },
  { id: 'C7', x: 93, y: 50, label: 'C7', zone: 'goal-right' },
  // Row D (70% from top)
  { id: 'D1', x: 7, y: 70, label: 'D1', zone: 'goal-left' },
  { id: 'D2', x: 21, y: 70, label: 'D2', zone: 'goal-left' },
  { id: 'D3', x: 36, y: 70, label: 'D3', zone: 'goal-left' },
  { id: 'D4', x: 50, y: 70, label: 'D4', zone: 'neutral' },
  { id: 'D5', x: 64, y: 70, label: 'D5', zone: 'goal-right' },
  { id: 'D6', x: 79, y: 70, label: 'D6', zone: 'goal-right' },
  { id: 'D7', x: 93, y: 70, label: 'D7', zone: 'goal-right' },
  // Row E (90% from top)
  { id: 'E1', x: 7, y: 90, label: 'E1', zone: 'goal-left' },
  { id: 'E2', x: 21, y: 90, label: 'E2', zone: 'goal-left' },
  { id: 'E3', x: 36, y: 90, label: 'E3', zone: 'goal-left' },
  { id: 'E4', x: 50, y: 90, label: 'E4', zone: 'neutral' },
  { id: 'E5', x: 64, y: 90, label: 'E5', zone: 'goal-right' },
  { id: 'E6', x: 79, y: 90, label: 'E6', zone: 'goal-right' },
  { id: 'E7', x: 93, y: 90, label: 'E7', zone: 'goal-right' },
]

/**
 * 47-Point Preset (Detailed Layout)
 * Comprehensive configuration with extra points near goals and high-traffic areas
 * Includes crease measurements and face-off circles
 *
 * Standard 5x7 grid (35 points) + 12 additional strategic points:
 * - 4 crease points (2 per goal)
 * - 4 face-off circle points
 * - 4 corner points
 */
export const PRESET_RINK_47: MeasurementPoint[] = [
  // Row A (10% from top)
  { id: 'A1', x: 7, y: 10, label: 'A1', zone: 'goal-left' },
  { id: 'A2', x: 21, y: 10, label: 'A2', zone: 'goal-left' },
  { id: 'A3', x: 36, y: 10, label: 'A3', zone: 'goal-left' },
  { id: 'A4', x: 50, y: 10, label: 'A4', zone: 'neutral' },
  { id: 'A5', x: 64, y: 10, label: 'A5', zone: 'goal-right' },
  { id: 'A6', x: 79, y: 10, label: 'A6', zone: 'goal-right' },
  { id: 'A7', x: 93, y: 10, label: 'A7', zone: 'goal-right' },
  // Row B (30% from top)
  { id: 'B1', x: 7, y: 30, label: 'B1', zone: 'goal-left' },
  { id: 'B2', x: 21, y: 30, label: 'B2', zone: 'goal-left' },
  { id: 'B3', x: 36, y: 30, label: 'B3', zone: 'goal-left' },
  { id: 'B4', x: 50, y: 30, label: 'B4', zone: 'neutral' },
  { id: 'B5', x: 64, y: 30, label: 'B5', zone: 'goal-right' },
  { id: 'B6', x: 79, y: 30, label: 'B6', zone: 'goal-right' },
  { id: 'B7', x: 93, y: 30, label: 'B7', zone: 'goal-right' },
  // Row C (50% from top - center)
  { id: 'C1', x: 7, y: 50, label: 'C1', zone: 'goal-left' },
  { id: 'C2', x: 21, y: 50, label: 'C2', zone: 'goal-left' },
  { id: 'C3', x: 36, y: 50, label: 'C3', zone: 'goal-left' },
  { id: 'C4', x: 50, y: 50, label: 'C4', zone: 'neutral' },
  { id: 'C5', x: 64, y: 50, label: 'C5', zone: 'goal-right' },
  { id: 'C6', x: 79, y: 50, label: 'C6', zone: 'goal-right' },
  { id: 'C7', x: 93, y: 50, label: 'C7', zone: 'goal-right' },
  // Row D (70% from top)
  { id: 'D1', x: 7, y: 70, label: 'D1', zone: 'goal-left' },
  { id: 'D2', x: 21, y: 70, label: 'D2', zone: 'goal-left' },
  { id: 'D3', x: 36, y: 70, label: 'D3', zone: 'goal-left' },
  { id: 'D4', x: 50, y: 70, label: 'D4', zone: 'neutral' },
  { id: 'D5', x: 64, y: 70, label: 'D5', zone: 'goal-right' },
  { id: 'D6', x: 79, y: 70, label: 'D6', zone: 'goal-right' },
  { id: 'D7', x: 93, y: 70, label: 'D7', zone: 'goal-right' },
  // Row E (90% from top)
  { id: 'E1', x: 7, y: 90, label: 'E1', zone: 'goal-left' },
  { id: 'E2', x: 21, y: 90, label: 'E2', zone: 'goal-left' },
  { id: 'E3', x: 36, y: 90, label: 'E3', zone: 'goal-left' },
  { id: 'E4', x: 50, y: 90, label: 'E4', zone: 'neutral' },
  { id: 'E5', x: 64, y: 90, label: 'E5', zone: 'goal-right' },
  { id: 'E6', x: 79, y: 90, label: 'E6', zone: 'goal-right' },
  { id: 'E7', x: 93, y: 90, label: 'E7', zone: 'goal-right' },
  // Crease points (left goal)
  { id: 'CL1', x: 7, y: 45, label: 'CL1', zone: 'crease-left' },
  { id: 'CL2', x: 7, y: 55, label: 'CL2', zone: 'crease-left' },
  // Crease points (right goal)
  { id: 'CR1', x: 93, y: 45, label: 'CR1', zone: 'crease-right' },
  { id: 'CR2', x: 93, y: 55, label: 'CR2', zone: 'crease-right' },
  // Face-off circles (left zone)
  { id: 'FL1', x: 21, y: 40, label: 'FL1', zone: 'goal-left' },
  { id: 'FL2', x: 21, y: 60, label: 'FL2', zone: 'goal-left' },
  // Face-off circles (right zone)
  { id: 'FR1', x: 79, y: 40, label: 'FR1', zone: 'goal-right' },
  { id: 'FR2', x: 79, y: 60, label: 'FR2', zone: 'goal-right' },
  // Corner points
  { id: 'CNR1', x: 3, y: 20, label: 'CNR1', zone: 'goal-left' },
  { id: 'CNR2', x: 3, y: 80, label: 'CNR2', zone: 'goal-left' },
  { id: 'CNR3', x: 97, y: 20, label: 'CNR3', zone: 'goal-right' },
  { id: 'CNR4', x: 97, y: 80, label: 'CNR4', zone: 'goal-right' },
]

// Preset map for easy lookup
export const PRESETS = {
  RINK_25: PRESET_RINK_25,
  RINK_35: PRESET_RINK_35,
  RINK_47: PRESET_RINK_47,
} as const

export type PresetType = keyof typeof PRESETS

// Helper function to get preset points
export function getPresetPoints(presetType: PresetType): MeasurementPoint[] {
  return PRESETS[presetType]
}

// Helper function to get depth status color
export function getDepthColor(
  depth: number,
  min: number = DEFAULT_DEPTH_TARGETS.min,
  max: number = DEFAULT_DEPTH_TARGETS.max
): string {
  if (depth < min) return DEPTH_COLORS.tooThin
  if (depth < min + 0.1) return DEPTH_COLORS.warning // Within 0.1" of minimum
  if (depth > max) return DEPTH_COLORS.tooThick
  return DEPTH_COLORS.optimal
}

// Helper to calculate stats from readings
export function calculateDepthStats(readings: IceDepthReading[]): {
  average: number
  min: number
  max: number
  count: number
} {
  if (readings.length === 0) {
    return { average: 0, min: 0, max: 0, count: 0 }
  }
  const depths = readings.map((r) => r.depth)
  const sum = depths.reduce((a, b) => a + b, 0)
  return {
    average: Math.round((sum / depths.length) * 100) / 100,
    min: Math.min(...depths),
    max: Math.max(...depths),
    count: readings.length,
  }
}
