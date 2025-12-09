'use client'

import { useState } from 'react'
import {
  Building2,
  Save,
  Clock,
  Thermometer,
  Wind,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Palette,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Settings,
  ChevronRight,
  RefreshCw,
  Lock,
  Users,
  FileText,
  Trash2,
  Download,
  Upload,
  History,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FacilitySettings as FacilitySettingsType } from '@/types/admin'

// Mock facility settings
const mockSettings: FacilitySettingsType = {
  facilityId: 'facility-1',
  general: {
    name: 'Main Arena Ice Center',
    address: '123 Ice Way Boulevard',
    city: 'Frostburg',
    state: 'Minnesota',
    zipCode: '55001',
    country: 'United States',
    phone: '+1 (555) 123-4567',
    email: 'info@mainarena.com',
    website: 'https://mainarena.com',
    timezone: 'America/Chicago',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
  operations: {
    operatingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '23:00', closed: false },
      saturday: { open: '07:00', close: '23:00', closed: false },
      sunday: { open: '08:00', close: '20:00', closed: false },
    },
    resurfacingInterval: 60,
    maintenanceWindow: {
      day: 'monday',
      startTime: '02:00',
      endTime: '06:00',
    },
    maxCapacity: 500,
    emergencyContact: '+1 (555) 911-0000',
  },
  airQuality: {
    co2ThresholdWarning: 800,
    co2ThresholdCritical: 1000,
    coThresholdWarning: 25,
    coThresholdCritical: 35,
    no2ThresholdWarning: 100,
    no2ThresholdCritical: 200,
    monitoringInterval: 5,
    alertRecipients: ['manager@mainarena.com', 'safety@mainarena.com'],
    autoShutdownEnabled: true,
  },
  scheduling: {
    defaultShiftDuration: 8,
    minShiftGap: 8,
    maxWeeklyHours: 40,
    overtimeThreshold: 40,
    advanceSchedulingDays: 14,
    autoApproveSwaps: false,
    requireManagerApproval: true,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    digestFrequency: 'daily',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
  security: {
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordExpiryDays: 90,
    twoFactorEnabled: false,
    ipWhitelist: [],
  },
  dataRetention: {
    auditLogRetentionDays: 365,
    reportRetentionDays: 730,
    incidentRetentionDays: 1825,
    scheduleRetentionDays: 365,
  },
  integrations: {
    googleCalendarEnabled: false,
    slackEnabled: false,
    emailProvider: 'smtp',
    smsProvider: 'twilio',
  },
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
]

