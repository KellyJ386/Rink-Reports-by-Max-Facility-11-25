'use client';

import React, { useMemo } from 'react';
import {
  SPCDataPoint,
  XBarRChart,
  ProcessCapability,
  TrendAnalysis,
  calculateXBarRChart,
  calculateProcessCapability,
  calculateTrendAnalysis,
  getCapabilityRating,
  prepareXBarRData,
} from '@/lib/ice-depth/spc';
import { MeasurementValue, formatDepth } from '@/lib/ice-depth/types';

interface SPCChartsProps {
  sessions: Array<{
    id: string;
    submittedAt: Date | string;
    measurements: Record<number, MeasurementValue>;
  }>;
  unit: 'mm' | 'in';
}

// Simple SVG line chart component
function LineChart({
  data,
  limits,
  outOfControl,
  title,
  unit,
  height = 200,
}: {
  data: { x: Date; y: number; sessionId: string }[];
  limits: { ucl: number; cl: number; lcl: number };
  outOfControl: string[];
  title: string;
  unit: 'mm' | 'in';
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const yValues = [...data.map(d => d.y), limits.ucl, limits.lcl];
  const yMin = Math.min(...yValues) * 0.95;
  const yMax = Math.max(...yValues) * 1.05;
  const yScale = (v: number) => chartHeight - ((v - yMin) / (yMax - yMin)) * chartHeight;

  const xMin = data[0].x.getTime();
  const xMax = data[data.length - 1].x.getTime();
  const xRange = xMax - xMin || 1;
  const xScale = (d: Date) => ((d.getTime() - xMin) / xRange) * chartWidth;

  // Create path for data line
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`)
    .join(' ');

  return (
    <div className="bg-white border rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = t * chartHeight;
            return (
              <line
                key={t}
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}

          {/* Control limits */}
          <line
            x1={0}
            y1={yScale(limits.ucl)}
            x2={chartWidth}
            y2={yScale(limits.ucl)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="5,5"
          />
          <line
            x1={0}
            y1={yScale(limits.cl)}
            x2={chartWidth}
            y2={yScale(limits.cl)}
            stroke="#22c55e"
            strokeWidth="1.5"
          />
          <line
            x1={0}
            y1={yScale(limits.lcl)}
            x2={chartWidth}
            y2={yScale(limits.lcl)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="5,5"
          />

          {/* Limit labels */}
          <text x={chartWidth + 5} y={yScale(limits.ucl) + 4} fontSize="10" fill="#ef4444">
            UCL: {formatDepth(limits.ucl, unit)}
          </text>
          <text x={chartWidth + 5} y={yScale(limits.cl) + 4} fontSize="10" fill="#22c55e">
            CL: {formatDepth(limits.cl, unit)}
          </text>
          <text x={chartWidth + 5} y={yScale(limits.lcl) + 4} fontSize="10" fill="#ef4444">
            LCL: {formatDepth(limits.lcl, unit)}
          </text>

          {/* Data line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const isOutOfControl = outOfControl.includes(d.sessionId);
            return (
              <circle
                key={i}
                cx={xScale(d.x)}
                cy={yScale(d.y)}
                r={isOutOfControl ? 6 : 4}
                fill={isOutOfControl ? '#ef4444' : '#3b82f6'}
                stroke="#fff"
                strokeWidth="1.5"
              />
            );
          })}

          {/* X-axis */}
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#9ca3af"
            strokeWidth="1"
          />

          {/* X-axis labels (show first, middle, last) */}
          {[0, Math.floor(data.length / 2), data.length - 1].map(i => {
            if (i >= data.length) return null;
            const d = data[i];
            return (
              <text
                key={i}
                x={xScale(d.x)}
                y={chartHeight + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {d.x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map(t => {
            const value = yMin + (yMax - yMin) * (1 - t);
            return (
              <text
                key={t}
                x={-5}
                y={t * chartHeight + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {formatDepth(value, unit)}
              </text>
            );
          })}
        </g>
      </svg>

      {outOfControl.length > 0 && (
        <div className="mt-2 text-xs text-red-600">
          {outOfControl.length} out-of-control point(s) detected
        </div>
      )}
    </div>
  );
}

// Process Capability Display
function CapabilityCard({ capability }: { capability: ProcessCapability }) {
  const rating = getCapabilityRating(capability.cpk);

  return (
    <div className="bg-white border rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-3">Process Capability</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold" style={{ color: rating.color }}>
            {capability.cpk.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Cpk</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold">{capability.cp.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Cp</div>
        </div>
      </div>

      <div className="mt-3 p-2 rounded text-sm" style={{ backgroundColor: rating.color + '20' }}>
        <span className="font-medium" style={{ color: rating.color }}>
          {rating.rating.toUpperCase()}:
        </span>{' '}
        {rating.description}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Within Spec:</span>
          <span className="ml-2 font-medium">{capability.withinSpec.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-gray-500">Sigma:</span>
          <span className="ml-2 font-medium">{capability.sigma.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500">Mean:</span>
          <span className="ml-2 font-medium">{capability.mean.toFixed(2)}mm</span>
        </div>
        <div>
          <span className="text-gray-500">Spec Range:</span>
          <span className="ml-2 font-medium">{capability.lsl}-{capability.usl}mm</span>
        </div>
      </div>

      {/* Capability gauge */}
      <div className="mt-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(100, capability.cpk * 50)}%`,
              backgroundColor: rating.color,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span>1.0</span>
          <span>2.0</span>
        </div>
      </div>
    </div>
  );
}

