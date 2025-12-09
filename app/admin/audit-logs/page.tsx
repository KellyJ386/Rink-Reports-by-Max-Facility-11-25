'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  FileText,
  Shield,
  Settings,
  Database,
  Trash2,
  Edit,
  Plus,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuditLog, AuditAction, AuditSeverity } from '@/types/admin'

// Action icons mapping
const ACTION_ICONS: Record<string, React.ElementType> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  VIEW: Eye,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  EXPORT: Download,
  IMPORT: Database,
  APPROVE: CheckCircle,
  REJECT: XCircle,
  LOCK: Lock,
  UNLOCK: Unlock,
  INVITE: UserPlus,
  REMOVE: UserMinus,
}

// Severity configuration
const SEVERITY_CONFIG: Record<AuditSeverity, { label: string; color: string; icon: React.ElementType }> = {
  INFO: { label: 'Info', color: 'bg-blue-100 text-blue-800', icon: Info },
  WARNING: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  ERROR: { label: 'Error', color: 'bg-red-100 text-red-800', icon: XCircle },
  CRITICAL: { label: 'Critical', color: 'bg-red-200 text-red-900', icon: AlertTriangle },
}

// Resource icons
const RESOURCE_ICONS: Record<string, React.ElementType> = {
  user: User,
  role: Shield,
  schedule: Calendar,
  incident: AlertTriangle,
  report: FileText,
  settings: Settings,
  session: Monitor,
  facility: Database,
}

