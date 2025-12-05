'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Wrench,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Calendar,
  AlertCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Thermometer,
  Wind,
  Zap,
  CircleDot,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Equipment,
  MaintenanceRecord,
  EquipmentCategory,
  EquipmentStatus,
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
  equipmentCategoryLabels,
  equipmentStatusColors,
  maintenancePriorityColors,
  maintenanceStatusColors,
  EquipmentStats,
} from '@/types/equipment'

// Mock data generators
const generateMockEquipment = (): Equipment[] => [
  {
    id: 'eq-1',
    facilityId: 'facility-1',
    name: 'Main Refrigeration Unit',
    category: 'REFRIGERATION',
    manufacturer: 'Carrier',
    model: 'IceMax 5000',
    serialNumber: 'CAR-2020-1234',
    location: 'Mechanical Room A',
    status: 'OPERATIONAL',
    purchaseDate: '2020-03-15',
    warrantyExpiration: '2025-03-15',
    lastMaintenanceDate: '2024-11-15',
    nextMaintenanceDate: '2025-01-15',
    maintenanceIntervalDays: 60,
    totalOperatingHours: 28500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eq-2',
    facilityId: 'facility-1',
    name: 'Zamboni 552',
    category: 'RESURFACER',
    manufacturer: 'Zamboni',
    model: '552',
    serialNumber: 'ZAM-552-789',
    location: 'Equipment Bay',
    status: 'OPERATIONAL',
    purchaseDate: '2019-08-01',
    lastMaintenanceDate: '2024-12-01',
    nextMaintenanceDate: '2024-12-15',
    maintenanceIntervalDays: 14,
    totalOperatingHours: 4200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eq-3',
    facilityId: 'facility-1',
    name: 'HVAC System - Rink A',
    category: 'HVAC',
    manufacturer: 'Trane',
    model: 'IntelliPak',
    serialNumber: 'TRN-2021-5678',
    location: 'Rooftop Unit 1',
    status: 'NEEDS_MAINTENANCE',
    purchaseDate: '2021-01-10',
    warrantyExpiration: '2026-01-10',
    lastMaintenanceDate: '2024-09-20',
    nextMaintenanceDate: '2024-12-01',
    maintenanceIntervalDays: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eq-4',
    facilityId: 'facility-1',
    name: 'Dehumidifier Unit 1',
    category: 'DEHUMIDIFIER',
    manufacturer: 'Desert Aire',
    model: 'RinkMaster',
    location: 'Mechanical Room B',
    status: 'OPERATIONAL',
    lastMaintenanceDate: '2024-11-01',
    nextMaintenanceDate: '2025-02-01',
    maintenanceIntervalDays: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eq-5',
    facilityId: 'facility-1',
    name: 'Backup Compressor',
    category: 'COMPRESSOR',
    manufacturer: 'Bitzer',
    model: '4G-20.2',
    location: 'Mechanical Room A',
    status: 'OUT_OF_SERVICE',
    notes: 'Awaiting replacement parts',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const generateMockMaintenance = (): MaintenanceRecord[] => [
  {
    id: 'maint-1',
    equipmentId: 'eq-2',
    facilityId: 'facility-1',
    type: 'PREVENTIVE',
    priority: 'MEDIUM',
    status: 'SCHEDULED',
    title: 'Zamboni Blade Replacement',
    description: 'Replace conditioning blade and check hydraulics',
    scheduledDate: '2024-12-15',
    scheduledTime: '06:00',
    estimatedDuration: 120,
    assignedTo: 'user-1',
    assigneeName: 'John Smith',
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'maint-2',
    equipmentId: 'eq-3',
    facilityId: 'facility-1',
    type: 'CORRECTIVE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    title: 'HVAC Filter Replacement',
    description: 'Replace air filters and clean coils',
    scheduledDate: '2024-12-05',
    scheduledTime: '08:00',
    estimatedDuration: 90,
    assignedTo: 'user-2',
    assigneeName: 'Mike Wilson',
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'maint-3',
    equipmentId: 'eq-1',
    facilityId: 'facility-1',
    type: 'INSPECTION',
    priority: 'LOW',
    status: 'COMPLETED',
    title: 'Quarterly Refrigeration Inspection',
    description: 'Full system inspection and efficiency check',
    scheduledDate: '2024-11-15',
    completedDate: '2024-11-15',
    estimatedDuration: 180,
    actualDuration: 165,
    assignedTo: 'user-1',
    assigneeName: 'John Smith',
    cost: 450,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'maint-4',
    equipmentId: 'eq-5',
    facilityId: 'facility-1',
    type: 'EMERGENCY',
    priority: 'CRITICAL',
    status: 'OVERDUE',
    title: 'Compressor Repair',
    description: 'Diagnose and repair compressor failure',
    scheduledDate: '2024-11-30',
    estimatedDuration: 240,
    vendor: 'Arctic HVAC Services',
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Helper function to get category icon
const getCategoryIcon = (category: EquipmentCategory) => {
  switch (category) {
    case 'REFRIGERATION':
    case 'COMPRESSOR':
      return Thermometer
    case 'HVAC':
    case 'DEHUMIDIFIER':
      return Wind
    case 'RESURFACER':
      return Wrench
    case 'LIGHTING':
    case 'SCOREBOARD':
      return Zap
    default:
      return Settings
  }
}

export default function EquipmentDashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all')
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false)
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEquipment(generateMockEquipment())
      setMaintenance(generateMockMaintenance())
      setIsLoading(false)
    }, 500)
  }, [])

  // Calculate stats
  const stats: EquipmentStats = useMemo(() => {
    const byStatus: Record<EquipmentStatus, number> = {
      OPERATIONAL: 0,
      NEEDS_MAINTENANCE: 0,
      IN_MAINTENANCE: 0,
      OUT_OF_SERVICE: 0,
      RETIRED: 0,
    }
    const byCategory: Record<EquipmentCategory, number> = {
      REFRIGERATION: 0,
      RESURFACER: 0,
      HVAC: 0,
      DEHUMIDIFIER: 0,
      LIGHTING: 0,
      COMPRESSOR: 0,
      PUMP: 0,
      BOARDS: 0,
      GLASS: 0,
      NETTING: 0,
      SCOREBOARD: 0,
      SOUND_SYSTEM: 0,
      OTHER: 0,
    }

    equipment.forEach(eq => {
      byStatus[eq.status]++
      byCategory[eq.category]++
    })

    const needingMaintenance = equipment.filter(
      eq => eq.status === 'NEEDS_MAINTENANCE' || eq.status === 'IN_MAINTENANCE'
    ).length

    const overdueMaintenace = maintenance.filter(m => m.status === 'OVERDUE').length

    return {
      total: equipment.length,
      byStatus,
      byCategory,
      needingMaintenance,
      overdueMaintenace,
    }
  }, [equipment, maintenance])

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => {
      const matchesSearch =
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.model?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || eq.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || eq.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [equipment, searchQuery, categoryFilter, statusFilter])

  // Upcoming maintenance
  const upcomingMaintenance = useMemo(() => {
    return maintenance
      .filter(m => m.status === 'SCHEDULED' || m.status === 'OVERDUE')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5)
  }, [maintenance])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600">
            Track equipment status and maintenance schedules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsAddMaintenanceOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
          <Button onClick={() => setIsAddEquipmentOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="outline">{stats.total} total</Badge>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Total Equipment</p>
              <p className="text-2xl font-bold">{stats.byStatus.OPERATIONAL}</p>
              <p className="text-xs text-green-600 mt-1">Operational</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              {stats.needingMaintenance > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">Action needed</Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Needs Maintenance</p>
              <p className="text-2xl font-bold">{stats.needingMaintenance}</p>
              <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              {stats.overdueMaintenace > 0 && (
                <Badge className="bg-red-100 text-red-800">Overdue</Badge>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Overdue Tasks</p>
              <p className="text-2xl font-bold">{stats.overdueMaintenace}</p>
              <p className="text-xs text-red-600 mt-1">Immediate attention required</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Scheduled Tasks</p>
              <p className="text-2xl font-bold">
                {maintenance.filter(m => m.status === 'SCHEDULED').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Upcoming maintenance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Equipment Inventory</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search equipment..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as EquipmentCategory | 'all')}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(equipmentCategoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EquipmentStatus | 'all')}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="NEEDS_MAINTENANCE">Needs Maintenance</SelectItem>
                      <SelectItem value="IN_MAINTENANCE">In Maintenance</SelectItem>
                      <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredEquipment.map((eq) => {
                  const CategoryIcon = getCategoryIcon(eq.category)

                  return (
                    <div
                      key={eq.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEquipment(eq)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <CategoryIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{eq.name}</h3>
                              <Badge className={equipmentStatusColors[eq.status]}>
                                {eq.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {eq.manufacturer} {eq.model} • {eq.location}
                            </p>
                            {eq.nextMaintenanceDate && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Next maintenance: {new Date(eq.nextMaintenanceDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Schedule Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}

                {filteredEquipment.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No equipment found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Schedule */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {upcomingMaintenance.map((m) => (
                  <div key={m.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{m.title}</h4>
                          <Badge className={maintenancePriorityColors[m.priority]}>
                            {m.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {equipment.find(eq => eq.id === m.equipmentId)?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(m.scheduledDate).toLocaleDateString()}
                            {m.scheduledTime && ` at ${m.scheduledTime}`}
                          </span>
                        </div>
                      </div>
                      <Badge className={maintenanceStatusColors[m.status]}>
                        {m.status}
                      </Badge>
                    </div>
                    {m.assigneeName && (
                      <p className="text-xs text-gray-400 mt-2">
                        Assigned to: {m.assigneeName}
                      </p>
                    )}
                  </div>
                ))}

                {upcomingMaintenance.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">No upcoming maintenance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <CircleDot className="h-3 w-3 text-green-500" />
                    Operational
                  </span>
                  <span>{stats.byStatus.OPERATIONAL}</span>
                </div>
                <Progress
                  value={(stats.byStatus.OPERATIONAL / stats.total) * 100}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <CircleDot className="h-3 w-3 text-yellow-500" />
                    Needs Maintenance
                  </span>
                  <span>{stats.byStatus.NEEDS_MAINTENANCE}</span>
                </div>
                <Progress
                  value={(stats.byStatus.NEEDS_MAINTENANCE / stats.total) * 100}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <CircleDot className="h-3 w-3 text-red-500" />
                    Out of Service
                  </span>
                  <span>{stats.byStatus.OUT_OF_SERVICE}</span>
                </div>
                <Progress
                  value={(stats.byStatus.OUT_OF_SERVICE / stats.total) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Equipment Dialog */}
      <Dialog open={isAddEquipmentOpen} onOpenChange={setIsAddEquipmentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>
              Add a new piece of equipment to track
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name *</Label>
              <Input id="name" placeholder="e.g., Main Refrigeration Unit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(equipmentCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input id="manufacturer" placeholder="e.g., Carrier" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="e.g., IceMax 5000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="e.g., Mechanical Room A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenanceInterval">Maintenance Interval (days)</Label>
              <Input id="maintenanceInterval" type="number" placeholder="e.g., 90" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEquipmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddEquipmentOpen(false)}>
              Add Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={isAddMaintenanceOpen} onOpenChange={setIsAddMaintenanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>
              Create a new maintenance task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintTitle">Task Title *</Label>
              <Input id="maintTitle" placeholder="e.g., Quarterly Inspection" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintType">Type *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                    <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                    <SelectItem value="INSPECTION">Inspection</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedDate">Scheduled Date *</Label>
                <Input id="schedDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedTime">Time</Label>
                <Input id="schedTime" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the maintenance task..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMaintenanceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddMaintenanceOpen(false)}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
