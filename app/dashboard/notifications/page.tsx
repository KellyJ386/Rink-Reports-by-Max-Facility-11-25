'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  Calendar,
  AlertCircle,
  AlertTriangle,
  FileText,
  Archive,
  RefreshCw,
  Mail,
  MessageSquare,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationPreferences,
  NotificationStats,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notifications'

// Mock user ID - would come from auth
const CURRENT_USER_ID = 'user-1'

// Category configuration
const CATEGORIES: { value: NotificationCategory; label: string; icon: React.ElementType }[] = [
  { value: 'SCHEDULE', label: 'Schedule', icon: Calendar },
  { value: 'INCIDENTS', label: 'Incidents', icon: AlertCircle },
  { value: 'AIR_QUALITY', label: 'Air Quality', icon: AlertTriangle },
  { value: 'REPORTS', label: 'Reports', icon: FileText },
  { value: 'SYSTEM', label: 'System', icon: Bell },
  { value: 'ADMIN', label: 'Admin', icon: Settings },
]

// Priority configuration
const PRIORITIES: { value: NotificationPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-muted-foreground' },
  { value: 'NORMAL', label: 'Normal', color: 'text-foreground' },
  { value: 'HIGH', label: 'High', color: 'text-yellow-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
]

export default function NotificationsPage() {
  const router = useRouter()

  // State
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all')
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Fetch data
  useEffect(() => {
    fetchNotifications()
    fetchStats()
    fetchPreferences()
  }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${CURRENT_USER_ID}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/notifications/stats?userId=${CURRENT_USER_ID}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`/api/notifications/preferences?userId=${CURRENT_USER_ID}`)
      if (res.ok) {
        const data = await res.json()
        setPreferences(data)
      } else {
        // Use defaults
        setPreferences({
          id: 'default',
          userId: CURRENT_USER_ID,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    }
  }

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let results = [...notifications]

    // Filter by tab (status)
    if (activeTab === 'unread') {
      results = results.filter((n) => n.status === 'UNREAD')
    } else if (activeTab === 'archived') {
      results = results.filter((n) => n.status === 'ARCHIVED')
    } else {
      results = results.filter((n) => n.status !== 'ARCHIVED')
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter((n) => n.category === selectedCategory)
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      results = results.filter((n) => n.priority === selectedPriority)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      )
    }

    return results
  }, [notifications, activeTab, selectedCategory, selectedPriority, searchQuery])

  // Bulk actions
  const handleMarkSelectedAsRead = async () => {
    try {
      await Promise.all(
        Array.from(selectedNotifications).map((id) =>
          fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        )
      )
      setNotifications((prev) =>
        prev.map((n) =>
          selectedNotifications.has(n.id)
            ? { ...n, status: 'READ', readAt: new Date().toISOString() }
            : n
        )
      )
      setSelectedNotifications(new Set())
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleArchiveSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedNotifications).map((id) =>
          fetch(`/api/notifications/${id}/archive`, { method: 'POST' })
        )
      )
      setNotifications((prev) =>
        prev.map((n) =>
          selectedNotifications.has(n.id) ? { ...n, status: 'ARCHIVED' } : n
        )
      )
      setSelectedNotifications(new Set())
    } catch (error) {
      console.error('Failed to archive:', error)
    }
  }

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedNotifications).map((id) =>
          fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        )
      )
      setNotifications((prev) => prev.filter((n) => !selectedNotifications.has(n.id)))
      setSelectedNotifications(new Set())
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        body: JSON.stringify({ userId: CURRENT_USER_ID }),
      })
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ', readAt: new Date().toISOString() }))
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleSavePreferences = async () => {
    if (!preferences) return

    try {
      await fetch(`/api/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      setIsSettingsOpen(false)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  // Toggle notification selection
  const toggleSelection = (id: string) => {
    setSelectedNotifications((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select all visible
  const selectAllVisible = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map((n) => n.id)))
    }
  }

  // Format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Get category icon
  const getCategoryIcon = (category: NotificationCategory) => {
    return CATEGORIES.find((c) => c.value === category)?.icon || Bell
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(stats.byPriority.HIGH || 0) + (stats.byPriority.URGENT || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byCategory.SCHEDULE || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as NotificationCategory | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedPriority}
            onValueChange={(v) => setSelectedPriority(v as NotificationPriority | 'all')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map((pri) => (
                <SelectItem key={pri.value} value={pri.value}>
                  {pri.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground px-2">
            {selectedNotifications.size} selected
          </span>
          <Button variant="ghost" size="sm" onClick={handleMarkSelectedAsRead}>
            <Check className="h-4 w-4 mr-1" />
            Mark Read
          </Button>
          <Button variant="ghost" size="sm" onClick={handleArchiveSelected}>
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {stats && stats.unread > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {stats.unread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          {activeTab !== 'archived' && stats && stats.unread > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            {/* Header Row */}
            <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
              <Checkbox
                checked={
                  filteredNotifications.length > 0 &&
                  selectedNotifications.size === filteredNotifications.length
                }
                onCheckedChange={selectAllVisible}
              />
              <span className="text-sm text-muted-foreground">
                {filteredNotifications.length} notification
                {filteredNotifications.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Notification List */}
            {filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map((notification) => {
                  const CategoryIcon = getCategoryIcon(notification.category)
                  const isSelected = selectedNotifications.has(notification.id)
                  const isUnread = notification.status === 'UNREAD'

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors',
                        isUnread && 'bg-blue-50/50 dark:bg-blue-950/20',
                        isSelected && 'bg-muted'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(notification.id)}
                      />

                      <div
                        className={cn(
                          'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                          notification.priority === 'URGENT'
                            ? 'bg-red-100 text-red-600'
                            : notification.priority === 'HIGH'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <CategoryIcon className="h-5 w-5" />
                      </div>

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          if (notification.actionUrl) {
                            router.push(notification.actionUrl)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p
                              className={cn(
                                'font-medium',
                                isUnread && 'font-semibold'
                              )}
                            >
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">
                                {notification.category}
                              </Badge>
                              {(notification.priority === 'HIGH' ||
                                notification.priority === 'URGENT') && (
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    notification.priority === 'URGENT'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  )}
                                >
                                  {notification.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isUnread && (
                            <DropdownMenuItem
                              onClick={async () => {
                                await fetch(`/api/notifications/${notification.id}/read`, {
                                  method: 'POST',
                                })
                                setNotifications((prev) =>
                                  prev.map((n) =>
                                    n.id === notification.id
                                      ? { ...n, status: 'READ', readAt: new Date().toISOString() }
                                      : n
                                  )
                                )
                              }}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={async () => {
                              await fetch(`/api/notifications/${notification.id}/archive`, {
                                method: 'POST',
                              })
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notification.id
                                    ? { ...n, status: 'ARCHIVED' }
                                    : n
                                )
                              )
                            }}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={async () => {
                              await fetch(`/api/notifications/${notification.id}`, {
                                method: 'DELETE',
                              })
                              setNotifications((prev) =>
                                prev.filter((n) => n.id !== notification.id)
                              )
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <BellOff className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-medium mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'unread'
                    ? "You're all caught up!"
                    : activeTab === 'archived'
                    ? 'No archived notifications'
                    : 'No notifications to show'}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure how and when you receive notifications
            </DialogDescription>
          </DialogHeader>

          {preferences && (
            <div className="space-y-6 py-4">
              {/* Channel Preferences */}
              <div>
                <h4 className="font-medium mb-4">Notification Channels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">In-App Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications in the app
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.inAppEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, inAppEnabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          {preferences.emailAddress || 'No email configured'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, emailEnabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          {preferences.phoneNumber || 'No phone configured'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.smsEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, smsEnabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Browser/device push notifications
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.pushEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, pushEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quiet Hours */}
              <div>
                <h4 className="font-medium mb-4">Quiet Hours</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Quiet Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Pause non-urgent notifications during specified hours
                      </p>
                    </div>
                    <Switch
                      checked={preferences.quietHoursEnabled}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, quietHoursEnabled: checked })
                      }
                    />
                  </div>

                  {preferences.quietHoursEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={preferences.quietHoursStart || '22:00'}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                quietHoursStart: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={preferences.quietHoursEnd || '07:00'}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                quietHoursEnd: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="excludeUrgent"
                          checked={preferences.quietHoursExcludeUrgent}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              quietHoursExcludeUrgent: !!checked,
                            })
                          }
                        />
                        <Label htmlFor="excludeUrgent" className="text-sm">
                          Allow urgent notifications during quiet hours
                        </Label>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Category Preferences */}
              <div>
                <h4 className="font-medium mb-4">Category Settings</h4>
                <div className="space-y-4">
                  {CATEGORIES.map((category) => {
                    const categoryPref = preferences.categories[category.value]
                    const CategoryIcon = category.icon

                    return (
                      <div
                        key={category.value}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{category.label}</span>
                        </div>
                        <Switch
                          checked={categoryPref.enabled}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              categories: {
                                ...preferences.categories,
                                [category.value]: {
                                  ...categoryPref,
                                  enabled: checked,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
