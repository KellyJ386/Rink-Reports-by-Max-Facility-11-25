'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronUp,
  MessageSquare,
  FileText,
  Plus,
  Edit,
  Users,
  Shield,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Incident,
  FollowUp,
  EscalationRecord,
  severityColors,
  statusColors,
  incidentTypeLabels,
  followUpTypeLabels,
  escalationLevelLabels,
  FollowUpType,
  EscalationLevel,
  defaultEscalationRules,
  isFollowUpOverdue,
} from '@/types/incident'

// Mock data for demonstration
const mockIncident: Incident = {
  id: 'inc-1',
  facilityId: 'facility-1',
  reportNumber: 'FAC-202412-0001',
  type: 'SLIP_FALL',
  severity: 'MODERATE',
  status: 'INVESTIGATING',
  title: 'Slip and fall near rink entrance',
  description: 'Patron slipped on wet floor near the rink entrance during public skating session. Floor was wet due to melted ice tracked from the rink.',
  location: 'Rink A Entrance',
  incidentDate: '2024-12-04',
  incidentTime: '14:30',
  reportedBy: 'user-1',
  reportedByName: 'John Smith',
  reportedAt: '2024-12-04T14:45:00Z',
  injuredParty: {
    name: 'Jane Doe',
    phone: '555-123-4567',
    email: 'jane@example.com',
    age: 35,
    relationship: 'PATRON',
    injuryDescription: 'Bruised knee and minor scrape on palm',
    medicalAttentionRequired: false,
    refusedTreatment: false,
  },
  witnesses: [
    {
      id: 'wit-1',
      name: 'Bob Wilson',
      phone: '555-987-6543',
      relationship: 'Bystander',
      statement: 'I saw the patron slip on the wet floor. There was no wet floor sign present.',
    },
  ],
  immediateActions: 'First aid administered. Wet floor signs placed. Area mopped.',
  followUps: [
    {
      id: 'fu-1',
      incidentId: 'inc-1',
      type: 'PHONE_CALL',
      scheduledDate: '2024-12-05',
      scheduledTime: '10:00',
      completedDate: '2024-12-05',
      completedBy: 'user-1',
      completedByName: 'John Smith',
      status: 'COMPLETED',
      description: 'Follow up call to check on patron recovery',
      outcome: 'Patron reports minor soreness but recovering well. No further medical attention needed.',
      createdAt: '2024-12-04T15:00:00Z',
      updatedAt: '2024-12-05T10:30:00Z',
    },
    {
      id: 'fu-2',
      incidentId: 'inc-1',
      type: 'CORRECTIVE_ACTION',
      scheduledDate: '2024-12-06',
      status: 'SCHEDULED',
      description: 'Install additional floor mats at rink entrance',
      createdAt: '2024-12-04T15:00:00Z',
      updatedAt: '2024-12-04T15:00:00Z',
    },
  ],
  requiresFollowUp: true,
  nextFollowUpDate: '2024-12-06',
  escalationLevel: 1,
  escalatedTo: 'user-2',
  escalatedToName: 'Sarah Manager',
  escalatedAt: '2024-12-04T15:00:00Z',
  escalationHistory: [
    {
      id: 'esc-1',
      incidentId: 'inc-1',
      fromLevel: null,
      toLevel: 1,
      escalatedTo: 'user-2',
      escalatedToName: 'Sarah Manager',
      escalatedBy: 'system',
      escalatedByName: 'System',
      reason: 'Automatic escalation based on MODERATE severity',
      timestamp: '2024-12-04T15:00:00Z',
      acknowledged: true,
      acknowledgedAt: '2024-12-04T15:30:00Z',
    },
  ],
  insuranceClaimed: false,
  legalInvolved: false,
  createdAt: '2024-12-04T14:45:00Z',
  updatedAt: '2024-12-05T10:30:00Z',
}