export default function FacilitySettingsPage() {
  const [settings, setSettings] = useState<FacilitySettingsType>(mockSettings)
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const updateSettings = <K extends keyof FacilitySettingsType>(
    section: K,
    updates: Partial<FacilitySettingsType[K]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...updates },
    }))
    setHasChanges(true)
  }

  const updateOperatingHours = (
    day: string,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      operations: {
        ...prev.operations,
        operatingHours: {
          ...prev.operations.operatingHours,
          [day]: {
            ...prev.operations.operatingHours[day as keyof typeof prev.operations.operatingHours],
            [field]: value,
          },
        },
      },
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setHasChanges(false)
  }

  const handleReset = () => {
    setSettings(mockSettings)
    setHasChanges(false)
    setShowResetDialog(false)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'facility-settings.json'
    link.click()
    setShowExportDialog(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facility Settings</h1>
          <p className="text-gray-600">
            Configure your facility&apos;s operational settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger value="general" className="text-xs">
            <Building2 className="h-3 w-3 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="operations" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="air-quality" className="text-xs">
            <Wind className="h-3 w-3 mr-1" />
            Air Quality
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduling
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="h-3 w-3 mr-1" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            Data
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            <Globe className="h-3 w-3 mr-1" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Facility Information</CardTitle>
              <CardDescription>Basic information about your facility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name</Label>
                  <Input
                    id="name"
                    value={settings.general.name}
                    onChange={(e) => updateSettings('general', { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.general.phone}
                    onChange={(e) => updateSettings('general', { phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={settings.general.address}
                  onChange={(e) => updateSettings('general', { address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.general.city}
                    onChange={(e) => updateSettings('general', { city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={settings.general.state}
                    onChange={(e) => updateSettings('general', { state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={settings.general.zipCode}
                    onChange={(e) => updateSettings('general', { zipCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={settings.general.country}
                    onChange={(e) => updateSettings('general', { country: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.general.email}
                    onChange={(e) => updateSettings('general', { email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.general.website}
                    onChange={(e) => updateSettings('general', { website: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localization</CardTitle>
              <CardDescription>Regional and format preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => updateSettings('general', { timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) => updateSettings('general', { currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={settings.general.dateFormat}
                    onValueChange={(value) => updateSettings('general', { dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={settings.general.timeFormat}
                    onValueChange={(value) => updateSettings('general', { timeFormat: value as '12h' | '24h' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Settings */}
        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Configure when your facility is open</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map(({ key, label }) => {
                const hours = settings.operations.operatingHours[
                  key as keyof typeof settings.operations.operatingHours
                ]
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) =>
                          updateOperatingHours(key, 'closed', !checked)
                        }
                      />
                      <span className={`font-medium w-24 ${hours.closed ? 'text-gray-400' : ''}`}>
                        {label}
                      </span>
                    </div>
                    {hours.closed ? (
                      <Badge variant="outline" className="text-gray-500">
                        Closed
                      </Badge>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOperatingHours(key, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOperatingHours(key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ice Maintenance</CardTitle>
              <CardDescription>Configure resurfacing and maintenance schedules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Resurfacing Interval (minutes)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[settings.operations.resurfacingInterval]}
                    onValueChange={([value]) =>
                      updateSettings('operations', { resurfacingInterval: value })
                    }
                    min={30}
                    max={120}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-16 text-right font-medium">
                    {settings.operations.resurfacingInterval} min
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Maintenance Day</Label>
                  <Select
                    value={settings.operations.maintenanceWindow.day}
                    onValueChange={(value) =>
                      updateSettings('operations', {
                        maintenanceWindow: {
                          ...settings.operations.maintenanceWindow,
                          day: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(({ key, label }) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={settings.operations.maintenanceWindow.startTime}
                    onChange={(e) =>
                      updateSettings('operations', {
                        maintenanceWindow: {
                          ...settings.operations.maintenanceWindow,
                          startTime: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={settings.operations.maintenanceWindow.endTime}
                    onChange={(e) =>
                      updateSettings('operations', {
                        maintenanceWindow: {
                          ...settings.operations.maintenanceWindow,
                          endTime: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Capacity</Label>
                  <Input
                    type="number"
                    value={settings.operations.maxCapacity}
                    onChange={(e) =>
                      updateSettings('operations', { maxCapacity: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input
                    value={settings.operations.emergencyContact}
                    onChange={(e) =>
                      updateSettings('operations', { emergencyContact: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Air Quality Settings */}
        <TabsContent value="air-quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-blue-600" />
                <span>CO2 Thresholds</span>
              </CardTitle>
              <CardDescription>Set carbon dioxide monitoring levels (ppm)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>Warning Level (ppm)</span>
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.airQuality.co2ThresholdWarning]}
                      onValueChange={([value]) =>
                        updateSettings('airQuality', { co2ThresholdWarning: value })
                      }
                      min={400}
                      max={1500}
                      step={50}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={settings.airQuality.co2ThresholdWarning}
                      onChange={(e) =>
                        updateSettings('airQuality', {
                          co2ThresholdWarning: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Critical Level (ppm)</span>
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.airQuality.co2ThresholdCritical]}
                      onValueChange={([value]) =>
                        updateSettings('airQuality', { co2ThresholdCritical: value })
                      }
                      min={600}
                      max={2000}
                      step={50}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={settings.airQuality.co2ThresholdCritical}
                      onChange={(e) =>
                        updateSettings('airQuality', {
                          co2ThresholdCritical: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wind className="h-5 w-5 text-orange-600" />
                <span>CO Thresholds</span>
              </CardTitle>
              <CardDescription>Set carbon monoxide monitoring levels (ppm)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>Warning Level (ppm)</span>
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.airQuality.coThresholdWarning]}
                      onValueChange={([value]) =>
                        updateSettings('airQuality', { coThresholdWarning: value })
                      }
                      min={10}
                      max={50}
                      step={5}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={settings.airQuality.coThresholdWarning}
                      onChange={(e) =>
                        updateSettings('airQuality', {
                          coThresholdWarning: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Critical Level (ppm)</span>
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[settings.airQuality.coThresholdCritical]}
                      onValueChange={([value]) =>
                        updateSettings('airQuality', { coThresholdCritical: value })
                      }
                      min={20}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={settings.airQuality.coThresholdCritical}
                      onChange={(e) =>
                        updateSettings('airQuality', {
                          coThresholdCritical: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Settings</CardTitle>
              <CardDescription>Configure air quality monitoring behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monitoring Interval (minutes)</Label>
                <Select
                  value={settings.airQuality.monitoringInterval.toString()}
                  onValueChange={(value) =>
                    updateSettings('airQuality', { monitoringInterval: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every minute</SelectItem>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="10">Every 10 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Auto-Shutdown on Critical</p>
                  <p className="text-sm text-gray-500">
                    Automatically trigger facility shutdown procedures when air quality reaches
                    critical levels
                  </p>
                </div>
                <Switch
                  checked={settings.airQuality.autoShutdownEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings('airQuality', { autoShutdownEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Settings */}
        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shift Configuration</CardTitle>
              <CardDescription>Configure default shift and scheduling rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Default Shift Duration (hours)</Label>
                  <Select
                    value={settings.scheduling.defaultShiftDuration.toString()}
                    onValueChange={(value) =>
                      updateSettings('scheduling', { defaultShiftDuration: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[4, 6, 8, 10, 12].map((h) => (
                        <SelectItem key={h} value={h.toString()}>
                          {h} hours
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Shift Gap (hours)</Label>
                  <Select
                    value={settings.scheduling.minShiftGap.toString()}
                    onValueChange={(value) =>
                      updateSettings('scheduling', { minShiftGap: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 8, 10, 12].map((h) => (
                        <SelectItem key={h} value={h.toString()}>
                          {h} hours
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Weekly Hours</Label>
                  <Input
                    type="number"
                    value={settings.scheduling.maxWeeklyHours}
                    onChange={(e) =>
                      updateSettings('scheduling', {
                        maxWeeklyHours: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Overtime Threshold</Label>
                  <Input
                    type="number"
                    value={settings.scheduling.overtimeThreshold}
                    onChange={(e) =>
                      updateSettings('scheduling', {
                        overtimeThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Advance Scheduling (days)</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[settings.scheduling.advanceSchedulingDays]}
                    onValueChange={([value]) =>
                      updateSettings('scheduling', { advanceSchedulingDays: value })
                    }
                    min={7}
                    max={60}
                    step={7}
                    className="flex-1"
                  />
                  <span className="w-20 text-right font-medium">
                    {settings.scheduling.advanceSchedulingDays} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Settings</CardTitle>
              <CardDescription>Configure schedule approval workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Auto-Approve Shift Swaps</p>
                  <p className="text-sm text-gray-500">
                    Automatically approve shift swap requests between eligible staff
                  </p>
                </div>
                <Switch
                  checked={settings.scheduling.autoApproveSwaps}
                  onCheckedChange={(checked) =>
                    updateSettings('scheduling', { autoApproveSwaps: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Require Manager Approval</p>
                  <p className="text-sm text-gray-500">
                    Require manager approval for all schedule changes and time-off requests
                  </p>
                </div>
                <Switch
                  checked={settings.scheduling.requireManagerApproval}
                  onCheckedChange={(checked) =>
                    updateSettings('scheduling', { requireManagerApproval: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Enable or disable notification channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Email</span>
                  </div>
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications', { emailEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <span>SMS</span>
                  </div>
                  <Switch
                    checked={settings.notifications.smsEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications', { smsEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-purple-600" />
                    <span>Push</span>
                  </div>
                  <Switch
                    checked={settings.notifications.pushEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications', { pushEnabled: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Configure time periods when non-urgent notifications are held
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={settings.notifications.quietHoursStart}
                    onChange={(e) =>
                      updateSettings('notifications', { quietHoursStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={settings.notifications.quietHoursEnd}
                    onChange={(e) =>
                      updateSettings('notifications', { quietHoursEnd: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Digest Frequency</Label>
                <Select
                  value={settings.notifications.digestFrequency}
                  onValueChange={(value) =>
                    updateSettings('notifications', {
                      digestFrequency: value as 'realtime' | 'hourly' | 'daily' | 'weekly',
                    })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly digest</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Security</CardTitle>
              <CardDescription>Configure session and login security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Select
                    value={settings.security.sessionTimeout.toString()}
                    onValueChange={(value) =>
                      updateSettings('security', { sessionTimeout: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Select
                    value={settings.security.maxLoginAttempts.toString()}
                    onValueChange={(value) =>
                      updateSettings('security', { maxLoginAttempts: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">
                    Require two-factor authentication for all users
                  </p>
                </div>
                <Switch
                  checked={settings.security.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings('security', { twoFactorEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password Policy</CardTitle>
              <CardDescription>Configure password requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Password Length</Label>
                  <Select
                    value={settings.security.passwordMinLength.toString()}
                    onValueChange={(value) =>
                      updateSettings('security', { passwordMinLength: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[6, 8, 10, 12, 14, 16].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} characters
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Password Expiry</Label>
                  <Select
                    value={settings.security.passwordExpiryDays.toString()}
                    onValueChange={(value) =>
                      updateSettings('security', { passwordExpiryDays: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Never</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Require special characters</span>
                  <Switch
                    checked={settings.security.passwordRequireSpecial}
                    onCheckedChange={(checked) =>
                      updateSettings('security', { passwordRequireSpecial: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Require numbers</span>
                  <Switch
                    checked={settings.security.passwordRequireNumbers}
                    onCheckedChange={(checked) =>
                      updateSettings('security', { passwordRequireNumbers: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Retention Settings */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>
                Configure how long different types of data are retained
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>Audit Logs</span>
                  </Label>
                  <Select
                    value={settings.dataRetention.auditLogRetentionDays.toString()}
                    onValueChange={(value) =>
                      updateSettings('dataRetention', {
                        auditLogRetentionDays: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="1825">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Reports</span>
                  </Label>
                  <Select
                    value={settings.dataRetention.reportRetentionDays.toString()}
                    onValueChange={(value) =>
                      updateSettings('dataRetention', {
                        reportRetentionDays: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="1825">5 years</SelectItem>
                      <SelectItem value="3650">10 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Incidents</span>
                  </Label>
                  <Select
                    value={settings.dataRetention.incidentRetentionDays.toString()}
                    onValueChange={(value) =>
                      updateSettings('dataRetention', {
                        incidentRetentionDays: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="1825">5 years</SelectItem>
                      <SelectItem value="3650">10 years</SelectItem>
                      <SelectItem value="0">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Schedules</span>
                  </Label>
                  <Select
                    value={settings.dataRetention.scheduleRetentionDays.toString()}
                    onValueChange={(value) =>
                      updateSettings('dataRetention', {
                        scheduleRetentionDays: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Import, export, and manage facility data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <Download className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Export All Data</p>
                    <p className="text-sm text-gray-500">Download complete data backup</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-4 justify-start">
                  <Upload className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Import Data</p>
                    <p className="text-sm text-gray-500">Restore from backup</p>
                  </div>
                </Button>
              </div>
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Danger Zone</p>
                    <p className="text-sm text-red-700 mb-3">
                      Permanently delete all facility data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm">
                      Delete All Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>Connect external calendar services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-gray-500">Sync schedules with Google Calendar</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={
                      settings.integrations.googleCalendarEnabled
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }
                  >
                    {settings.integrations.googleCalendarEnabled ? 'Connected' : 'Not connected'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {settings.integrations.googleCalendarEnabled ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
              <CardDescription>Configure communication service providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-gray-500">Send notifications to Slack channels</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={
                      settings.integrations.slackEnabled ? 'text-green-600' : 'text-gray-400'
                    }
                  >
                    {settings.integrations.slackEnabled ? 'Connected' : 'Not connected'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {settings.integrations.slackEnabled ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Provider</Label>
                  <Select
                    value={settings.integrations.emailProvider}
                    onValueChange={(value) =>
                      updateSettings('integrations', { emailProvider: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SMS Provider</Label>
                  <Select
                    value={settings.integrations.smsProvider}
                    onValueChange={(value) =>
                      updateSettings('integrations', { smsProvider: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="nexmo">Nexmo</SelectItem>
                      <SelectItem value="sns">Amazon SNS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all settings to their default values? This will
              discard all your customizations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset Settings</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Download your facility settings as a JSON file. This can be used for backup or
              to transfer settings to another facility.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