// Generate mock audit logs
const generateMockLogs = (count: number): AuditLog[] => {
  const actions: AuditAction[] = [
    'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT',
    'EXPORT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK',
  ]
  const resources = ['user', 'role', 'schedule', 'incident', 'report', 'settings', 'session']
  const users = [
    { id: 'user-1', name: 'John Smith' },
    { id: 'user-2', name: 'Jane Doe' },
    { id: 'user-3', name: 'Mike Johnson' },
    { id: 'user-4', name: 'Sarah Williams' },
    { id: 'user-5', name: 'System' },
  ]
  const severities: AuditSeverity[] = ['INFO', 'INFO', 'INFO', 'WARNING', 'ERROR']
  const statuses: ('SUCCESS' | 'FAILURE')[] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILURE']
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge']
  const ips = ['192.168.1.100', '192.168.1.101', '10.0.0.50', '172.16.0.25']

  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const resource = resources[Math.floor(Math.random() * resources.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]

    const now = new Date()
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)

    return {
      id: `log-${i + 1}`,
      timestamp: timestamp.toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      resource,
      resourceId: `${resource}-${Math.floor(Math.random() * 1000)}`,
      details: {
        description: `${user.name} ${action.toLowerCase()}d ${resource}`,
        browser: browsers[Math.floor(Math.random() * browsers.length)],
      },
      changes: action === 'UPDATE' ? {
        before: { status: 'active' },
        after: { status: 'inactive' },
      } : undefined,
      ipAddress: ips[Math.floor(Math.random() * ips.length)],
      userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`,
      severity,
      status,
      facilityId: 'facility-1',
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Date range presets
const DATE_PRESETS = [
  { label: 'Last hour', value: 'hour' },
  { label: 'Last 24 hours', value: 'day' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'Last 30 days', value: 'month' },
  { label: 'Last 90 days', value: 'quarter' },
  { label: 'Custom range', value: 'custom' },
]

export default function AuditLogsPage() {
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActions, setSelectedActions] = useState<AuditAction[]>([])
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [selectedSeverities, setSelectedSeverities] = useState<AuditSeverity[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'SUCCESS' | 'FAILURE'>('all')
  const [dateRange, setDateRange] = useState('week')
  const [selectedUser, setSelectedUser] = useState<string | null>(
    searchParams.get('userId')
  )

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLogs(generateMockLogs(200))
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let result = [...logs]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (log) =>
          log.userName.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.resource?.toLowerCase().includes(query) ||
          log.resourceId?.toLowerCase().includes(query) ||
          log.ipAddress?.toLowerCase().includes(query)
      )
    }

    // Action filter
    if (selectedActions.length > 0) {
      result = result.filter((log) => selectedActions.includes(log.action))
    }

    // Resource filter
    if (selectedResources.length > 0) {
      result = result.filter((log) => log.resource && selectedResources.includes(log.resource))
    }

    // Severity filter
    if (selectedSeverities.length > 0) {
      result = result.filter((log) => selectedSeverities.includes(log.severity))
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((log) => log.status === selectedStatus)
    }

    // User filter
    if (selectedUser) {
      result = result.filter((log) => log.userId === selectedUser)
    }

    // Date range filter
    const now = new Date()
    let startDate: Date | null = null

    switch (dateRange) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
    }

    if (startDate) {
      result = result.filter((log) => new Date(log.timestamp) >= startDate!)
    }

    setFilteredLogs(result)
    setPage(1)
  }, [logs, searchQuery, selectedActions, selectedResources, selectedSeverities, selectedStatus, selectedUser, dateRange])

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filteredLogs.length / pageSize)

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev)
      if (next.has(logId)) {
        next.delete(logId)
      } else {
        next.add(logId)
      }
      return next
    })
  }

  const toggleAction = (action: AuditAction) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    )
  }

  const toggleResource = (resource: string) => {
    setSelectedResources((prev) =>
      prev.includes(resource) ? prev.filter((r) => r !== resource) : [...prev, resource]
    )
  }

  const toggleSeverity = (severity: AuditSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity) ? prev.filter((s) => s !== severity) : [...prev, severity]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedActions([])
    setSelectedResources([])
    setSelectedSeverities([])
    setSelectedStatus('all')
    setSelectedUser(null)
    setDateRange('week')
  }

  const hasActiveFilters =
    searchQuery ||
    selectedActions.length > 0 ||
    selectedResources.length > 0 ||
    selectedSeverities.length > 0 ||
    selectedStatus !== 'all' ||
    selectedUser

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  // Stats calculation
  const stats = {
    total: filteredLogs.length,
    success: filteredLogs.filter((l) => l.status === 'SUCCESS').length,
    failures: filteredLogs.filter((l) => l.status === 'FAILURE').length,
    warnings: filteredLogs.filter((l) => l.severity === 'WARNING' || l.severity === 'ERROR').length,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">
            Track and monitor all system activities and changes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setLogs(generateMockLogs(200))}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <History className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.success.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failures</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failures.toLocaleString()}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.warnings.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Actions Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  <Activity className="h-4 w-4 mr-2" />
                  Actions
                  {selectedActions.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedActions.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  {Object.keys(ACTION_ICONS).map((action) => (
                    <div key={action} className="flex items-center space-x-2">
                      <Checkbox
                        id={`action-${action}`}
                        checked={selectedActions.includes(action as AuditAction)}
                        onCheckedChange={() => toggleAction(action as AuditAction)}
                      />
                      <label
                        htmlFor={`action-${action}`}
                        className="text-sm cursor-pointer"
                      >
                        {action}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Resources Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  <Database className="h-4 w-4 mr-2" />
                  Resources
                  {selectedResources.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedResources.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  {Object.keys(RESOURCE_ICONS).map((resource) => (
                    <div key={resource} className="flex items-center space-x-2">
                      <Checkbox
                        id={`resource-${resource}`}
                        checked={selectedResources.includes(resource)}
                        onCheckedChange={() => toggleResource(resource)}
                      />
                      <label
                        htmlFor={`resource-${resource}`}
                        className="text-sm cursor-pointer capitalize"
                      >
                        {resource}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Severity Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Severity
                  {selectedSeverities.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSeverities.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  {(Object.keys(SEVERITY_CONFIG) as AuditSeverity[]).map((severity) => (
                    <div key={severity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`severity-${severity}`}
                        checked={selectedSeverities.includes(severity)}
                        onCheckedChange={() => toggleSeverity(severity)}
                      />
                      <Badge className={SEVERITY_CONFIG[severity].color}>
                        {severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as 'all' | 'SUCCESS' | 'FAILURE')}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILURE">Failure</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {selectedUser && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  User: {selectedUser}
                  <button onClick={() => setSelectedUser(null)} className="ml-1">
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedActions.map((action) => (
                <Badge key={action} variant="secondary" className="flex items-center gap-1">
                  {action}
                  <button onClick={() => toggleAction(action)} className="ml-1">
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedResources.map((resource) => (
                <Badge key={resource} variant="secondary" className="flex items-center gap-1">
                  {resource}
                  <button onClick={() => toggleResource(resource)} className="ml-1">
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedSeverities.map((severity) => (
                <Badge key={severity} className={SEVERITY_CONFIG[severity].color}>
                  {severity}
                  <button onClick={() => toggleSeverity(severity)} className="ml-1">
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Log</CardTitle>
            <p className="text-sm text-gray-500">
              Showing {paginatedLogs.length} of {filteredLogs.length} events
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paginatedLogs.map((log) => {
              const ActionIcon = ACTION_ICONS[log.action] || Activity
              const ResourceIcon = log.resource ? RESOURCE_ICONS[log.resource] || Database : Database
              const SeverityIcon = SEVERITY_CONFIG[log.severity].icon
              const isExpanded = expandedLogs.has(log.id)
              const { date, time } = formatTimestamp(log.timestamp)

              return (
                <div
                  key={log.id}
                  className={`border rounded-lg transition-all ${
                    isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button className="text-gray-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div
                          className={`p-2 rounded-lg ${
                            log.status === 'SUCCESS' ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          <ActionIcon
                            className={`h-4 w-4 ${
                              log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{log.userName}</span>
                            <span className="text-gray-400">performed</span>
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-gray-400">on</span>
                            <div className="flex items-center space-x-1">
                              <ResourceIcon className="h-4 w-4 text-gray-500" />
                              <span className="capitalize">{log.resource}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {date} at {time}
                            </span>
                            {log.ipAddress && (
                              <span className="flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                {log.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={SEVERITY_CONFIG[log.severity].color}>
                          {log.severity}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            log.status === 'SUCCESS'
                              ? 'text-green-600 border-green-200'
                              : 'text-red-600 border-red-200'
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">Event ID</Label>
                            <p className="font-mono text-sm">{log.id}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Resource ID</Label>
                            <p className="font-mono text-sm">{log.resourceId || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">User ID</Label>
                            <p className="font-mono text-sm">{log.userId}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">IP Address</Label>
                            <p className="font-mono text-sm">{log.ipAddress || 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">User Agent</Label>
                            <p className="text-sm truncate">{log.userAgent || 'N/A'}</p>
                          </div>
                          {log.facilityId && (
                            <div>
                              <Label className="text-xs text-gray-500">Facility</Label>
                              <p className="text-sm">{log.facilityId}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {log.changes && (
                        <div className="mt-4">
                          <Label className="text-xs text-gray-500">Changes</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="p-3 bg-red-50 rounded-lg">
                              <p className="text-xs text-red-600 font-medium mb-2">Before</p>
                              <pre className="text-xs overflow-auto">
                                {JSON.stringify(log.changes.before, null, 2)}
                              </pre>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-xs text-green-600 font-medium mb-2">After</p>
                              <pre className="text-xs overflow-auto">
                                {JSON.stringify(log.changes.after, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {log.details && (
                        <div className="mt-4">
                          <Label className="text-xs text-gray-500">Additional Details</Label>
                          <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="mt-4 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLog(log)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Full Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {paginatedLogs.length === 0 && (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No audit logs found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredLogs.length > pageSize && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Event ID</Label>
                  <p className="font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Timestamp</Label>
                  <p>{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">User</Label>
                  <p>{selectedLog.userName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">User ID</Label>
                  <p className="font-mono">{selectedLog.userId}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Action</Label>
                  <Badge variant="outline">{selectedLog.action}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Resource</Label>
                  <p className="capitalize">{selectedLog.resource}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Resource ID</Label>
                  <p className="font-mono">{selectedLog.resourceId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <Badge
                    variant="outline"
                    className={
                      selectedLog.status === 'SUCCESS'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Severity</Label>
                  <Badge className={SEVERITY_CONFIG[selectedLog.severity].color}>
                    {selectedLog.severity}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">IP Address</Label>
                  <p className="font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">User Agent</Label>
                <p className="text-sm break-all">{selectedLog.userAgent || 'N/A'}</p>
              </div>

              {selectedLog.changes && (
                <div>
                  <Label className="text-xs text-gray-500">Changes</Label>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <Label className="text-xs text-gray-500">Details</Label>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
