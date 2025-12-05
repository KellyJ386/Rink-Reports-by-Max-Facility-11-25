'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  MoreVertical,
  Eye,
  Edit,
  ArrowUpRight,
  Filter,
  Users,
  TrendingUp,
  FileText,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  IncidentStats,
  severityColors,
  statusColors,
  incidentTypeLabels,
  FollowUp,
} from '@/types/incident'
import { useIncidents } from '@/hooks/useApi'

// Mock data for fallback
const mockIncidents: Incident[] = [
  {
    id: 'inc-1',
    facilityId: 'facility-1',
    reportNumber: 'INC-202412-0001',
    type: 'SLIP_FALL',
    severity: 'MODERATE',
    status: 'UNDER_REVIEW',
    title: 'Patron slip near concession area',
    description: 'Adult patron slipped on wet floor near concession stand. No visible injuries but complained of back pain.',
    location: 'Concession Area - Section B',
    incidentDate: '2024-12-05',
    incidentTime: '14:30',
    reportedBy: 'user-1',
    reportedByName: 'John Smith',
    reportedAt: '2024-12-05T14:45:00Z',
    injuredParty: {
      name: 'Jane Doe',
      phone: '555-123-4567',
      relationship: 'PATRON',
      medicalAttentionRequired: true,
      medicalAttentionProvided: true,
    },
    witnesses: [],
    immediateActions: 'Area was cordoned off. First aid administered. Wet floor signs placed.',
    followUps: [
      {
        id: 'fu-1',
        incidentId: 'inc-1',
        type: 'PHONE_CALL',
        scheduledDate: '2024-12-06',
        status: 'SCHEDULED',
        description: 'Follow-up call to injured patron',
        createdAt: '2024-12-05T15:00:00Z',
        updatedAt: '2024-12-05T15:00:00Z',
      },
    ],
    requiresFollowUp: true,
    escalationHistory: [],
    insuranceClaimed: false,
    legalInvolved: false,
    createdAt: '2024-12-05T14:45:00Z',
    updatedAt: '2024-12-05T14:45:00Z',
  },
  {
    id: 'inc-2',
    facilityId: 'facility-1',
    reportNumber: 'INC-202412-0002',
    type: 'EQUIPMENT_FAILURE',
    severity: 'MINOR',
    status: 'RESOLVED',
    title: 'Zamboni blade malfunction',
    description: 'Resurfacer blade became misaligned during operation. No injuries.',
    location: 'Ice Surface - Rink A',
    incidentDate: '2024-12-04',
    incidentTime: '18:15',
    reportedBy: 'user-2',
    reportedByName: 'Sarah Johnson',
    reportedAt: '2024-12-04T18:30:00Z',
    immediateActions: 'Resurfacing halted. Maintenance team called.',
    followUps: [],
    requiresFollowUp: false,
    escalationHistory: [],
    insuranceClaimed: false,
    legalInvolved: false,
    resolvedBy: 'user-3',
    resolvedByName: 'Mike Wilson',
    resolvedAt: '2024-12-04T20:00:00Z',
    resolutionSummary: 'Blade realigned and tested. Back in service.',
    createdAt: '2024-12-04T18:30:00Z',
    updatedAt: '2024-12-04T20:00:00Z',
  },
  {
    id: 'inc-3',
    facilityId: 'facility-1',
    reportNumber: 'INC-202412-0003',
    type: 'COLLISION',
    severity: 'SEVERE',
    status: 'INVESTIGATING',
    title: 'Player collision during practice',
    description: 'Two players collided during hockey practice. One player sustained a suspected concussion.',
    location: 'Ice Surface - Rink B',
    incidentDate: '2024-12-05',
    incidentTime: '09:45',
    reportedBy: 'user-1',
    reportedByName: 'John Smith',
    reportedAt: '2024-12-05T10:00:00Z',
    injuredParty: {
      name: 'Tom Roberts',
      phone: '555-987-6543',
      relationship: 'PATRON',
      injuryDescription: 'Suspected concussion',
      medicalAttentionRequired: true,
      medicalAttentionProvided: true,
      hospitalName: 'City General Hospital',
    },
    witnesses: [
      {
        id: 'wit-1',
        name: 'Coach Miller',
        phone: '555-111-2222',
        relationship: 'Team Coach',
      },
    ],
    followUps: [
      {
        id: 'fu-2',
        incidentId: 'inc-3',
        type: 'MEDICAL_CHECK',
        scheduledDate: '2024-12-07',
        status: 'SCHEDULED',
        description: 'Medical clearance follow-up',
        createdAt: '2024-12-05T10:30:00Z',
        updatedAt: '2024-12-05T10:30:00Z',
      },
    ],
    requiresFollowUp: true,
    escalationLevel: 2,
    escalatedTo: 'manager-1',
    escalatedToName: 'David Chen',
    escalatedAt: '2024-12-05T10:15:00Z',
    escalationReason: 'Severe injury requiring hospital visit',
    escalationHistory: [
      {
        id: 'esc-1',
        incidentId: 'inc-3',
        fromLevel: null,
        toLevel: 2,
        escalatedTo: 'manager-1',
        escalatedToName: 'David Chen',
        escalatedBy: 'user-1',
        escalatedByName: 'John Smith',
        reason: 'Severe injury requiring hospital visit',
        timestamp: '2024-12-05T10:15:00Z',
        acknowledged: true,
        acknowledgedAt: '2024-12-05T10:20:00Z',
      },
    ],
    insuranceClaimed: true,
    insuranceClaimNumber: 'CLM-2024-5678',
    insuranceClaimStatus: 'SUBMITTED',
    legalInvolved: false,
    createdAt: '2024-12-05T10:00:00Z',
    updatedAt: '2024-12-05T10:30:00Z',
  },
]

