'use client';

import React, { useMemo } from 'react';
import {
  MeasurementPoint,
  MeasurementValue,
  ZoneStatistics as ZoneStats,
  formatDepth,
  getDepthStatus,
  DEFAULT_THRESHOLDS,
} from '@/lib/ice-depth/types';
import { getZoneDisplayName } from '@/lib/ice-depth/templates';

interface ZoneStatisticsProps {
  points: MeasurementPoint[];
  measurements: Record<number, MeasurementValue>;
  unit: 'mm' | 'in';
}

function calculateStandardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

export function ZoneStatistics({ points, measurements, unit }: ZoneStatisticsProps) {
  const zoneStats = useMemo(() => {
    const zones = new Map<string, { points: MeasurementPoint[]; values: number[] }>();

    // Group points by zone
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

    // Calculate statistics for each zone
    const stats: ZoneStats[] = [];
    const zoneOrder = ['south-goal', 'south-blue', 'center', 'north-blue', 'north-goal', 'intermediate'];

    zoneOrder.forEach(zoneName => {
      const zone = zones.get(zoneName);
      if (!zone) return;

      const values = zone.values;
      stats.push({
        zone: zoneName,
        pointCount: zone.points.length,
        measuredCount: values.length,
        avgDepth: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
        minDepth: values.length > 0 ? Math.min(...values) : null,
        maxDepth: values.length > 0 ? Math.max(...values) : null,
        stdDev: calculateStandardDeviation(values),
      });
    });

    return stats;
  }, [points, measurements]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const allValues = Object.values(measurements)
      .filter(m => m?.depth !== null && m?.depth !== undefined)
      .map(m => m.depth as number);

    return {
      totalPoints: points.length,
      measuredCount: allValues.length,
      avgDepth: allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : null,
      minDepth: allValues.length > 0 ? Math.min(...allValues) : null,
      maxDepth: allValues.length > 0 ? Math.max(...allValues) : null,
      stdDev: calculateStandardDeviation(allValues),
      range: allValues.length > 0 ? Math.max(...allValues) - Math.min(...allValues) : null,
    };
  }, [points, measurements]);

  const getStatusIndicator = (avgDepth: number | null) => {
    if (avgDepth === null) return null;
    const status = getDepthStatus(avgDepth, DEFAULT_THRESHOLDS);
    const colors = {
      ideal: 'bg-green-500',
      warning: 'bg-yellow-500',
      critical: 'bg-red-500',
      unmeasured: 'bg-gray-400',
    };
    return <div className={`w-3 h-3 rounded-full ${colors[status]}`} />;
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Zone Statistics</h3>

      {/* Overall Summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Measured:</span>
            <span className="ml-2 font-medium">
              {overallStats.measuredCount} / {overallStats.totalPoints}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Average:</span>
            <span className="ml-2 font-medium">
              {formatDepth(overallStats.avgDepth, unit)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Min:</span>
            <span className="ml-2 font-medium">
              {formatDepth(overallStats.minDepth, unit)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Max:</span>
            <span className="ml-2 font-medium">
              {formatDepth(overallStats.maxDepth, unit)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Range:</span>
            <span className="ml-2 font-medium">
              {formatDepth(overallStats.range, unit)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Std Dev:</span>
            <span className="ml-2 font-medium">
              {overallStats.stdDev !== null ? formatDepth(overallStats.stdDev, unit) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-1">Zone</th>
              <th className="text-center py-2 px-1">Status</th>
              <th className="text-right py-2 px-1">Count</th>
              <th className="text-right py-2 px-1">Avg</th>
              <th className="text-right py-2 px-1">Min</th>
              <th className="text-right py-2 px-1">Max</th>
            </tr>
          </thead>
          <tbody>
            {zoneStats.map((stat) => (
              <tr key={stat.zone} className="border-b border-gray-100">
                <td className="py-2 px-1 font-medium">
                  {getZoneDisplayName(stat.zone as MeasurementPoint['zone'])}
                </td>
                <td className="py-2 px-1 text-center">
                  <div className="flex justify-center">
                    {getStatusIndicator(stat.avgDepth)}
                  </div>
                </td>
                <td className="py-2 px-1 text-right text-gray-600">
                  {stat.measuredCount}/{stat.pointCount}
                </td>
                <td className="py-2 px-1 text-right font-mono">
                  {formatDepth(stat.avgDepth, unit)}
                </td>
                <td className="py-2 px-1 text-right font-mono text-gray-600">
                  {formatDepth(stat.minDepth, unit)}
                </td>
                <td className="py-2 px-1 text-right font-mono text-gray-600">
                  {formatDepth(stat.maxDepth, unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Uniformity Assessment */}
      {overallStats.stdDev !== null && (
        <div className="mt-4 p-3 rounded-lg border">
          <h4 className="text-sm font-medium mb-1">Ice Uniformity Assessment</h4>
          <p className="text-sm text-gray-600">
            {overallStats.stdDev < 3 ? (
              <span className="text-green-600">
                Excellent uniformity (σ = {formatDepth(overallStats.stdDev, unit)})
              </span>
            ) : overallStats.stdDev < 6 ? (
              <span className="text-yellow-600">
                Acceptable uniformity (σ = {formatDepth(overallStats.stdDev, unit)})
              </span>
            ) : (
              <span className="text-red-600">
                Poor uniformity - consider resurfacing (σ = {formatDepth(overallStats.stdDev, unit)})
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default ZoneStatistics;
