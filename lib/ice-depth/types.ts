// Ice Depth Module Types

export interface MeasurementPoint {
  id: number;
  x: number; // SVG x coordinate (0-200 scale, representing feet)
  y: number; // SVG y coordinate (0-85 scale, representing feet)
  label: string;
  zone: 'north-goal' | 'north-blue' | 'center' | 'south-blue' | 'south-goal' | 'intermediate';
}

export interface MeasurementValue {
  pointId: number;
  depth: number | null; // in millimeters
  method: 'manual' | 'bluetooth';
  deviceId?: string;
  measuredAt?: Date;
}

export type DepthStatus = 'ideal' | 'warning' | 'critical' | 'unmeasured';

export interface DepthThresholds {
  idealMin: number; // 25.4mm (1")
  idealMax: number; // 44.45mm (1.75")
  warningMin: number; // 19.05mm (0.75")
  warningMax: number; // 50.8mm (2")
}

export const DEFAULT_THRESHOLDS: DepthThresholds = {
  idealMin: 25.4,
  idealMax: 44.45,
  warningMin: 19.05,
  warningMax: 50.8,
};

export function getDepthStatus(depth: number | null, thresholds: DepthThresholds = DEFAULT_THRESHOLDS): DepthStatus {
  if (depth === null) return 'unmeasured';
  if (depth >= thresholds.idealMin && depth <= thresholds.idealMax) return 'ideal';
  if (depth >= thresholds.warningMin && depth <= thresholds.warningMax) return 'warning';
  return 'critical';
}

export function getStatusColor(status: DepthStatus): string {
  switch (status) {
    case 'ideal': return '#22c55e'; // green-500
    case 'warning': return '#eab308'; // yellow-500
    case 'critical': return '#ef4444'; // red-500
    case 'unmeasured': return '#1f2937'; // gray-800
  }
}

export type PresetType = 'RINK_25' | 'RINK_35' | 'RINK_47' | 'CUSTOM';

export interface IceDepthTemplate {
  id: string;
  name: string;
  presetType: PresetType;
  points: MeasurementPoint[];
  pointCount: number;
}

export interface IceDepthSession {
  id: string;
  rinkId: string;
  templateId: string;
  templateType: PresetType;
  measurements: Record<number, MeasurementValue>;
  airTemp?: number;
  iceTemp?: number;
  humidity?: number;
  notes?: string;
  technicianId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in-progress' | 'completed' | 'draft';
}

export interface ZoneStatistics {
  zone: string;
  pointCount: number;
  measuredCount: number;
  avgDepth: number | null;
  minDepth: number | null;
  maxDepth: number | null;
  stdDev: number | null;
}

// Utility functions for mm/inch conversion
export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

export function formatDepth(mm: number | null, unit: 'mm' | 'in' = 'mm'): string {
  if (mm === null) return '—';
  if (unit === 'in') {
    return `${mmToInches(mm).toFixed(3)}"`;
  }
  return `${mm.toFixed(1)}mm`;
}
