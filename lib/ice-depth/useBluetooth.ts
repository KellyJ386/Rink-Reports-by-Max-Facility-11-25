'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// Bluetooth service UUIDs for common digital calipers
const CALIPER_SERVICE_UUIDS = [
  '0000fff0-0000-1000-8000-00805f9b34fb', // Generic caliper
  '00001800-0000-1000-8000-00805f9b34fb', // Generic access
  '0000180a-0000-1000-8000-00805f9b34fb', // Device information
];

const CALIPER_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

export type BluetoothStatus = 'disconnected' | 'scanning' | 'pairing' | 'connected' | 'error';

interface BluetoothDevice {
  id: string;
  name: string;
  batteryLevel?: number;
}

interface UseBluetoothReturn {
  status: BluetoothStatus;
  device: BluetoothDevice | null;
  error: string | null;
  lastReading: number | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  captureReading: () => Promise<number | null>;
  calibrationOffset: number;
  setCalibrationOffset: (offset: number) => void;
}

export function useBluetooth(): UseBluetoothReturn {
  const [status, setStatus] = useState<BluetoothStatus>('disconnected');
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReading, setLastReading] = useState<number | null>(null);
  const [calibrationOffset, setCalibrationOffset] = useState(0);

  const bluetoothDeviceRef = useRef<globalThis.BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // Check if Web Bluetooth is supported
  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Parse caliper reading from characteristic value
  const parseReading = useCallback((value: DataView): number => {
    // Different calipers have different data formats
    // Most common: 4 bytes, little-endian, in 0.01mm units
    if (value.byteLength >= 4) {
      const rawValue = value.getInt32(0, true); // Little-endian
      return (rawValue / 100) + calibrationOffset; // Convert to mm
    }
    // Fallback: 2 bytes
    if (value.byteLength >= 2) {
      const rawValue = value.getInt16(0, true);
      return (rawValue / 100) + calibrationOffset;
    }
    throw new Error('Invalid reading format');
  }, [calibrationOffset]);

  // Handle characteristic value change (auto-capture mode)
  const handleCharacteristicChange = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    if (characteristic.value) {
      try {
        const reading = parseReading(characteristic.value);
        setLastReading(reading);
      } catch (err) {
        console.error('Error parsing reading:', err);
      }
    }
  }, [parseReading]);

  // Connect to a caliper
  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Web Bluetooth is not supported in this browser');
      setStatus('error');
      return;
    }

    try {
      setStatus('scanning');
      setError(null);

      // Request device
      const btDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { services: CALIPER_SERVICE_UUIDS },
          { namePrefix: 'Caliper' },
          { namePrefix: 'Mitutoyo' },
          { namePrefix: 'Starrett' },
          { namePrefix: 'BT' },
        ],
        optionalServices: CALIPER_SERVICE_UUIDS,
      });

      setStatus('pairing');
      bluetoothDeviceRef.current = btDevice;

      // Connect to GATT server
      const server = await btDevice.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Get primary service
      let service: BluetoothRemoteGATTService | null = null;
      for (const uuid of CALIPER_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(uuid);
          break;
        } catch {
          continue;
        }
      }

      if (!service) {
        throw new Error('No compatible service found on device');
      }

      // Get characteristic
      const characteristic = await service.getCharacteristic(CALIPER_CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;

      // Start notifications for auto-capture
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);

      // Try to get battery level
      let batteryLevel: number | undefined;
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryChar = await batteryService.getCharacteristic('battery_level');
        const batteryValue = await batteryChar.readValue();
        batteryLevel = batteryValue.getUint8(0);
      } catch {
        // Battery service not available
      }

      setDevice({
        id: btDevice.id,
        name: btDevice.name || 'Unknown Caliper',
        batteryLevel,
      });
      setStatus('connected');

      // Handle disconnection
      btDevice.addEventListener('gattserverdisconnected', () => {
        setStatus('disconnected');
        setDevice(null);
        characteristicRef.current = null;
      });

    } catch (err) {
      console.error('Bluetooth connection error:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus('error');
    }
  }, [isSupported, handleCharacteristicChange]);

  // Disconnect from device
  const disconnect = useCallback(() => {
    if (characteristicRef.current) {
      characteristicRef.current.removeEventListener(
        'characteristicvaluechanged',
        handleCharacteristicChange
      );
    }

    if (bluetoothDeviceRef.current?.gatt?.connected) {
      bluetoothDeviceRef.current.gatt.disconnect();
    }

    bluetoothDeviceRef.current = null;
    characteristicRef.current = null;
    setDevice(null);
    setStatus('disconnected');
    setLastReading(null);
  }, [handleCharacteristicChange]);

  // Capture a single reading on demand
  const captureReading = useCallback(async (): Promise<number | null> => {
    if (!characteristicRef.current || status !== 'connected') {
      setError('Not connected to a device');
      return null;
    }

    try {
      const value = await characteristicRef.current.readValue();
      const reading = parseReading(value);
      setLastReading(reading);
      return reading;
    } catch (err) {
      console.error('Error capturing reading:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture reading');
      return null;
    }
  }, [status, parseReading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    device,
    error,
    lastReading,
    isSupported,
    connect,
    disconnect,
    captureReading,
    calibrationOffset,
    setCalibrationOffset,
  };
}

export default useBluetooth;
