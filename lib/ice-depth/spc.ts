// Statistical Process Control (SPC) Calculations for Ice Depth Module

import { MeasurementValue, DEFAULT_THRESHOLDS } from './types';

// Control chart constants (d2, A2, D3, D4 factors for sample sizes)
const CONTROL_CHART_FACTORS: Record<number, { d2: number; A2: number; D3: number; D4: number }> = {
  2: { d2: 1.128, A2: 1.880, D3: 0, D4: 3.267 },
  3: { d2: 1.693, A2: 1.023, D3: 0, D4: 2.574 },
  4: { d2: 2.059, A2: 0.729, D3: 0, D4: 2.282 },
  5: { d2: 2.326, A2: 0.577, D3: 0, D4: 2.114 },
  6: { d2: 2.534, A2: 0.483, D3: 0, D4: 2.004 },
  7: { d2: 2.704, A2: 0.419, D3: 0.076, D4: 1.924 },
  8: { d2: 2.847, A2: 0.373, D3: 0.136, D4: 1.864 },
  9: { d2: 2.970, A2: 0.337, D3: 0.184, D4: 1.816 },
  10: { d2: 3.078, A2: 0.308, D3: 0.223, D4: 1.777 },
};

export interface SPCDataPoint {
  sessionId: string;
  date: Date;
  values: number[];
  mean: number;
  range: number;
}

export interface ControlLimits {
  ucl: number; // Upper Control Limit
  cl: number;  // Center Line (mean)
  lcl: number; // Lower Control Limit
}

export interface XBarRChart {
  xBar: {
    data: { x: Date; y: number; sessionId: string }[];
    limits: ControlLimits;
    outOfControl: string[]; // Session IDs that are out of control
  };
  rChart: {
    data: { x: Date; y: number; sessionId: string }[];
    limits: ControlLimits;
    outOfControl: string[];
  };
}

export interface ProcessCapability {
  cp: number;   // Process Capability
  cpk: number;  // Process Capability Index (centered)
  pp: number;   // Process Performance
  ppk: number;  // Process Performance Index
  sigma: number; // Standard deviation
  mean: number;
  usl: number;  // Upper Spec Limit
  lsl: number;  // Lower Spec Limit
  withinSpec: number; // Percentage within spec
}

export interface TrendAnalysis {
  trend: 'improving' | 'stable' | 'degrading';
  slope: number;
  rSquared: number;
  forecast: number; // Predicted next value
  patterns: PatternDetection[];
}

export interface PatternDetection {
  type: 'run' | 'trend' | 'oscillation' | 'shift' | 'stratification';
  description: string;
  severity: 'info' | 'warning' | 'critical';
  startIndex: number;
  endIndex: number;
}

// Calculate mean of array
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Calculate standard deviation
export function calculateStdDev(values: number[], useSample: boolean = true): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / (useSample ? values.length - 1 : values.length);
  return Math.sqrt(variance);
}