export default function IncidentsDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')

  // API hooks
  const { fetchIncidents } = useIncidents()

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchIncidents({ limit: 100 })
        if (result && result.items.length > 0) {
          // Map API response to local type
          const mappedIncidents: Incident[] = result.items.map((item) => ({
            id: item.id,
            facilityId: item.facilityId,
            reportNumber: item.reportNumber,
            type: item.type as IncidentType,
            severity: item.severity as IncidentSeverity,
            status: item.status as IncidentStatus,
            title: item.description.substring(0, 50),
            description: item.description,
            location: item.location,
            incidentDate: item.incidentDate.split('T')[0],
            incidentTime: item.incidentTime,
            reportedBy: item.reportedById,
            reportedByName: '',
            reportedAt: item.createdAt,
            injuredParty: ((item.injuredParties as unknown[]) || [])[0] as Incident['injuredParty'],
            witnesses: (item.witnesses as Incident['witnesses']) || [],
            immediateActions: item.immediateActions,
            rootCause: item.rootCause,
            preventiveMeasures: item.preventiveMeasures,
            followUps: ((item.followUps || []) as unknown[]).map((fu: unknown) => {
              const followUp = fu as {
                id: string
                incidentId: string
                type: string
                dueDate: string
                completedDate?: string
                status: string
                notes?: string
                createdAt: string
                updatedAt: string
              }
              return {
                id: followUp.id,
                incidentId: followUp.incidentId,
                type: followUp.type,
                scheduledDate: followUp.dueDate.split('T')[0],
                completedDate: followUp.completedDate,
                status: followUp.status === 'COMPLETED' ? 'COMPLETED' : followUp.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
                description: followUp.notes || '',
                createdAt: followUp.createdAt,
                updatedAt: followUp.updatedAt,
              } as FollowUp
            }),
            requiresFollowUp: (item.followUps || []).length > 0,
            escalationHistory: ((item.escalations || []) as unknown[]).map((esc: unknown) => {
              const escalation = esc as {
                id: string
                incidentId: string
                fromLevel: string
                toLevel: string
                reason: string
                escalatedById: string
                createdAt: string
              }
              return {
                id: escalation.id,
                incidentId: escalation.incidentId,
                fromLevel: null,
                toLevel: 2,
                escalatedTo: '',
                escalatedToName: '',
                escalatedBy: escalation.escalatedById,
                escalatedByName: '',
                reason: escalation.reason,
                timestamp: escalation.createdAt,
                acknowledged: true,
              }
            }),
            insuranceClaimed: false,
            legalInvolved: false,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            closedAt: item.closedAt,
          }))
          setIncidents(mappedIncidents)
        } else {
          // Fall back to mock data
          setIncidents(mockIncidents)
        }
      } catch (error) {
        console.error('Failed to load incidents:', error)
        setIncidents(mockIncidents)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchIncidents])

  // Calculate stats
  const stats: IncidentStats = useMemo(() => {
    const bySeverity: Record<IncidentSeverity, number> = {
      MINOR: 0,
      MODERATE: 0,
      SEVERE: 0,
      CRITICAL: 0,
    }
    const byType: Record<IncidentType, number> = {
      SLIP_FALL: 0,
      COLLISION: 0,
      EQUIPMENT_FAILURE: 0,
      MEDICAL_EMERGENCY: 0,
      PROPERTY_DAMAGE: 0,
      SECURITY: 0,
      ENVIRONMENTAL: 0,
      NEAR_MISS: 0,
      OTHER: 0,
    }
    const byStatus: Record<IncidentStatus, number> = {
      REPORTED: 0,
      UNDER_REVIEW: 0,
      INVESTIGATING: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
      ESCALATED: 0,
    }

    incidents.forEach((incident) => {
      if (bySeverity[incident.severity] !== undefined) {
        bySeverity[incident.severity]++
      }
      if (byType[incident.type] !== undefined) {
        byType[incident.type]++
      }
      if (byStatus[incident.status] !== undefined) {
        byStatus[incident.status]++
      }
    })

    const open = incidents.filter(
      (i) => !['RESOLVED', 'CLOSED'].includes(i.status)
    ).length
    const resolved = incidents.filter((i) => i.status === 'RESOLVED').length
    const escalated = incidents.filter((i) => i.escalationLevel).length
    const pendingFollowUps = incidents.reduce(
      (acc, i) => acc + i.followUps.filter((f) => f.status === 'SCHEDULED').length,
      0
    )
    const overdueFollowUps = incidents.reduce(
      (acc, i) =>
        acc +
        i.followUps.filter(
          (f) => f.status === 'SCHEDULED' && new Date(f.scheduledDate) < new Date()
        ).length,
      0
    )

    return {
      total: incidents.length,
      open,
      resolved,
      escalated,
      bySeverity,
      byType,
      byStatus,
      avgResolutionTimeHours: 24,
      pendingFollowUps,
      overdueFollowUps,
    }
  }, [incidents])

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        searchQuery === '' ||
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSeverity =
        severityFilter === 'all' || incident.severity === severityFilter
      const matchesStatus =
        statusFilter === 'all' || incident.status === statusFilter
      return matchesSearch && matchesSeverity && matchesStatus
    })
  }, [incidents, searchQuery, severityFilter, statusFilter])

  // Open incidents for main list
  const openIncidents = useMemo(() => {
    return filteredIncidents.filter(
      (i) => !['RESOLVED', 'CLOSED'].includes(i.status)
    )
  }, [filteredIncidents])

  // Recent incidents
  const recentIncidents = useMemo(() => {
    return [...filteredIncidents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [filteredIncidents])

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
          <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
          <p className="text-gray-600">
            Document and track facility incidents and injuries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/incidents/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.open}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Open Incidents</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.bySeverity.CRITICAL + stats.bySeverity.SEVERE} critical/severe
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.resolved}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.total > 0
                  ? Math.round((stats.resolved / stats.total) * 100)
                  : 0}
                % resolution rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {stats.escalated}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Escalated</p>
              <p className="text-xs text-gray-400 mt-1">Requires management attention</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {stats.pendingFollowUps}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Pending Follow-ups</p>
              {stats.overdueFollowUps > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {stats.overdueFollowUps} overdue
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown Alert */}
      {(stats.bySeverity.CRITICAL > 0 || stats.bySeverity.SEVERE > 0) && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    {stats.bySeverity.CRITICAL + stats.bySeverity.SEVERE} High Priority
                    Incident{stats.bySeverity.CRITICAL + stats.bySeverity.SEVERE !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-red-700">
                    {stats.bySeverity.CRITICAL > 0 && `${stats.bySeverity.CRITICAL} critical. `}
                    {stats.bySeverity.SEVERE > 0 && `${stats.bySeverity.SEVERE} severe. `}
                    Immediate attention required.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700">
                View Critical
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
          <TabsTrigger value="all">All Incidents ({incidents.length})</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups ({stats.pendingFollowUps})</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={severityFilter}
              onValueChange={(v) => setSeverityFilter(v as IncidentSeverity | 'all')}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="SEVERE">Severe</SelectItem>
                <SelectItem value="MODERATE">Moderate</SelectItem>
                <SelectItem value="MINOR">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as IncidentStatus | 'all')}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="REPORTED">Reported</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="ESCALATED">Escalated</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Incidents List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {openIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            incident.severity === 'CRITICAL'
                              ? 'bg-red-100'
                              : incident.severity === 'SEVERE'
                              ? 'bg-red-50'
                              : incident.severity === 'MODERATE'
                              ? 'bg-orange-100'
                              : 'bg-yellow-100'
                          }`}
                        >
                          <AlertTriangle
                            className={`h-5 w-5 ${
                              incident.severity === 'CRITICAL'
                                ? 'text-red-600'
                                : incident.severity === 'SEVERE'
                                ? 'text-red-500'
                                : incident.severity === 'MODERATE'
                                ? 'text-orange-500'
                                : 'text-yellow-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">
                              {incident.reportNumber}
                            </span>
                            <Badge className={severityColors[incident.severity]}>
                              {incident.severity}
                            </Badge>
                            <Badge className={statusColors[incident.status]}>
                              {incident.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="font-medium mt-1">{incident.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {incident.incidentDate} at {incident.incidentTime}
                            </span>
                            <span>{incident.location}</span>
                            <span>{incidentTypeLabels[incident.type]}</span>
                          </div>
                          {incident.injuredParty && (
                            <p className="text-sm text-red-600 mt-1">
                              Injured: {incident.injuredParty.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {incident.escalationLevel && (
                          <Badge className="bg-purple-100 text-purple-800">
                            Escalated L{incident.escalationLevel}
                          </Badge>
                        )}
                        {incident.followUps.filter((f) => f.status === 'SCHEDULED')
                          .length > 0 && (
                          <Badge variant="outline">
                            {
                              incident.followUps.filter((f) => f.status === 'SCHEDULED')
                                .length
                            }{' '}
                            follow-ups
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/incidents/${incident.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ArrowUpRight className="h-4 w-4 mr-2" />
                              Escalate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}

                {openIncidents.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                    <p className="font-medium">No open incidents</p>
                    <p className="text-sm mt-1">All incidents have been resolved</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Incidents</CardTitle>
              <CardDescription>Complete incident history</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {incident.status === 'RESOLVED' || incident.status === 'CLOSED' ? (
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-orange-100 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">
                              {incident.reportNumber}
                            </span>
                            <Badge className={severityColors[incident.severity]}>
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="font-medium">{incident.title}</p>
                          <p className="text-sm text-gray-500">
                            {incident.incidentDate} • {incident.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[incident.status]}>
                          {incident.status.replace(/_/g, ' ')}
                        </Badge>
                        <Link href={`/dashboard/incidents/${incident.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {recentIncidents.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No incidents recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="follow-ups">
          <Card>
            <CardHeader>
              <CardTitle>Pending Follow-ups</CardTitle>
              <CardDescription>
                Scheduled follow-up actions for incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents
                  .flatMap((incident) =>
                    incident.followUps
                      .filter((f) => f.status === 'SCHEDULED')
                      .map((followUp) => ({
                        ...followUp,
                        incident,
                      }))
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledDate).getTime() -
                      new Date(b.scheduledDate).getTime()
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-500">
                            {item.incident.reportNumber} • {item.type.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            new Date(item.scheduledDate) < new Date()
                              ? 'border-red-300 text-red-600'
                              : ''
                          }
                        >
                          {new Date(item.scheduledDate).toLocaleDateString()}
                        </Badge>
                        <Link href={`/dashboard/incidents/${item.incident.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                {stats.pendingFollowUps === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                    <p>No pending follow-ups</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
