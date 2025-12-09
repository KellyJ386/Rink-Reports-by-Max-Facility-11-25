'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MeasurementPoint,
  MeasurementValue,
  getDepthStatus,
  getStatusColor,
  formatDepth,
  DEFAULT_THRESHOLDS,
  mmToInches,
  inchesToMm
} from '@/lib/ice-depth/types';
import { getZoneDisplayName } from '@/lib/ice-depth/templates';

interface MeasurementInputProps {
  point: MeasurementPoint;
  value: MeasurementValue | undefined;
  onChange: (value: MeasurementValue) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  totalPoints: number;
  completedCount: number;
  unit: 'mm' | 'in';
  bluetoothConnected?: boolean;
  onBluetoothCapture?: () => void;
}

export function MeasurementInput({
  point,
  value,
  onChange,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  totalPoints,
  completedCount,
  unit,
  bluetoothConnected = false,
  onBluetoothCapture,
}: MeasurementInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  // Update input when point changes
  useEffect(() => {
    if (value?.depth !== null && value?.depth !== undefined) {
      const displayValue = unit === 'in'
        ? mmToInches(value.depth).toFixed(3)
        : value.depth.toFixed(1);
      setInputValue(displayValue);
    } else {
      setInputValue('');
    }
    // Focus input when point changes
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [point.id, value?.depth, unit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue) && numValue >= 0) {
      const mmValue = unit === 'in' ? inchesToMm(numValue) : numValue;
      onChange({
        pointId: point.id,
        depth: mmValue,
        method: 'manual',
        measuredAt: new Date(),
      });
    } else if (newValue === '') {
      onChange({
        pointId: point.id,
        depth: null,
        method: 'manual',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (!isLast) {
        onNext();
      }
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      if (!isFirst) {
        onPrevious();
      }
    }
  };

  const status = getDepthStatus(value?.depth ?? null, DEFAULT_THRESHOLDS);
  const statusColor = getStatusColor(status);
  const progressPercent = Math.round((completedCount / totalPoints) * 100);

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{completedCount} / {totalPoints} ({progressPercent}%)</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Point Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Point #{point.label}
          </h3>
          <span
            className="px-2 py-1 rounded text-sm font-medium"
            style={{ backgroundColor: statusColor, color: status === 'warning' ? '#000' : '#fff' }}
          >
            {status === 'unmeasured' ? 'Waiting' : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          Zone: {getZoneDisplayName(point.zone)}
        </p>
      </div>

      {/* Measurement Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ice Depth ({unit === 'in' ? 'inches' : 'millimeters'})
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="number"
              step={unit === 'in' ? '0.001' : '0.1'}
              min="0"
              max={unit === 'in' ? '3' : '76'}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={unit === 'in' ? '0.000' : '0.0'}
              className="w-full px-3 py-3 text-xl font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ borderColor: status !== 'unmeasured' ? statusColor : undefined }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {unit === 'in' ? '"' : 'mm'}
            </span>
          </div>

          {/* Bluetooth Capture Button */}
          {onBluetoothCapture && (
            <button
              onClick={onBluetoothCapture}
              disabled={!bluetoothConnected}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                bluetoothConnected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={bluetoothConnected ? 'Capture from caliper' : 'Connect Bluetooth caliper first'}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Current Reading Display */}
        {value?.depth !== null && value?.depth !== undefined && (
          <p className="mt-2 text-sm text-gray-600">
            Reading: {formatDepth(value.depth, 'mm')} / {formatDepth(value.depth, 'in')}
            {value.method === 'bluetooth' && (
              <span className="ml-2 text-blue-600">(via Bluetooth)</span>
            )}
          </p>
        )}
      </div>

      {/* Threshold Reference */}
      <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded">
        <p><span className="text-green-600 font-medium">Ideal:</span> 25.4-44.45mm (1.0"-1.75")</p>
        <p><span className="text-yellow-600 font-medium">Warning:</span> 19.05-25.4mm or 44.45-50.8mm</p>
        <p><span className="text-red-600 font-medium">Critical:</span> &lt;19.05mm or &gt;50.8mm</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            isFirst
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={isLast}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            isLast
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLast ? 'Last Point' : 'Next'}
        </button>
      </div>

      {/* Keyboard Hints */}
      <p className="text-xs text-gray-400 text-center mt-2">
        Press Enter or Tab to advance | Arrow Up or Shift+Tab to go back
      </p>
    </div>
  );
}

export default MeasurementInput;
