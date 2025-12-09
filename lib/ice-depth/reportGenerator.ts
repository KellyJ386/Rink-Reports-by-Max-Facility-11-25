// Ice Depth Report Generator
// Generates HTML/PDF reports with rink diagrams and measurement data

import {
  MeasurementPoint,
  MeasurementValue,
  getDepthStatus,
  getStatusColor,
  formatDepth,
  DEFAULT_THRESHOLDS,
  ZoneStatistics,
} from './types';
import { RINK_CONSTANTS, getZoneDisplayName } from './templates';
import { calculateProcessCapability, getCapabilityRating } from './spc';

export interface ReportData {
  session: {
    id: string;
    submittedAt: Date | string;
    technicianName: string;
    rinkName: string;
    facilityName: string;
  };
  template: {
    name: string;
    pointCount: number;
  };
  points: MeasurementPoint[];
  measurements: Record<number, MeasurementValue>;
  environmental?: {
    airTemp?: number;
    iceTemp?: number;
    humidity?: number;
  };
  notes?: string;
}

export interface ReportOptions {
  includeRinkDiagram: boolean;
  includeMeasurementTable: boolean;
  includeZoneStats: boolean;
  includeSPC: boolean;
  unit: 'mm' | 'in';
  logoUrl?: string;
}

// Calculate zone statistics
function calculateZoneStats(
  points: MeasurementPoint[],
  measurements: Record<number, MeasurementValue>
): ZoneStatistics[] {
  const zones = new Map<string, { points: MeasurementPoint[]; values: number[] }>();

  points.forEach(point => {
    if (!zones.has(point.zone)) {
      zones.set(point.zone, { points: [], values: [] });
    }
    const zone = zones.get(point.zone)!;
    zone.points.push(point);

    const measurement = measurements[point.id];
    if (measurement?.depth !== null && measurement?.depth !== undefined) {
      zone.values.push(measurement.depth);
    }
  });

  const stats: ZoneStatistics[] = [];
  const zoneOrder = ['south-goal', 'south-blue', 'center', 'north-blue', 'north-goal', 'intermediate'];

  zoneOrder.forEach(zoneName => {
    const zone = zones.get(zoneName);
    if (!zone || zone.points.length === 0) return;

    const values = zone.values;
    const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

    let stdDev = null;
    if (values.length > 1 && mean !== null) {
      const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
      stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
    }

    stats.push({
      zone: zoneName,
      pointCount: zone.points.length,
      measuredCount: values.length,
      avgDepth: mean,
      minDepth: values.length > 0 ? Math.min(...values) : null,
      maxDepth: values.length > 0 ? Math.max(...values) : null,
      stdDev,
    });
  });

  return stats;
}

