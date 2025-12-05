'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Search,
  MoreVertical,
  Play,
  Eye,
  Copy,
  Edit,
  Trash2,
  FileText,
  Filter,
  AlertTriangle,
  TrendingUp,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChecklistTemplate,
  ChecklistInstance,
  ChecklistStats,
  categoryLabels,
  categoryColors,
  statusColors,
  frequencyLabels,
  CompletionStatus,
  ChecklistCategory,
  isChecklistOverdue,
} from '@/types/checklist'
import { useChecklists, useChecklistTemplates } from '@/hooks/useApi'

// Mock data
const mockTemplates: ChecklistTemplate[] = [
  {
    id: 'tpl-1',
    facilityId: 'facility-1',
    name: 'Daily Opening Checklist',
    description: 'Complete before facility opens to the public',
    category: 'OPENING',
    frequency: 'DAILY',
    estimatedDuration: 30,
    sections: [
      {
        id: 'sec-1',
        title: 'Facility Access',
        order: 1,
        isRequired: true,
        items: [
          { id: 'item-1', label: 'Unlock all entrance doors', type: 'CHECKBOX', order: 1, isRequired: true },
          { id: 'item-2', label: 'Disable alarm system', type: 'CHECKBOX', order: 2, isRequired: true },
          { id: 'item-3', label: 'Check for overnight issues', type: 'YES_NO', order: 3, isRequired: true },
        ],
      },
      {
        id: 'sec-2',
        title: 'Ice Condition',
        order: 2,
        isRequired: true,
        items: [
          { id: 'item-4', label: 'Ice surface temperature', type: 'NUMERIC', order: 1, isRequired: true },
          { id: 'item-5', label: 'Ice condition acceptable', type: 'PASS_FAIL', order: 2, isRequired: true },
          { id: 'item-6', label: 'Complete initial resurface', type: 'CHECKBOX', order: 3, isRequired: true },
        ],
      },
    ],
    requiredRoles: ['Ice Technician'],
    isActive: true,
    version: 1,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    facilityId: 'facility-1',
    name: 'Daily Closing Checklist',
    description: 'Complete after all patrons have left',
    category: 'CLOSING',
    frequency: 'DAILY',
    estimatedDuration: 25,
    sections: [
      {
        id: 'sec-1',
        title: 'Patron Area',
        order: 1,
        isRequired: true,
        items: [
          { id: 'item-1', label: 'All patrons have exited', type: 'CHECKBOX', order: 1, isRequired: true },
          { id: 'item-2', label: 'Locker rooms checked', type: 'CHECKBOX', order: 2, isRequired: true },
        ],
      },
    ],
    requiredRoles: ['Ice Technician'],
    isActive: true,
    version: 1,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-3',
    facilityId: 'facility-1',
    name: 'Weekly Safety Inspection',
    description: 'Comprehensive safety inspection',
    category: 'SAFETY',
    frequency: 'WEEKLY',
    estimatedDuration: 45,
    sections: [
      {
        id: 'sec-1',
        title: 'Fire Safety',
        order: 1,
        isRequired: true,
        items: [
          { id: 'item-1', label: 'Fire extinguishers inspected', type: 'PASS_FAIL', order: 1, isRequired: true },
          { id: 'item-2', label: 'Emergency lighting functional', type: 'PASS_FAIL', order: 2, isRequired: true },
        ],
      },
    ],
    isActive: true,
    version: 1,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-4',
    facilityId: 'facility-1',
    name: 'Zamboni Pre-Operation Check',
    description: 'Complete before each resurfacing',
    category: 'RESURFACER',
    frequency: 'DAILY',
    estimatedDuration: 10,
    sections: [
      {
        id: 'sec-1',
        title: 'Equipment Check',
        order: 1,
        isRequired: true,
        items: [
          { id: 'item-1', label: 'Fuel level adequate', type: 'PASS_FAIL', order: 1, isRequired: true },
          { id: 'item-2', label: 'Water tank level', type: 'NUMERIC', order: 2, isRequired: true },
          { id: 'item-3', label: 'Blade condition', type: 'PASS_FAIL', order: 3, isRequired: true },
        ],
      },
    ],
    isActive: true,
    version: 1,
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockInstances: ChecklistInstance[] = [
  {
    id: 'inst-1',
    templateId: 'tpl-1',
    facilityId: 'facility-1',
    status: 'COMPLETED',
    startedAt: '2024-12-05T06:00:00Z',
    completedAt: '2024-12-05T06:25:00Z',
    completedBy: 'user-1',
    completedByName: 'John Smith',
    sections: [],
    completionPercentage: 100,
    issues: [],
    createdAt: '2024-12-05T06:00:00Z',
    updatedAt: '2024-12-05T06:25:00Z',
  },
  {
    id: 'inst-2',
    templateId: 'tpl-2',
    facilityId: 'facility-1',
    status: 'COMPLETED',
    startedAt: '2024-12-04T22:00:00Z',
    completedAt: '2024-12-04T22:20:00Z',
    completedBy: 'user-2',
    completedByName: 'Sarah Johnson',
    sections: [],
    completionPercentage: 100,
    issues: [],
    createdAt: '2024-12-04T22:00:00Z',
    updatedAt: '2024-12-04T22:20:00Z',
  },
  {
    id: 'inst-3',
    templateId: 'tpl-3',
    facilityId: 'facility-1',
    status: 'IN_PROGRESS',
    startedAt: '2024-12-05T09:00:00Z',
    assignedTo: 'user-1',
    assignedToName: 'John Smith',
    dueBy: '2024-12-05T17:00:00Z',
    sections: [],
    completionPercentage: 60,
    issues: [
      {
        id: 'issue-1',
        itemId: 'item-2',
        itemLabel: 'Emergency lighting functional',
        severity: 'HIGH',
        description: 'Exit sign light B3 not working',
        status: 'OPEN',
        createdAt: '2024-12-05T09:15:00Z',
        followUpRequired: true,
      },
    ],
    createdAt: '2024-12-05T09:00:00Z',
    updatedAt: '2024-12-05T09:15:00Z',
  },
  {
    id: 'inst-4',
    templateId: 'tpl-1',
    facilityId: 'facility-1',
    status: 'OVERDUE',
    scheduledDate: '2024-12-04',
    dueBy: '2024-12-04T08:00:00Z',
    sections: [],
    completionPercentage: 0,
    issues: [],
    createdAt: '2024-12-04T00:00:00Z',
    updatedAt: '2024-12-04T00:00:00Z',
  },
]

export default function ChecklistsDashboard() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [instances, setInstances] = useState<ChecklistInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ChecklistCategory | 'all'>('all')

  // API hooks
  const { fetchChecklists } = useChecklists()
  const { fetchTemplates } = useChecklistTemplates()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch templates from API
        const templatesResult = await fetchTemplates({ limit: 100, isActive: true })
        if (templatesResult && templatesResult.items.length > 0) {
          // Map API response to local type
          const mappedTemplates: ChecklistTemplate[] = templatesResult.items.map((item) => ({
            id: item.id,
            facilityId: item.facilityId,
            name: item.name,
            description: item.description || '',
            category: item.category as ChecklistCategory,
            frequency: item.frequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONCE',
            estimatedDuration: item.estimatedDuration,
            sections: (item.sections as ChecklistTemplate['sections']) || [],
            requiredRoles: item.requiredRoles || [],
            isActive: item.isActive,
            version: item.version,
            createdBy: item.createdById,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }))
          setTemplates(mappedTemplates)
        } else {
          // Fall back to mock data
          setTemplates(mockTemplates)
        }

        // Fetch checklist instances from API
        const checklistsResult = await fetchChecklists({ limit: 100 })
        if (checklistsResult && checklistsResult.items.length > 0) {
          // Map API response to local type
          const mappedInstances: ChecklistInstance[] = checklistsResult.items.map((item) => ({
            id: item.id,
            templateId: item.templateId,
            facilityId: item.facilityId,
            status: item.status as CompletionStatus,
            startedAt: item.startedAt,
            completedAt: item.completedAt,
            completedBy: item.completedById,
            completedByName: '',
            scheduledDate: item.scheduledFor?.split('T')[0],
            dueBy: item.dueBy,
            assignedTo: item.assignedToId,
            assignedToName: '',
            sections: (item.sections as ChecklistInstance['sections']) || [],
            completionPercentage: item.completionPercentage,
            issues: (item.issues as ChecklistInstance['issues']) || [],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }))
          setInstances(mappedInstances)
        } else {
          // Fall back to mock data
          setInstances(mockInstances)
        }
      } catch (error) {
        console.error('Failed to load checklists data:', error)
        // Fall back to mock data
        setTemplates(mockTemplates)
        setInstances(mockInstances)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [fetchTemplates, fetchChecklists])

  // Calculate stats
  const stats: ChecklistStats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    const completedToday = instances.filter(
      i => i.status === 'COMPLETED' && i.completedAt && new Date(i.completedAt) >= todayStart
    ).length

    const completedThisWeek = instances.filter(
      i => i.status === 'COMPLETED' && i.completedAt && new Date(i.completedAt) >= weekStart
    ).length

    const overdueCount = instances.filter(i => i.status === 'OVERDUE' || isChecklistOverdue(i)).length
    const inProgressCount = instances.filter(i => i.status === 'IN_PROGRESS').length
    const issuesOpen = instances.reduce((acc, i) => acc + i.issues.filter(iss => iss.status === 'OPEN').length, 0)
    const issuesCritical = instances.reduce((acc, i) => acc + i.issues.filter(iss => iss.severity === 'CRITICAL').length, 0)

    const byCategory: Record<ChecklistCategory, number> = {} as Record<ChecklistCategory, number>
    templates.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1
    })

    return {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      completedToday,
      completedThisWeek,
      overdueCount,
      inProgressCount,
      avgCompletionTime: 25,
      complianceRate: 94,
      issuesOpen,
      issuesCritical,
      byCategory,
    }
  }, [templates, instances])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, categoryFilter])

  // Recent activity
  const recentInstances = useMemo(() => {
    return [...instances]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [instances])

  // Get template name for an instance
  const getTemplateName = (templateId: string) => {
    return templates.find(t => t.id === templateId)?.name || 'Unknown'
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
          <p className="text-gray-600">
            Manage checklist templates and track completions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/checklists/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Start Checklist
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.completedToday}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-xs text-gray-400 mt-1">{stats.completedThisWeek} this week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.inProgressCount}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-xs text-gray-400 mt-1">Currently being completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.overdueCount}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Overdue</p>
              {stats.overdueCount > 0 && (
                <p className="text-xs text-red-500 mt-1">Requires immediate attention</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.complianceRate}%</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Compliance Rate</p>
              <Progress value={stats.complianceRate} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Alert */}
      {stats.issuesOpen > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">
                    {stats.issuesOpen} Open Issue{stats.issuesOpen !== 1 ? 's' : ''} Found
                  </p>
                  <p className="text-sm text-yellow-700">
                    {stats.issuesCritical > 0 && `${stats.issuesCritical} critical. `}
                    Review and resolve issues from recent checklists
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View Issues
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ChecklistCategory | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className={categoryColors[template.category]}>
                        {categoryLabels[template.category]}
                      </Badge>
                      <CardTitle className="mt-2 text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {template.description}
                      </CardDescription>
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
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-4 w-4" />
                      {template.sections.reduce((acc, s) => acc + s.items.length, 0)} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      ~{template.estimatedDuration} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{frequencyLabels[template.frequency]}</Badge>
                    <Link href={`/dashboard/checklists/new?template=${template.id}`}>
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates found</p>
                <Button className="mt-4" variant="outline">
                  Create Template
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Completions</CardTitle>
              <CardDescription>
                Latest checklist activity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentInstances.map((instance) => (
                  <div key={instance.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {instance.status === 'COMPLETED' ? (
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : instance.status === 'IN_PROGRESS' ? (
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{getTemplateName(instance.templateId)}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {instance.completedByName && (
                              <span>{instance.completedByName}</span>
                            )}
                            <span>•</span>
                            <span>{new Date(instance.updatedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[instance.status]}>
                          {instance.status.replace(/_/g, ' ')}
                        </Badge>
                        {instance.status === 'IN_PROGRESS' && (
                          <div className="flex items-center gap-2">
                            <Progress value={instance.completionPercentage} className="w-20 h-2" />
                            <span className="text-sm text-gray-500">{instance.completionPercentage}%</span>
                          </div>
                        )}
                        {instance.issues.length > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {instance.issues.length} issue{instance.issues.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {recentInstances.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Checklists</CardTitle>
              <CardDescription>
                Upcoming checklists based on frequency settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.filter(t => t.frequency !== 'ONCE').map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-500">
                          {frequencyLabels[template.frequency]} • Next due: Today
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[template.category]}>
                        {categoryLabels[template.category]}
                      </Badge>
                      <Link href={`/dashboard/checklists/new?template=${template.id}`}>
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
