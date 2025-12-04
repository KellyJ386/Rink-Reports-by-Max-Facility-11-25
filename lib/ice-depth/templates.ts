// Ice Depth Measurement Point Templates
// USA Hockey regulation rink: 200' × 85' (using these as SVG viewBox units)
// Coordinate system: (0,0) at top-left, x increases right, y increases down

import { MeasurementPoint, IceDepthTemplate, PresetType } from './types';

// Rink dimensions in SVG units (1 unit = 1 foot)
const RINK_LENGTH = 200;
const RINK_WIDTH = 85;

// Key line positions (x-coordinates)
const SOUTH_GOAL_LINE = 11;      // 11' from south end
const SOUTH_BLUE_LINE = 64;      // 64' from south end
const CENTER_LINE = 100;         // Center of rink
const NORTH_BLUE_LINE = 136;     // 136' from south end (64' from north)
const NORTH_GOAL_LINE = 189;     // 189' from south end (11' from north)

// Y positions for different point densities
const Y_5_POINTS = [7, 24.5, 42.5, 60.5, 78]; // 5 points across width
const Y_7_POINTS = [7, 17.5, 30, 42.5, 55, 67.5, 78]; // 7 points across width

// Helper to create points along a line with snake pattern
function createLinePoints(
  xPos: number,
  yPositions: number[],
  startId: number,
  zone: MeasurementPoint['zone'],
  reverse: boolean = false
): MeasurementPoint[] {
  const positions = reverse ? [...yPositions].reverse() : yPositions;
  return positions.map((y, idx) => ({
    id: startId + idx,
    x: xPos,
    y: y,
    label: `${startId + idx}`,
    zone,
  }));
}

// ==================== 25-POINT TEMPLATE ====================
// 5 lines × 5 points each = 25 points
// Snake pattern: left-to-right on odd lines, right-to-left on even lines

function generate25PointTemplate(): MeasurementPoint[] {
  const points: MeasurementPoint[] = [];

  // Line 1: South Goal Line (left to right)
  points.push(...createLinePoints(SOUTH_GOAL_LINE, Y_5_POINTS, 1, 'south-goal', false));

  // Line 2: South Blue Line (right to left - snake pattern)
  points.push(...createLinePoints(SOUTH_BLUE_LINE, Y_5_POINTS, 6, 'south-blue', true));

  // Line 3: Center Line (left to right)
  points.push(...createLinePoints(CENTER_LINE, Y_5_POINTS, 11, 'center', false));

  // Line 4: North Blue Line (right to left - snake pattern)
  points.push(...createLinePoints(NORTH_BLUE_LINE, Y_5_POINTS, 16, 'north-blue', true));

  // Line 5: North Goal Line (left to right)
  points.push(...createLinePoints(NORTH_GOAL_LINE, Y_5_POINTS, 21, 'north-goal', false));

  return points;
}

// ==================== 35-POINT TEMPLATE ====================
// 5 lines × 7 points each = 35 points

function generate35PointTemplate(): MeasurementPoint[] {
  const points: MeasurementPoint[] = [];

  // Line 1: South Goal Line (left to right)
  points.push(...createLinePoints(SOUTH_GOAL_LINE, Y_7_POINTS, 1, 'south-goal', false));

  // Line 2: South Blue Line (right to left - snake pattern)
  points.push(...createLinePoints(SOUTH_BLUE_LINE, Y_7_POINTS, 8, 'south-blue', true));

  // Line 3: Center Line (left to right)
  points.push(...createLinePoints(CENTER_LINE, Y_7_POINTS, 15, 'center', false));

  // Line 4: North Blue Line (right to left - snake pattern)
  points.push(...createLinePoints(NORTH_BLUE_LINE, Y_7_POINTS, 22, 'north-blue', true));

  // Line 5: North Goal Line (left to right)
  points.push(...createLinePoints(NORTH_GOAL_LINE, Y_7_POINTS, 29, 'north-goal', false));

  return points;
}

// ==================== 47-POINT TEMPLATE ====================
// 7 lines with varying point counts + face-off circle points

