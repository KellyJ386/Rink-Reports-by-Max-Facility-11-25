'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SPCCharts } from '@/components/ice-depth/SPCCharts';
import { HeatMapOverlay } from '@/components/ice-depth/HeatMapOverlay';
import { MeasurementValue } from '@/lib/ice-depth/types';
import { PRESET_TEMPLATES } from '@/lib/ice-depth/templates';

interface Session {
  id: string;
  rinkId: string;
  rinkName: string;
  templateType: string;
  submittedAt: string;
  measurements: Record<number, MeasurementValue>;
}

type ViewMode = 'spc' | 'heatmap' | 'comparison';

export default function IceDepthAnalyticsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRink, setSelectedRink] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('spc');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchSessions();
  }, [selectedRink, dateRange]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRink !== 'all') {
        params.set('rinkId', selectedRink);
      }
      params.set('limit', '100');

      const response = await fetch(`/api/ice-depth/sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();

      // Filter by date range
      let filteredSessions = data.sessions || [];
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        filteredSessions = filteredSessions.filter(
          (s: Session) => new Date(s.submittedAt) >= cutoff
        );
      }

      setSessions(filteredSessions);
      if (filteredSessions.length > 0 && !selectedSession) {
        setSelectedSession(filteredSessions[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Get the currently selected session for heat map
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSession);
  }, [sessions, selectedSession]);

  // Get template points for heat map
  const templatePoints = useMemo(() => {
    if (!currentSession) return [];
    const templateType = currentSession.templateType as keyof typeof PRESET_TEMPLATES;
    return PRESET_TEMPLATES[templateType]?.points || PRESET_TEMPLATES.RINK_25.points;
  }, [currentSession]);

  const handleExportReport = async (sessionId: string) => {
    window.open(`/api/ice-depth/reports?sessionId=${sessionId}&format=html&preset=full&unit=${unit}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ice Depth Analytics</h1>
              <p className="text-gray-500 text-sm mt-1">
                Statistical analysis and trend visualization
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/ice-depth"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + New Measurement
              </Link>
              <Link
                href="/dashboard/ice-depth/history"
                className="px-4 py-2 bg-white text-gray-700 border rounded-lg hover:bg-gray-50 font-medium"
              >
                View History
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4 items-end">
            {/* Rink Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rink</label>
              <select
                value={selectedRink}
                onChange={(e) => setSelectedRink(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Rinks</option>
                <option value="main-rink">Main Rink</option>
                <option value="studio-rink">Studio Rink</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setViewMode('spc')}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === 'spc'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  SPC Charts
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewMode === 'heatmap'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Heat Map
                </button>
              </div>
            </div>

            {/* Unit Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setUnit('mm')}
                  className={`px-3 py-2 text-sm font-medium ${
                    unit === 'mm'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  mm
                </button>
                <button
                  onClick={() => setUnit('in')}
                  className={`px-3 py-2 text-sm font-medium ${
                    unit === 'in'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading analytics...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchSessions} className="mt-4 text-blue-600 hover:underline">
              Try again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No data yet</h3>
            <p className="text-gray-500 mt-1">Start taking measurements to see analytics</p>
            <Link
              href="/dashboard/ice-depth"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Take Measurement
            </Link>
          </div>
        ) : (
          <>
            {/* SPC Charts View */}
            {viewMode === 'spc' && (
              <SPCCharts sessions={sessions} unit={unit} />
            )}

            {/* Heat Map View */}
            {viewMode === 'heatmap' && (
              <div className="space-y-4">
                {/* Session Selector */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Ice Depth Heat Map</h3>
                    {currentSession && (
                      <button
                        onClick={() => handleExportReport(currentSession.id)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Export Report
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Session
                    </label>
                    <select
                      value={selectedSession || ''}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {new Date(session.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} - {session.rinkName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentSession && (
                    <HeatMapOverlay
                      points={templatePoints}
                      measurements={currentSession.measurements}
                      showPoints={true}
                      showValues={false}
                      opacity={0.7}
                      unit={unit}
                    />
                  )}
                </div>

                {/* Session Details */}
                {currentSession && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Session Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(currentSession.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rink:</span>
                        <span className="ml-2 font-medium">{currentSession.rinkName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Template:</span>
                        <span className="ml-2 font-medium">{currentSession.templateType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Points:</span>
                        <span className="ml-2 font-medium">
                          {Object.values(currentSession.measurements).filter(m => m?.depth !== null).length} measured
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-500">Measurements</p>
                <p className="text-2xl font-bold">
                  {sessions.reduce(
                    (sum, s) => sum + Object.values(s.measurements).filter(m => m?.depth !== null).length,
                    0
                  )}
                </p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-500">Rinks Covered</p>
                <p className="text-2xl font-bold">
                  {new Set(sessions.map(s => s.rinkId)).size}
                </p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <p className="text-sm text-gray-500">Date Range</p>
                <p className="text-lg font-bold">
                  {sessions.length > 0
                    ? `${new Date(sessions[sessions.length - 1].submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(sessions[0].submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