// Trend Analysis Display
function TrendCard({ trend }: { trend: TrendAnalysis }) {
  const trendColors = {
    improving: '#22c55e',
    stable: '#3b82f6',
    degrading: '#ef4444',
  };

  const trendIcons = {
    improving: '↗',
    stable: '→',
    degrading: '↘',
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-3">Trend Analysis</h4>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="text-3xl font-bold"
          style={{ color: trendColors[trend.trend] }}
        >
          {trendIcons[trend.trend]}
        </div>
        <div>
          <div
            className="font-semibold capitalize"
            style={{ color: trendColors[trend.trend] }}
          >
            {trend.trend}
          </div>
          <div className="text-xs text-gray-500">
            Slope: {trend.slope > 0 ? '+' : ''}{trend.slope.toFixed(3)}mm/session
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">R²:</span>
          <span className="ml-2 font-medium">{(trend.rSquared * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-gray-500">Forecast:</span>
          <span className="ml-2 font-medium">{trend.forecast.toFixed(1)}mm</span>
        </div>
      </div>

      {/* Pattern Alerts */}
      {trend.patterns.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Detected Patterns:</div>
          <div className="space-y-1">
            {trend.patterns.slice(0, 3).map((pattern, i) => (
              <div
                key={i}
                className={`text-xs px-2 py-1 rounded ${
                  pattern.severity === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : pattern.severity === 'warning'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {pattern.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main SPC Charts Component
export function SPCCharts({ sessions, unit }: SPCChartsProps) {
  const spcData = useMemo(() => prepareXBarRData(sessions), [sessions]);
  const xBarRChart = useMemo(() => calculateXBarRChart(spcData), [spcData]);

  const allValues = useMemo(() => {
    return sessions.flatMap(s =>
      Object.values(s.measurements)
        .filter(m => m?.depth !== null && m?.depth !== undefined)
        .map(m => m.depth as number)
    );
  }, [sessions]);

  const capability = useMemo(() => calculateProcessCapability(allValues), [allValues]);
  const trend = useMemo(() => calculateTrendAnalysis(spcData), [spcData]);

  if (sessions.length < 2) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">Insufficient Data</h3>
        <p className="text-gray-500 mt-1">
          At least 2 measurement sessions are required for SPC analysis.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Current sessions: {sessions.length}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistical Process Control</h3>
        <span className="text-sm text-gray-500">
          Based on {sessions.length} sessions, {allValues.length} measurements
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CapabilityCard capability={capability} />
        <TrendCard trend={trend} />
      </div>

      {/* Control Charts */}
      <div className="space-y-4">
        <LineChart
          data={xBarRChart.xBar.data}
          limits={xBarRChart.xBar.limits}
          outOfControl={xBarRChart.xBar.outOfControl}
          title="X-bar Chart (Mean Ice Depth per Session)"
          unit={unit}
        />
        <LineChart
          data={xBarRChart.rChart.data}
          limits={xBarRChart.rChart.limits}
          outOfControl={xBarRChart.rChart.outOfControl}
          title="R Chart (Range per Session)"
          unit={unit}
        />
      </div>

      {/* Out of Control Summary */}
      {(xBarRChart.xBar.outOfControl.length > 0 || xBarRChart.rChart.outOfControl.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Out-of-Control Alerts</h4>
          <p className="text-sm text-red-700">
            {xBarRChart.xBar.outOfControl.length} session(s) with mean outside control limits.{' '}
            {xBarRChart.rChart.outOfControl.length} session(s) with excessive variation.
          </p>
          <p className="text-xs text-red-600 mt-2">
            Investigation recommended to identify special cause variation.
          </p>
        </div>
      )}
    </div>
  );
}

export default SPCCharts;