function generate47PointTemplate(): MeasurementPoint[] {
  const points: MeasurementPoint[] = [];

  // Intermediate line positions (between main lines)
  const SOUTH_INTERMEDIATE = 37.5;  // Between south goal and south blue
  const NORTH_INTERMEDIATE = 162.5; // Between north blue and north goal

  // Line 1: South Goal Line (7 points, left to right)
  points.push(...createLinePoints(SOUTH_GOAL_LINE, Y_7_POINTS, 1, 'south-goal', false));

  // Line 2: South Intermediate (5 points, right to left)
  points.push(...createLinePoints(SOUTH_INTERMEDIATE, Y_5_POINTS, 8, 'intermediate', true));

  // Line 3: South Blue Line (7 points, left to right)
  points.push(...createLinePoints(SOUTH_BLUE_LINE, Y_7_POINTS, 13, 'south-blue', false));

  // Line 4: Center Line (7 points, right to left)
  points.push(...createLinePoints(CENTER_LINE, Y_7_POINTS, 20, 'center', true));

  // Line 5: North Blue Line (7 points, left to right)
  points.push(...createLinePoints(NORTH_BLUE_LINE, Y_7_POINTS, 27, 'north-blue', false));

  // Line 6: North Intermediate (5 points, right to left)
  points.push(...createLinePoints(NORTH_INTERMEDIATE, Y_5_POINTS, 34, 'intermediate', true));

  // Line 7: North Goal Line (7 points, left to right)
  points.push(...createLinePoints(NORTH_GOAL_LINE, Y_7_POINTS, 39, 'north-goal', false));

  // Face-off circle points (2 additional in each zone)
  // South end face-off circles
  points.push({ id: 46, x: 31, y: 22, label: '46', zone: 'south-goal' }); // Left circle
  points.push({ id: 47, x: 31, y: 63, label: '47', zone: 'south-goal' }); // Right circle

  return points;
}

// ==================== TEMPLATE DEFINITIONS ====================

export const PRESET_TEMPLATES: Record<Exclude<PresetType, 'CUSTOM'>, IceDepthTemplate> = {
  RINK_25: {
    id: 'preset-25',
    name: '25-Point Standard',
    presetType: 'RINK_25',
    points: generate25PointTemplate(),
    pointCount: 25,
  },
  RINK_35: {
    id: 'preset-35',
    name: '35-Point Enhanced',
    presetType: 'RINK_35',
    points: generate35PointTemplate(),
    pointCount: 35,
  },
  RINK_47: {
    id: 'preset-47',
    name: '47-Point Comprehensive',
    presetType: 'RINK_47',
    points: generate47PointTemplate(),
    pointCount: 47,
  },
};

export function getTemplateByPreset(presetType: Exclude<PresetType, 'CUSTOM'>): IceDepthTemplate {
  return PRESET_TEMPLATES[presetType];
}

export function createCustomTemplate(
  id: string,
  name: string,
  points: MeasurementPoint[]
): IceDepthTemplate {
  return {
    id,
    name,
    presetType: 'CUSTOM',
    points,
    pointCount: points.length,
  };
}

// Get zone display name
export function getZoneDisplayName(zone: MeasurementPoint['zone']): string {
  switch (zone) {
    case 'north-goal': return 'North Goal';
    case 'north-blue': return 'North Blue Line';
    case 'center': return 'Center Ice';
    case 'south-blue': return 'South Blue Line';
    case 'south-goal': return 'South Goal';
    case 'intermediate': return 'Intermediate';
  }
}

// Rink constants for SVG rendering
export const RINK_CONSTANTS = {
  length: RINK_LENGTH,
  width: RINK_WIDTH,
  southGoalLine: SOUTH_GOAL_LINE,
  southBlueLine: SOUTH_BLUE_LINE,
  centerLine: CENTER_LINE,
  northBlueLine: NORTH_BLUE_LINE,
  northGoalLine: NORTH_GOAL_LINE,
  cornerRadius: 28, // Standard corner radius
  goalCreaseRadius: 6,
  faceOffCircleRadius: 15,
  centerCircleRadius: 15,
};
