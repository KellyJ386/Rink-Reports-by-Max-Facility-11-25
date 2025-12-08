'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import RinkDiagram from '@/components/ice-depth/RinkDiagram'
import CustomDiagramEditor from '@/components/ice-depth/CustomDiagramEditor'
import {
  PRESET_RINK_25,
  PRESET_RINK_35,
  PRESET_RINK_47,
  MeasurementPoint,
  IceDepthReading,
  calculateDepthStats,
  DEFAULT_DEPTH_TARGETS,
  PresetType,
} from '@/types/ice-depth'
import { PermissionSet } from '@/types'

interface IceDepthDashboardProps {
  user: {
    id: string
    firstName: string
    lastName: string
    facilityId: string
    permissions: PermissionSet
  }
}

interface RinkConfig {
  id: string
  name: string
  preset: PresetType | 'CUSTOM'
  customPoints?: MeasurementPoint[]
}

// Demo rinks for the facility
const DEMO_RINKS: RinkConfig[] = [
  { id: 'rink-1', name: 'Main Rink', preset: 'RINK_35' },
  { id: 'rink-2', name: 'Studio Rink', preset: 'RINK_25' },
]

// Demo readings for visualization
const generateDemoReadings = (points: MeasurementPoint[]): Map<string, IceDepthReading> => {
  const readings = new Map<string, IceDepthReading>()
  points.forEach((point, index) => {
    // Generate varied readings for demo (some optimal, some warning, some thin)
    let depth: number
    if (index % 7 === 0) {
      depth = 0.65 // Too thin
    } else if (index % 5 === 0) {
      depth = 0.78 // Warning
    } else if (index % 11 === 0) {
      depth = 1.3 // Too thick
    } else {
      depth = 0.9 + Math.random() * 0.2 // Optimal range
    }
    readings.set(point.id, {
      pointId: point.id,
      depth: Math.round(depth * 100) / 100,
      unit: 'inches',
    })
  })
  return readings
}

const PRESETS: Record<PresetType, MeasurementPoint[]> = {
  RINK_25: PRESET_RINK_25,
  RINK_35: PRESET_RINK_35,
  RINK_47: PRESET_RINK_47,
}