// Calculate range of array
export function calculateRange(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

// Prepare data for X-bar R chart from sessions
export function prepareXBarRData(sessions: Array<{
  id: string;
  submittedAt: Date | string;
  measurements: Record<number, MeasurementValue>;
}>): SPCDataPoint[] {
  return sessions
    .map(session => {
      const values = Object.values(session.measurements)
        .filter(m => m?.depth !== null && m?.depth !== undefined)
        .map(m => m.depth as number);

      if (values.length === 0) return null;

      return {
        sessionId: session.id,
        date: new Date(session.submittedAt),
        values,
        mean: calculateMean(values),
        range: calculateRange(values),
      };
    })
    .filter((d): d is SPCDataPoint => d !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Calculate X-bar and R Chart control limits
export function calculateXBarRChart(data: SPCDataPoint[]): XBarRChart {
  if (data.length < 2) {
    const emptyLimits = { ucl: 0, cl: 0, lcl: 0 };
    return {
      xBar: { data: [], limits: emptyLimits, outOfControl: [] },
      rChart: { data: [], limits: emptyLimits, outOfControl: [] },
    };
  }

  // Calculate grand mean (X-double-bar) and average range (R-bar)
  const xDoubleBar = calculateMean(data.map(d => d.mean));
  const rBar = calculateMean(data.map(d => d.range));

  // Get average subgroup size
  const avgSubgroupSize = Math.round(calculateMean(data.map(d => d.values.length)));
  const factors = CONTROL_CHART_FACTORS[Math.min(Math.max(avgSubgroupSize, 2), 10)];

  // X-bar control limits
  const xBarLimits: ControlLimits = {
    ucl: xDoubleBar + factors.A2 * rBar,
    cl: xDoubleBar,
    lcl: xDoubleBar - factors.A2 * rBar,
  };

  // R chart control limits
  const rChartLimits: ControlLimits = {
    ucl: factors.D4 * rBar,
    cl: rBar,
    lcl: factors.D3 * rBar,
  };

  // Prepare chart data and detect out-of-control points
  const xBarData = data.map(d => ({
    x: d.date,
    y: d.mean,
    sessionId: d.sessionId,
  }));

  const rChartData = data.map(d => ({
    x: d.date,
    y: d.range,
    sessionId: d.sessionId,
  }));

  const xBarOutOfControl = data
    .filter(d => d.mean < xBarLimits.lcl || d.mean > xBarLimits.ucl)
    .map(d => d.sessionId);

  const rChartOutOfControl = data
    .filter(d => d.range < rChartLimits.lcl || d.range > rChartLimits.ucl)
    .map(d => d.sessionId);

  return {
    xBar: {
      data: xBarData,
      limits: xBarLimits,
      outOfControl: xBarOutOfControl,
    },
    rChart: {
      data: rChartData,
      limits: rChartLimits,
      outOfControl: rChartOutOfControl,
    },
  };
}

// Calculate Process Capability (Cp, Cpk, Pp, Ppk)
export function calculateProcessCapability(
  values: number[],
  usl: number = DEFAULT_THRESHOLDS.idealMax,
  lsl: number = DEFAULT_THRESHOLDS.idealMin
): ProcessCapability {
  if (values.length < 2) {
    return { cp: 0, cpk: 0, pp: 0, ppk: 0, sigma: 0, mean: 0, usl, lsl, withinSpec: 0 };
  }

  const mean = calculateMean(values);
  const sigma = calculateStdDev(values, true);

  // Cp = (USL - LSL) / 6σ
  const cp = (usl - lsl) / (6 * sigma);

  // Cpk = min((USL - μ) / 3σ, (μ - LSL) / 3σ)
  const cpupper = (usl - mean) / (3 * sigma);
  const cplower = (mean - lsl) / (3 * sigma);
  const cpk = Math.min(cpupper, cplower);

  // Pp and Ppk use overall standard deviation (same as Cp/Cpk for our purposes)
  const pp = cp;
  const ppk = cpk;

  // Calculate percentage within spec
  const withinSpec = (values.filter(v => v >= lsl && v <= usl).length / values.length) * 100;

  return { cp, cpk, pp, ppk, sigma, mean, usl, lsl, withinSpec };
}

// Detect patterns in control chart data (Western Electric Rules)
export function detectPatterns(data: SPCDataPoint[], limits: ControlLimits): PatternDetection[] {
  const patterns: PatternDetection[] = [];
  const values = data.map(d => d.mean);

  if (values.length < 7) return patterns;

  const oneThird = (limits.ucl - limits.cl) / 3;
  const twoThird = (limits.ucl - limits.cl) * 2 / 3;

  // Rule 1: Single point beyond 3 sigma (already handled in out-of-control)

  // Rule 2: 9 points in a row on same side of center
  for (let i = 0; i <= values.length - 9; i++) {
    const segment = values.slice(i, i + 9);
    const allAbove = segment.every(v => v > limits.cl);
    const allBelow = segment.every(v => v < limits.cl);
    if (allAbove || allBelow) {
      patterns.push({
        type: 'run',
        description: `9 consecutive points ${allAbove ? 'above' : 'below'} center line`,
        severity: 'warning',
        startIndex: i,
        endIndex: i + 8,
      });
    }
  }

  // Rule 3: 6 points in a row steadily increasing or decreasing
  for (let i = 0; i <= values.length - 6; i++) {
    const segment = values.slice(i, i + 6);
    let increasing = true;
    let decreasing = true;
    for (let j = 1; j < segment.length; j++) {
      if (segment[j] <= segment[j - 1]) increasing = false;
      if (segment[j] >= segment[j - 1]) decreasing = false;
    }
    if (increasing || decreasing) {
      patterns.push({
        type: 'trend',
        description: `6 points ${increasing ? 'increasing' : 'decreasing'} trend`,
        severity: 'warning',
        startIndex: i,
        endIndex: i + 5,
      });
    }
  }

  // Rule 4: 14 points alternating up and down (oscillation)
  for (let i = 0; i <= values.length - 14; i++) {
    const segment = values.slice(i, i + 14);
    let alternating = true;
    for (let j = 2; j < segment.length; j++) {
      const dir1 = segment[j - 1] - segment[j - 2];
      const dir2 = segment[j] - segment[j - 1];
      if (dir1 * dir2 >= 0) {
        alternating = false;
        break;
      }
    }
    if (alternating) {
      patterns.push({
        type: 'oscillation',
        description: '14 points alternating up and down',
        severity: 'info',
        startIndex: i,
        endIndex: i + 13,
      });
    }
  }

  // Rule 5: 2 out of 3 points beyond 2 sigma on same side
  for (let i = 0; i <= values.length - 3; i++) {
    const segment = values.slice(i, i + 3);
    const beyondUpperTwo = segment.filter(v => v > limits.cl + twoThird).length;
    const beyondLowerTwo = segment.filter(v => v < limits.cl - twoThird).length;
    if (beyondUpperTwo >= 2 || beyondLowerTwo >= 2) {
      patterns.push({
        type: 'shift',
        description: `2 of 3 points beyond 2σ ${beyondUpperTwo >= 2 ? 'above' : 'below'} center`,
        severity: 'warning',
        startIndex: i,
        endIndex: i + 2,
      });
    }
  }

  return patterns;
}

// Calculate trend analysis with linear regression
export function calculateTrendAnalysis(data: SPCDataPoint[]): TrendAnalysis {
  if (data.length < 3) {
    return {
      trend: 'stable',
      slope: 0,
      rSquared: 0,
      forecast: data.length > 0 ? data[data.length - 1].mean : 0,
      patterns: [],
    };
  }

  const values = data.map(d => d.mean);
  const n = values.length;

  // Linear regression: y = mx + b
  const xMean = (n - 1) / 2;
  const yMean = calculateMean(values);

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R-squared
  const predictions = values.map((_, i) => slope * i + intercept);
  const ssRes = values.reduce((sum, v, i) => sum + Math.pow(v - predictions[i], 2), 0);
  const ssTot = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0);
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  // Forecast next value
  const forecast = slope * n + intercept;

  // Determine trend direction (threshold: 0.5mm per session)
  let trend: 'improving' | 'stable' | 'degrading';
  if (Math.abs(slope) < 0.5) {
    trend = 'stable';
  } else if (slope > 0) {
    // Increasing depth - could be good or bad depending on current level
    trend = yMean < DEFAULT_THRESHOLDS.idealMin ? 'improving' : 'degrading';
  } else {
    trend = yMean > DEFAULT_THRESHOLDS.idealMax ? 'improving' : 'degrading';
  }

  // Detect patterns
  const dummyLimits: ControlLimits = {
    ucl: yMean + 3 * calculateStdDev(values),
    cl: yMean,
    lcl: yMean - 3 * calculateStdDev(values),
  };
  const patterns = detectPatterns(data, dummyLimits);

  return { trend, slope, rSquared, forecast, patterns };
}

// Get capability rating description
export function getCapabilityRating(cpk: number): {
  rating: 'excellent' | 'good' | 'marginal' | 'poor';
  description: string;
  color: string;
} {
  if (cpk >= 1.67) {
    return { rating: 'excellent', description: 'Excellent process capability', color: '#22c55e' };
  } else if (cpk >= 1.33) {
    return { rating: 'good', description: 'Good process capability', color: '#84cc16' };
  } else if (cpk >= 1.0) {
    return { rating: 'marginal', description: 'Marginal - improvement needed', color: '#eab308' };
  } else {
    return { rating: 'poor', description: 'Poor - immediate action required', color: '#ef4444' };
  }
}