// Generate SVG rink diagram for report
function generateRinkSVG(
  points: MeasurementPoint[],
  measurements: Record<number, MeasurementValue>,
  width: number = 500
): string {
  const {
    length,
    width: rinkWidth,
    southGoalLine,
    southBlueLine,
    centerLine,
    northBlueLine,
    northGoalLine,
    cornerRadius,
    faceOffCircleRadius,
    centerCircleRadius,
  } = RINK_CONSTANTS;

  const height = (rinkWidth / length) * width;
  const scale = width / (length + 4);

  const rinkOutlinePath = `
    M ${cornerRadius * scale} 0
    L ${(length - cornerRadius) * scale} 0
    Q ${length * scale} 0 ${length * scale} ${cornerRadius * scale}
    L ${length * scale} ${(rinkWidth - cornerRadius) * scale}
    Q ${length * scale} ${rinkWidth * scale} ${(length - cornerRadius) * scale} ${rinkWidth * scale}
    L ${cornerRadius * scale} ${rinkWidth * scale}
    Q 0 ${rinkWidth * scale} 0 ${(rinkWidth - cornerRadius) * scale}
    L 0 ${cornerRadius * scale}
    Q 0 0 ${cornerRadius * scale} 0
    Z
  `;

  const pointsSVG = points.map(point => {
    const measurement = measurements[point.id];
    const status = getDepthStatus(measurement?.depth ?? null, DEFAULT_THRESHOLDS);
    const color = getStatusColor(status);
    const x = point.x * scale;
    const y = point.y * scale;

    return `
      <circle cx="${x}" cy="${y}" r="${4 * scale}" fill="${color}" stroke="#fff" stroke-width="1"/>
      <text x="${x}" y="${y + 1}" text-anchor="middle" font-size="${3 * scale}" font-weight="bold" fill="#fff">${point.label}</text>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;">
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      <g transform="translate(${2 * scale}, ${2 * scale})">
        <!-- Rink Surface -->
        <path d="${rinkOutlinePath}" fill="#e0f2fe" stroke="#1e3a5f" stroke-width="1"/>

        <!-- Goal Lines -->
        <line x1="${southGoalLine * scale}" y1="0" x2="${southGoalLine * scale}" y2="${rinkWidth * scale}" stroke="#dc2626" stroke-width="2"/>
        <line x1="${northGoalLine * scale}" y1="0" x2="${northGoalLine * scale}" y2="${rinkWidth * scale}" stroke="#dc2626" stroke-width="2"/>

        <!-- Blue Lines -->
        <line x1="${southBlueLine * scale}" y1="0" x2="${southBlueLine * scale}" y2="${rinkWidth * scale}" stroke="#1e40af" stroke-width="3"/>
        <line x1="${northBlueLine * scale}" y1="0" x2="${northBlueLine * scale}" y2="${rinkWidth * scale}" stroke="#1e40af" stroke-width="3"/>

        <!-- Center Line -->
        <line x1="${centerLine * scale}" y1="0" x2="${centerLine * scale}" y2="${rinkWidth * scale}" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,5"/>

        <!-- Center Circle -->
        <circle cx="${centerLine * scale}" cy="${(rinkWidth / 2) * scale}" r="${centerCircleRadius * scale}" fill="none" stroke="#1e40af" stroke-width="1"/>

        <!-- Face-off Circles -->
        <circle cx="${31 * scale}" cy="${22 * scale}" r="${faceOffCircleRadius * scale}" fill="none" stroke="#dc2626" stroke-width="1"/>
        <circle cx="${31 * scale}" cy="${63 * scale}" r="${faceOffCircleRadius * scale}" fill="none" stroke="#dc2626" stroke-width="1"/>
        <circle cx="${169 * scale}" cy="${22 * scale}" r="${faceOffCircleRadius * scale}" fill="none" stroke="#dc2626" stroke-width="1"/>
        <circle cx="${169 * scale}" cy="${63 * scale}" r="${faceOffCircleRadius * scale}" fill="none" stroke="#dc2626" stroke-width="1"/>

        <!-- Measurement Points -->
        ${pointsSVG}
      </g>
    </svg>
  `;
}

// Generate HTML report
export function generateHTMLReport(data: ReportData, options: ReportOptions): string {
  const { session, template, points, measurements, environmental, notes } = data;
  const { unit, includeRinkDiagram, includeMeasurementTable, includeZoneStats, includeSPC } = options;

  // Calculate statistics
  const allValues = Object.values(measurements)
    .filter(m => m?.depth !== null && m?.depth !== undefined)
    .map(m => m.depth as number);

  const overallStats = {
    count: allValues.length,
    avg: allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : null,
    min: allValues.length > 0 ? Math.min(...allValues) : null,
    max: allValues.length > 0 ? Math.max(...allValues) : null,
  };

  const zoneStats = calculateZoneStats(points, measurements);
  const capability = allValues.length >= 2 ? calculateProcessCapability(allValues) : null;
  const capabilityRating = capability ? getCapabilityRating(capability.cpk) : null;

  const submittedDate = new Date(session.submittedAt);
  const formattedDate = submittedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ice Depth Report - ${session.rinkName} - ${submittedDate.toLocaleDateString()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #1f2937; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
    .header-left h1 { font-size: 20px; color: #1e40af; margin-bottom: 4px; }
    .header-left p { color: #6b7280; font-size: 11px; }
    .header-right { text-align: right; }
    .header-right .date { font-size: 14px; font-weight: 600; }
    .header-right .facility { color: #6b7280; }

    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: 600; color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }

    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
    .info-item { background: #f9fafb; padding: 10px; border-radius: 6px; }
    .info-item .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
    .info-item .value { font-size: 16px; font-weight: 600; color: #111827; }

    .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .stat-box { background: #f0f9ff; padding: 10px; border-radius: 6px; text-align: center; }
    .stat-box .value { font-size: 18px; font-weight: 700; color: #1e40af; }
    .stat-box .label { font-size: 10px; color: #6b7280; }

    .rink-diagram { text-align: center; margin: 15px 0; }
    .legend { display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 11px; }
    .legend-item { display: flex; align-items: center; gap: 5px; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }

    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    tr:hover { background: #f9fafb; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: 'SF Mono', Monaco, monospace; }

    .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
    .status-ideal { background: #22c55e; }
    .status-warning { background: #eab308; }
    .status-critical { background: #ef4444; }
    .status-unmeasured { background: #9ca3af; }

    .zone-table { margin-top: 15px; }

    .capability-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-top: 15px; }
    .capability-card.warning { background: #fefce8; border-color: #fef08a; }
    .capability-card.critical { background: #fef2f2; border-color: #fecaca; }
    .capability-header { display: flex; justify-content: space-between; align-items: center; }
    .capability-values { display: flex; gap: 30px; margin-top: 10px; }
    .capability-item { text-align: center; }
    .capability-item .value { font-size: 24px; font-weight: 700; }
    .capability-item .label { font-size: 10px; color: #6b7280; }

    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-top: 10px; }

    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #9ca3af; font-size: 10px; }

    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Ice Depth Measurement Report</h1>
      <p>${session.rinkName} - ${template.name} (${template.pointCount} points)</p>
    </div>
    <div class="header-right">
      <div class="date">${formattedDate}</div>
      <div class="facility">${session.facilityName}</div>
    </div>
  </div>

  <div class="section">
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Technician</div>
        <div class="value">${session.technicianName}</div>
      </div>
      <div class="info-item">
        <div class="label">Points Measured</div>
        <div class="value">${overallStats.count} / ${template.pointCount}</div>
      </div>
      ${environmental?.airTemp !== undefined ? `
      <div class="info-item">
        <div class="label">Air Temperature</div>
        <div class="value">${environmental.airTemp}°F</div>
      </div>` : ''}
      ${environmental?.iceTemp !== undefined ? `
      <div class="info-item">
        <div class="label">Ice Temperature</div>
        <div class="value">${environmental.iceTemp}°F</div>
      </div>` : ''}
      ${environmental?.humidity !== undefined ? `
      <div class="info-item">
        <div class="label">Humidity</div>
        <div class="value">${environmental.humidity}%</div>
      </div>` : ''}
    </div>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="value">${overallStats.avg !== null ? formatDepth(overallStats.avg, unit) : '—'}</div>
        <div class="label">Average</div>
      </div>
      <div class="stat-box">
        <div class="value">${overallStats.min !== null ? formatDepth(overallStats.min, unit) : '—'}</div>
        <div class="label">Minimum</div>
      </div>
      <div class="stat-box">
        <div class="value">${overallStats.max !== null ? formatDepth(overallStats.max, unit) : '—'}</div>
        <div class="label">Maximum</div>
      </div>
      <div class="stat-box">
        <div class="value">${overallStats.min !== null && overallStats.max !== null ? formatDepth(overallStats.max - overallStats.min, unit) : '—'}</div>
        <div class="label">Range</div>
      </div>
      <div class="stat-box">
        <div class="value">${((overallStats.count / template.pointCount) * 100).toFixed(0)}%</div>
        <div class="label">Complete</div>
      </div>
    </div>
  </div>

  ${includeRinkDiagram ? `
  <div class="section">
    <div class="section-title">Rink Diagram</div>
    <div class="rink-diagram">
      ${generateRinkSVG(points, measurements)}
    </div>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#22c55e"></div> Ideal (25.4-44.45mm)</div>
      <div class="legend-item"><div class="legend-dot" style="background:#eab308"></div> Warning</div>
      <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div> Critical</div>
      <div class="legend-item"><div class="legend-dot" style="background:#1f2937"></div> Unmeasured</div>
    </div>
  </div>` : ''}

  ${includeZoneStats ? `
  <div class="section">
    <div class="section-title">Zone Statistics</div>
    <table class="zone-table">
      <thead>
        <tr>
          <th>Zone</th>
          <th class="text-center">Measured</th>
          <th class="text-right">Average</th>
          <th class="text-right">Min</th>
          <th class="text-right">Max</th>
          <th class="text-right">Std Dev</th>
        </tr>
      </thead>
      <tbody>
        ${zoneStats.map(stat => `
        <tr>
          <td>${getZoneDisplayName(stat.zone as MeasurementPoint['zone'])}</td>
          <td class="text-center">${stat.measuredCount}/${stat.pointCount}</td>
          <td class="text-right font-mono">${stat.avgDepth !== null ? formatDepth(stat.avgDepth, unit) : '—'}</td>
          <td class="text-right font-mono">${stat.minDepth !== null ? formatDepth(stat.minDepth, unit) : '—'}</td>
          <td class="text-right font-mono">${stat.maxDepth !== null ? formatDepth(stat.maxDepth, unit) : '—'}</td>
          <td class="text-right font-mono">${stat.stdDev !== null ? formatDepth(stat.stdDev, unit) : '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${includeSPC && capability ? `
  <div class="section">
    <div class="section-title">Process Capability</div>
    <div class="capability-card ${capabilityRating?.rating === 'poor' ? 'critical' : capabilityRating?.rating === 'marginal' ? 'warning' : ''}">
      <div class="capability-header">
        <div>
          <strong>${capabilityRating?.rating.toUpperCase()}</strong>
          <span style="margin-left:10px;color:#6b7280">${capabilityRating?.description}</span>
        </div>
        <div style="font-size:11px;color:#6b7280">
          Within Spec: ${capability.withinSpec.toFixed(1)}%
        </div>
      </div>
      <div class="capability-values">
        <div class="capability-item">
          <div class="value">${capability.cpk.toFixed(2)}</div>
          <div class="label">Cpk</div>
        </div>
        <div class="capability-item">
          <div class="value">${capability.cp.toFixed(2)}</div>
          <div class="label">Cp</div>
        </div>
        <div class="capability-item">
          <div class="value">${capability.sigma.toFixed(2)}</div>
          <div class="label">Sigma (σ)</div>
        </div>
        <div class="capability-item">
          <div class="value">${formatDepth(capability.mean, unit)}</div>
          <div class="label">Mean</div>
        </div>
      </div>
    </div>
  </div>` : ''}

  ${includeMeasurementTable ? `
  <div class="section">
    <div class="section-title">Measurement Details</div>
    <table>
      <thead>
        <tr>
          <th style="width:60px">Point</th>
          <th>Zone</th>
          <th class="text-right">Depth</th>
          <th class="text-center">Status</th>
          <th class="text-center">Method</th>
        </tr>
      </thead>
      <tbody>
        ${points.map(point => {
          const m = measurements[point.id];
          const status = getDepthStatus(m?.depth ?? null, DEFAULT_THRESHOLDS);
          return `
          <tr>
            <td class="font-mono">#${point.label}</td>
            <td>${getZoneDisplayName(point.zone)}</td>
            <td class="text-right font-mono">${m?.depth !== null && m?.depth !== undefined ? formatDepth(m.depth, unit) : '—'}</td>
            <td class="text-center">
              <span class="status-dot status-${status}"></span>${status}
            </td>
            <td class="text-center">${m?.method || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${notes ? `
  <div class="section">
    <div class="section-title">Notes</div>
    <div class="notes-box">${notes}</div>
  </div>` : ''}

  <div class="footer">
    <div>Report ID: ${session.id}</div>
    <div>Generated by MFO Ice Rink Management System</div>
    <div>${new Date().toLocaleString()}</div>
  </div>
</body>
</html>`;

  return html;
}

// Export report configuration presets
export const REPORT_PRESETS = {
  full: {
    includeRinkDiagram: true,
    includeMeasurementTable: true,
    includeZoneStats: true,
    includeSPC: true,
    unit: 'mm' as const,
  },
  summary: {
    includeRinkDiagram: true,
    includeMeasurementTable: false,
    includeZoneStats: true,
    includeSPC: false,
    unit: 'mm' as const,
  },
  detailed: {
    includeRinkDiagram: true,
    includeMeasurementTable: true,
    includeZoneStats: true,
    includeSPC: true,
    unit: 'mm' as const,
  },
};