export default function IncidentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false)
  const [isEscalateOpen, setIsEscalateOpen] = useState(false)

  useEffect(() => {
    // Simulate API call - in production, fetch from /api/incidents/{id}
    setTimeout(() => {
      setIncident(mockIncident)
      setIsLoading(false)
    }, 500)
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold">Incident not found</h2>
      </div>
    )
  }

  const completedFollowUps = incident.followUps.filter(f => f.status === 'COMPLETED').length
  const totalFollowUps = incident.followUps.length
  const overdueFollowUps = incident.followUps.filter(f => isFollowUpOverdue(f)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/incidents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
              <Badge className={severityColors[incident.severity]}>
                {incident.severity}
              </Badge>
              <Badge className={statusColors[incident.status]}>
                {incident.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              Report #{incident.reportNumber} • Reported {new Date(incident.reportedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddFollowUpOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-up
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEscalateOpen(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Escalate
          </Button>
        </div>
      </div>

      {/* Escalation Banner */}
      {incident.escalationLevel && incident.escalationLevel > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">
                    Escalated to Level {incident.escalationLevel} ({escalationLevelLabels[incident.escalationLevel]})
                  </p>
                  <p className="text-sm text-orange-700">
                    Assigned to: {incident.escalatedToName}
                  </p>
                </div>
              </div>
              <p className="text-sm text-orange-600">
                {new Date(incident.escalatedAt || '').toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="followups">
                Follow-ups
                {overdueFollowUps > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800">{overdueFollowUps}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="escalation">Escalation History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Incident Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Incident Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{incidentTypeLabels[incident.type]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{incident.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium">
                        {new Date(incident.incidentDate).toLocaleDateString()} at {incident.incidentTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reported By</p>
                      <p className="font-medium">{incident.reportedByName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{incident.description}</p>
                  </div>
                  {incident.immediateActions && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Immediate Actions Taken</p>
                      <p className="text-gray-700">{incident.immediateActions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Injured Party Card */}
              {incident.injuredParty && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Injured Party
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{incident.injuredParty.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Relationship</p>
                        <p className="font-medium">{incident.injuredParty.relationship}</p>
                      </div>
                      {incident.injuredParty.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{incident.injuredParty.phone}</p>
                        </div>
                      )}
                      {incident.injuredParty.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{incident.injuredParty.email}</p>
                        </div>
                      )}
                    </div>
                    {incident.injuredParty.injuryDescription && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Injury Description</p>
                        <p className="text-gray-700">{incident.injuredParty.injuryDescription}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Badge className={incident.injuredParty.medicalAttentionRequired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {incident.injuredParty.medicalAttentionRequired ? 'Medical Attention Required' : 'No Medical Attention Required'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Witnesses Card */}
              {incident.witnesses && incident.witnesses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Witnesses ({incident.witnesses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {incident.witnesses.map((witness, idx) => (
                        <div key={witness.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{witness.name}</p>
                            <p className="text-sm text-gray-500">{witness.relationship}</p>
                          </div>
                          {witness.phone && (
                            <p className="text-sm text-gray-600">{witness.phone}</p>
                          )}
                          {witness.statement && (
                            <p className="text-sm text-gray-700 mt-2 italic">&ldquo;{witness.statement}&rdquo;</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="followups" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Follow-up Tasks</CardTitle>
                    <Button size="sm" onClick={() => setIsAddFollowUpOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Follow-up
                    </Button>
                  </div>
                  <CardDescription>
                    {completedFollowUps} of {totalFollowUps} completed
                  </CardDescription>
                  <Progress value={(completedFollowUps / totalFollowUps) * 100} className="h-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incident.followUps.map((followUp) => {
                      const isOverdue = isFollowUpOverdue(followUp)
                      return (
                        <div
                          key={followUp.id}
                          className={`p-4 rounded-lg border ${
                            isOverdue ? 'border-red-200 bg-red-50' :
                            followUp.status === 'COMPLETED' ? 'border-green-200 bg-green-50' :
                            'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {followUp.status === 'COMPLETED' ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                              ) : isOverdue ? (
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                              ) : (
                                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{followUpTypeLabels[followUp.type]}</p>
                                  <Badge className={
                                    followUp.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    isOverdue ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }>
                                    {isOverdue ? 'OVERDUE' : followUp.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{followUp.description}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Scheduled: {new Date(followUp.scheduledDate).toLocaleDateString()}
                                  {followUp.scheduledTime && ` at ${followUp.scheduledTime}`}
                                </p>
                                {followUp.completedDate && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed: {new Date(followUp.completedDate).toLocaleDateString()} by {followUp.completedByName}
                                  </p>
                                )}
                                {followUp.outcome && (
                                  <div className="mt-2 p-2 bg-white rounded border">
                                    <p className="text-xs text-gray-500">Outcome:</p>
                                    <p className="text-sm text-gray-700">{followUp.outcome}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {followUp.status !== 'COMPLETED' && (
                              <Button size="sm" variant="outline">
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {incident.followUps.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No follow-ups scheduled</p>
                        <Button className="mt-4" onClick={() => setIsAddFollowUpOpen(true)}>
                          Schedule First Follow-up
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="escalation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Escalation History</CardTitle>
                  <CardDescription>
                    Track how this incident has been escalated through management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incident.escalationHistory.map((record, idx) => (
                      <div key={record.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            record.acknowledged ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {record.toLevel}
                          </div>
                          {idx < incident.escalationHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {record.fromLevel === null ? 'Initial escalation' : `Level ${record.fromLevel} → Level ${record.toLevel}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(record.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Escalated to: <span className="font-medium">{record.escalatedToName}</span>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{record.reason}</p>
                          {record.acknowledged && (
                            <Badge className="mt-2 bg-green-100 text-green-800">
                              Acknowledged {new Date(record.acknowledgedAt || '').toLocaleString()}
                            </Badge>
                          )}
                          {record.response && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-sm text-gray-700">{record.response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {incident.escalationHistory.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No escalation history</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={statusColors[incident.status]}>
                  {incident.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Severity</span>
                <Badge className={severityColors[incident.severity]}>
                  {incident.severity}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Escalation Level</span>
                <span className="font-medium">
                  {incident.escalationLevel ? `Level ${incident.escalationLevel}` : 'Not Escalated'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Follow-ups</span>
                <span className="font-medium">{completedFollowUps}/{totalFollowUps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Insurance Claim</span>
                <Badge variant={incident.insuranceClaimed ? 'default' : 'outline'}>
                  {incident.insuranceClaimed ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Next Follow-up */}
          {incident.nextFollowUpDate && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-700">Next Follow-up</p>
                    <p className="font-medium text-blue-900">
                      {new Date(incident.nextFollowUpDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Incident
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Follow-up Dialog */}
      <Dialog open={isAddFollowUpOpen} onOpenChange={setIsAddFollowUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>
              Add a new follow-up task for this incident
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Follow-up Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(followUpTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Time (optional)</Label>
                <Input type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the follow-up task..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFollowUpOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddFollowUpOpen(false)}>
              Schedule Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={isEscalateOpen} onOpenChange={setIsEscalateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Incident</DialogTitle>
            <DialogDescription>
              Escalate this incident to a higher level of management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Escalate To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Level 2 - Manager</SelectItem>
                  <SelectItem value="3">Level 3 - Director</SelectItem>
                  <SelectItem value="4">Level 4 - Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason for Escalation</Label>
              <Textarea
                placeholder="Explain why this incident needs to be escalated..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEscalateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setIsEscalateOpen(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              Escalate Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
