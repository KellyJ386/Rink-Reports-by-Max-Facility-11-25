'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { RinkDiagram } from '@/components/ice-depth/RinkDiagram';
import { MeasurementInput } from '@/components/ice-depth/MeasurementInput';
import { ZoneStatistics } from '@/components/ice-depth/ZoneStatistics';
import {
  MeasurementPoint,
  MeasurementValue,
  PresetType,
  IceDepthSession,
} from '@/lib/ice-depth/types';
import { PRESET_TEMPLATES, getTemplateByPreset } from '@/lib/ice-depth/templates';

export default function IceDepthPage() {
  // State
  const [selectedPreset, setSelectedPreset] = useState<Exclude<PresetType, 'CUSTOM'>>('RINK_25');
  const [selectedRink, setSelectedRink] = useState<string>('main-rink');
  const [measurements, setMeasurements] = useState<Record<number, MeasurementValue>>({});
  const [selectedPointId, setSelectedPointId] = useState<number | null>(1);
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const [sessionNotes, setSessionNotes] = useState('');
  const [airTemp, setAirTemp] = useState<string>('');
  const [iceTemp, setIceTemp] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get current template
  const template = useMemo(() => getTemplateByPreset(selectedPreset), [selectedPreset]);
  const points = template.points;

  // Get current point
  const currentPoint = useMemo(
    () => points.find(p => p.id === selectedPointId) || points[0],
    [points, selectedPointId]
  );

  // Get current point index
  const currentIndex = useMemo(
    () => points.findIndex(p => p.id === selectedPointId),
    [points, selectedPointId]
  );

  // Count completed measurements
  const completedCount = useMemo(
    () => Object.values(measurements).filter(m => m?.depth !== null && m?.depth !== undefined).length,
    [measurements]
  );

  // Handle point click
  const handlePointClick = useCallback((point: MeasurementPoint) => {
    setSelectedPointId(point.id);
  }, []);

  // Handle measurement change
  const handleMeasurementChange = useCallback((value: MeasurementValue) => {
    setMeasurements(prev => ({
      ...prev,
      [value.pointId]: value,
    }));
  }, []);

  // Navigate to next point
  const handleNext = useCallback(() => {
    if (currentIndex < points.length - 1) {
      setSelectedPointId(points[currentIndex + 1].id);
    }
  }, [currentIndex, points]);

  // Navigate to previous point
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedPointId(points[currentIndex - 1].id);
    }
  }, [currentIndex, points]);

  // Handle template change
  const handleTemplateChange = (newPreset: Exclude<PresetType, 'CUSTOM'>) => {
    if (Object.keys(measurements).length > 0) {
      if (!confirm('Changing template will clear current measurements. Continue?')) {
        return;
      }
    }
    setSelectedPreset(newPreset);
    setMeasurements({});
    setSelectedPointId(1);
  };

  // Handle save/submit
  const handleSave = async (status: 'draft' | 'submitted') => {
    setIsSaving(true);
    try {
      const sessionData: Partial<IceDepthSession> = {
        rinkId: selectedRink,
        templateType: selectedPreset,
        measurements,
        airTemp: airTemp ? parseFloat(airTemp) : undefined,
        iceTemp: iceTemp ? parseFloat(iceTemp) : undefined,
        humidity: humidity ? parseFloat(humidity) : undefined,
        notes: sessionNotes,
        status: status === 'draft' ? 'draft' : 'completed',
        startedAt: new Date(),
        completedAt: status === 'submitted' ? new Date() : undefined,
      };

      const response = await fetch('/api/ice-depth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        if (status === 'submitted') {
          // Reset form after successful submission
          setMeasurements({});
          setSelectedPointId(1);
          setSessionNotes('');
          setAirTemp('');
          setIceTemp('');
          setHumidity('');
        }
      } else {
        alert('Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    if (confirm('Clear all measurements? This cannot be undone.')) {
      setMeasurements({});
      setSelectedPointId(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ice Depth Measurement</h1>
              <p className="text-gray-500 text-sm mt-1">
                Record ice thickness measurements across the rink surface
              </p>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                Measurements saved successfully!
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="mt-4 flex flex-wrap gap-4 items-end">
            {/* Rink Selector */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rink
              </label>
              <select
                value={selectedRink}
                onChange={(e) => setSelectedRink(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="main-rink">Main Rink</option>
                <option value="studio-rink">Studio Rink</option>
                <option value="practice-rink">Practice Rink</option>
              </select>
            </div>

            {/* Template Selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Measurement Template
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => handleTemplateChange(e.target.value as Exclude<PresetType, 'CUSTOM'>)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="RINK_25">25-Point Standard</option>
                <option value="RINK_35">35-Point Enhanced</option>
                <option value="RINK_47">47-Point Comprehensive</option>
              </select>
            </div>

            {/* Unit Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setUnit('mm')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    unit === 'mm'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  mm
                </button>
                <button
                  onClick={() => setUnit('in')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    unit === 'in'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  in
                </button>
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rink Diagram - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">
                Rink Diagram - {template.name} ({template.pointCount} points)
              </h2>
              <RinkDiagram
                points={points}
                measurements={measurements}
                selectedPointId={selectedPointId}
                onPointClick={handlePointClick}
                showLabels={true}
              />
            </div>

            {/* Zone Statistics - Below diagram on large screens */}
            <div className="mt-6">
              <ZoneStatistics
                points={points}
                measurements={measurements}
                unit={unit}
              />
            </div>
          </div>

          {/* Right Sidebar - Input and Controls */}
          <div className="space-y-6">
            {/* Measurement Input */}
            {currentPoint && (
              <MeasurementInput
                point={currentPoint}
                value={measurements[currentPoint.id]}
                onChange={handleMeasurementChange}
                onNext={handleNext}
                onPrevious={handlePrevious}
                isFirst={currentIndex === 0}
                isLast={currentIndex === points.length - 1}
                totalPoints={points.length}
                completedCount={completedCount}
                unit={unit}
              />
            )}

            {/* Environmental Conditions */}
            <div className="bg-white border rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Environmental Conditions</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Air Temperature (°F)
                  </label>
                  <input
                    type="number"
                    value={airTemp}
                    onChange={(e) => setAirTemp(e.target.value)}
                    placeholder="e.g., 55"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ice Temperature (°F)
                  </label>
                  <input
                    type="number"
                    value={iceTemp}
                    onChange={(e) => setIceTemp(e.target.value)}
                    placeholder="e.g., 22"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Humidity (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    placeholder="e.g., 45"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add any notes about ice conditions, recent resurfacing, etc..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleSave('submitted')}
                disabled={isSaving || completedCount === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isSaving || completedCount === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSaving ? 'Saving...' : `Submit Measurements (${completedCount}/${points.length})`}
              </button>
              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Save as Draft
              </button>
            </div>

            {/* Quick Navigation */}
            <div className="bg-white border rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold mb-2">Quick Navigation</h3>
              <div className="flex flex-wrap gap-1">
                {points.map((point) => {
                  const hasValue = measurements[point.id]?.depth !== null &&
                                   measurements[point.id]?.depth !== undefined;
                  const isSelected = point.id === selectedPointId;
                  return (
                    <button
                      key={point.id}
                      onClick={() => setSelectedPointId(point.id)}
                      className={`w-8 h-8 text-xs rounded font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : hasValue
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {point.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