export default function IceDepthDashboard({ user }: IceDepthDashboardProps) {
  const [rinks, setRinks] = useState<RinkConfig[]>(DEMO_RINKS)
  const [selectedRink, setSelectedRink] = useState(DEMO_RINKS[0])
  const [selectedPoint, setSelectedPoint] = useState<MeasurementPoint | null>(null)
  const [showNewSubmissionModal, setShowNewSubmissionModal] = useState(false)
  const [showCustomEditor, setShowCustomEditor] = useState(false)

  // Get points for selected rink (custom or preset)
  const currentRinkConfig = rinks.find((r) => r.id === selectedRink.id) || selectedRink
  const presetPoints =
    currentRinkConfig.preset === 'CUSTOM' && currentRinkConfig.customPoints
      ? currentRinkConfig.customPoints
      : PRESETS[currentRinkConfig.preset as PresetType] || PRESET_RINK_35

  // Handle saving custom diagram configuration
  const handleSaveCustomDiagram = useCallback(
    (points: MeasurementPoint[]) => {
      setRinks((prev) =>
        prev.map((r) =>
          r.id === selectedRink.id
            ? { ...r, preset: 'CUSTOM' as const, customPoints: points }
            : r
        )
      )
      setShowCustomEditor(false)
      // In production, this would call the API to save the configuration
      console.log('Saved custom configuration for', selectedRink.name, points)
    },
    [selectedRink]
  )

  // Check if user has admin access to edit configuration
  const canEditConfig = user.permissions.admin?.access
  const demoReadings = generateDemoReadings(presetPoints)
  const stats = calculateDepthStats(Array.from(demoReadings.values()))

  // Count problem areas
  const problemAreas = Array.from(demoReadings.values()).filter(
    (r) => r.depth < DEFAULT_DEPTH_TARGETS.min || r.depth > DEFAULT_DEPTH_TARGETS.max
  ).length

  const handlePointClick = (point: MeasurementPoint) => {
    setSelectedPoint(point)
  }

  const canSubmit = user.permissions.iceDepth?.submit
  const canViewHistory = user.permissions.iceDepth?.viewAll || user.permissions.iceDepth?.viewOwn
  const canExport = user.permissions.iceDepth?.export

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ice Depth</h1>
          <p className="text-gray-600 mt-1">
            Monitor and record ice thickness measurements across your rinks
          </p>
        </div>
        <div className="flex gap-3">
          {canViewHistory && (
            <Link
              href="/dashboard/ice-depth/history"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View History
            </Link>
          )}
          {canSubmit && (
            <button
              onClick={() => setShowNewSubmissionModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + New Reading
            </button>
          )}
        </div>
      </div>

      {/* Rink Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Select Rink:</label>
          <div className="flex gap-2">
            {rinks.map((rink) => (
              <button
                key={rink.id}
                onClick={() => setSelectedRink(rink)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedRink.id === rink.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rink.name}
                {rink.preset === 'CUSTOM' && (
                  <span className="ml-1 text-xs opacity-75">(Custom)</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-500">
              {currentRinkConfig.preset === 'CUSTOM'
                ? `Custom: ${presetPoints.length} points`
                : `Preset: ${currentRinkConfig.preset.replace('RINK_', '')} points`}
            </span>
            {canEditConfig && (
              <button
                onClick={() => setShowCustomEditor(true)}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
              >
                Customize Diagram
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Average Depth</p>
          <p className="text-2xl font-bold text-gray-900">{stats.average.toFixed(2)}&quot;</p>
          <p className="text-xs text-gray-400 mt-1">Target: {DEFAULT_DEPTH_TARGETS.target}&quot;</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Min / Max</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.min.toFixed(2)}&quot; / {stats.max.toFixed(2)}&quot;
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Range: {DEFAULT_DEPTH_TARGETS.min}&quot; - {DEFAULT_DEPTH_TARGETS.max}&quot;
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Points Measured</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.count} / {presetPoints.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {Math.round((stats.count / presetPoints.length) * 100)}% complete
          </p>
        </div>
        <div className={`rounded-lg shadow-sm border p-4 ${
          problemAreas > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className={`text-sm mb-1 ${problemAreas > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {problemAreas > 0 ? 'Problem Areas' : 'Status'}
          </p>
          <p className={`text-2xl font-bold ${problemAreas > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {problemAreas > 0 ? `${problemAreas} areas` : 'All Good'}
          </p>
          <p className={`text-xs mt-1 ${problemAreas > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {problemAreas > 0 ? 'Need attention' : 'All readings in range'}
          </p>
        </div>
      </div>

      {/* Rink Diagram */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedRink.name} - Ice Depth Map
          </h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
        </div>
        <RinkDiagram
          points={presetPoints}
          readings={demoReadings}
          onPointClick={handlePointClick}
          selectedPointId={selectedPoint?.id}
          showLabels={true}
          showValues={true}
          interactive={true}
        />
      </div>

      {/* Selected Point Details */}
      {selectedPoint && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Point {selectedPoint.label} Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Point ID</p>
              <p className="font-medium">{selectedPoint.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Position</p>
              <p className="font-medium">X: {selectedPoint.x}%, Y: {selectedPoint.y}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Zone</p>
              <p className="font-medium capitalize">{selectedPoint.zone?.replace('-', ' ') || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Depth</p>
              <p className="font-medium">
                {demoReadings.get(selectedPoint.id)?.depth.toFixed(2) || '-'}&quot;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent History Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
          {canViewHistory && (
            <Link
              href="/dashboard/ice-depth/history"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Rink</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Submitted By</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Avg Depth</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Demo data rows */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3">Dec 8, 2025 - 8:00 AM</td>
                <td className="py-3 px-3">Main Rink</td>
                <td className="py-3 px-3">{user.firstName} {user.lastName}</td>
                <td className="py-3 px-3">0.95&quot;</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Optimal
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3">Dec 7, 2025 - 8:00 AM</td>
                <td className="py-3 px-3">Main Rink</td>
                <td className="py-3 px-3">{user.firstName} {user.lastName}</td>
                <td className="py-3 px-3">0.92&quot;</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Optimal
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3">Dec 6, 2025 - 8:00 AM</td>
                <td className="py-3 px-3">Studio Rink</td>
                <td className="py-3 px-3">{user.firstName} {user.lastName}</td>
                <td className="py-3 px-3">0.73&quot;</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Below Min
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* New Submission Modal Placeholder */}
      {showNewSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">New Ice Depth Reading</h2>
            <p className="text-gray-600 mb-4">
              The submission form will be available here. This is a preview of the modal interface.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewSubmissionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewSubmissionModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Diagram Editor Modal */}
      {showCustomEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <CustomDiagramEditor
              initialPoints={
                currentRinkConfig.preset === 'CUSTOM' && currentRinkConfig.customPoints
                  ? currentRinkConfig.customPoints
                  : undefined
              }
              initialPreset={
                currentRinkConfig.preset === 'CUSTOM'
                  ? 'CUSTOM'
                  : (currentRinkConfig.preset as PresetType)
              }
              onSave={handleSaveCustomDiagram}
              onCancel={() => setShowCustomEditor(false)}
              maxCustomPoints={60}
            />
          </div>
        </div>
      )}
    </div>
  )
}
