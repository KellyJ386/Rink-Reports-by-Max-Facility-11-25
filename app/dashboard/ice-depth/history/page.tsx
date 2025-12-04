'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDepth } from '@/lib/ice-depth/types';

interface IceDepthSession {
  id: string;
  rinkId: string;
  rinkName: string;
  technicianName: string;
  templateType: string;
  status: string;
  submittedAt: string;
  stats?: {
    count: number;
    avgDepth: number;
    minDepth: number;
    maxDepth: number;
  };
}

export default function IceDepthHistoryPage() {
  const [sessions, setSessions] = useState<IceDepthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRink, setSelectedRink] = useState<string>('all');
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');

  useEffect(() => {
    fetchSessions();
  }, [selectedRink]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRink !== 'all') {
        params.set('rinkId', selectedRink);
      }
      params.set('limit', '50');

      const response = await fetch(`/api/ice-depth/sessions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTemplateLabel = (type: string) => {
    const labels: Record<string, string> = {
      'RINK_25': '25-Point',
      'RINK_35': '35-Point',
      'RINK_47': '47-Point',
      'CUSTOM': 'Custom',
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ice Depth History</h1>
              <p className="text-gray-500 text-sm mt-1">
                View and analyze past ice depth measurements
              </p>
            </div>
            <Link
              href="/dashboard/ice-depth"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + New Measurement
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-4 items-end">
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
                <option value="practice-rink">Practice Rink</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setUnit('mm')}
                  className={`px-4 py-2 text-sm font-medium ${
                    unit === 'mm' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  mm
                </button>
                <button
                  onClick={() => setUnit('in')}
                  className={`px-4 py-2 text-sm font-medium ${
                    unit === 'in' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
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
            <p className="mt-4 text-gray-500">Loading history...</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No measurements yet</h3>
            <p className="text-gray-500 mt-1">Start by taking your first ice depth measurement</p>
            <Link
              href="/dashboard/ice-depth"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Take Measurement
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rink</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Depth</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Range</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(session.submittedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{session.rinkName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getTemplateLabel(session.templateType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.technicianName}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {session.stats ? formatDepth(session.stats.avgDepth, unit) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">
                      {session.stats
                        ? `${formatDepth(session.stats.minDepth, unit)} - ${formatDepth(session.stats.maxDepth, unit)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(session.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/ice-depth/history/${session.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {sessions.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold">
                {sessions.filter(s => {
                  const date = new Date(s.submittedAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return date >= weekAgo;
                }).length}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Avg Depth (All)</p>
              <p className="text-2xl font-bold font-mono">
                {formatDepth(
                  sessions.reduce((sum, s) => sum + (s.stats?.avgDepth || 0), 0) /
                    sessions.filter(s => s.stats).length || 0,
                  unit
                )}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">
                {sessions.filter(s => s.status === 'submitted' || s.status === 'completed').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
