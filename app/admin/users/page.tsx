'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Send,
  Download,
  Upload,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  ChevronDown,
  MoreHorizontal,
  Key,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  User,
  Role,
  UserStatus,
  UserInvitation,
  InviteUserInput,
  BulkUserAction,
} from '@/types/admin'

// Status configuration
const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  SUSPENDED: { label: 'Suspended', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  LOCKED: { label: 'Locked', color: 'bg-red-100 text-red-800', icon: Lock },
}

// Role colors
const ROLE_COLORS: Record<string, string> = {
  'super-admin': 'bg-red-100 text-red-800 border-red-200',
  'facility-manager': 'bg-blue-100 text-blue-800 border-blue-200',
  'supervisor': 'bg-purple-100 text-purple-800 border-purple-200',
  'ice-technician': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'front-desk': 'bg-green-100 text-green-800 border-green-200',
  'viewer': 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function UsersPage() {
  const router = useRouter()

  // State
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('users')

  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false)
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null)
  const [bulkAction, setBulkAction] = useState<BulkUserAction['action'] | null>(null)

  // Invite form state
  const [inviteForm, setInviteForm] = useState<InviteUserInput>({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    facilityIds: [],
    message: '',
  })

  // Fetch data
  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchInvitations()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles')
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/admin/invitations')
      if (res.ok) {
        const data = await res.json()
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    }
  }

  // Filter users
  const filteredUsers = useMemo(() => {
    let results = [...users]

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          u.jobTitle?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter((u) => u.status === statusFilter)
    }

    // Role filter
    if (roleFilter !== 'all') {
      results = results.filter((u) => u.roleId === roleFilter)
    }

    return results
  }, [users, searchQuery, statusFilter, roleFilter])

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      pending: users.filter((u) => u.status === 'PENDING').length,
      suspended: users.filter((u) => u.status === 'SUSPENDED' || u.status === 'LOCKED').length,
      pendingInvitations: invitations.filter((i) => i.status === 'PENDING').length,
    }
  }, [users, invitations])

  // Handlers
  const handleInviteUser = async () => {
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })

      if (res.ok) {
        const newInvitation = await res.json()
        setInvitations((prev) => [newInvitation, ...prev])
        setIsInviteDialogOpen(false)
        setInviteForm({
          email: '',
          firstName: '',
          lastName: '',
          roleId: '',
          facilityIds: [],
          message: '',
        })
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUserForAction) return

    try {
      const res = await fetch(`/api/admin/users/${selectedUserForAction.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUserForAction.id))
        setIsDeleteDialogOpen(false)
        setSelectedUserForAction(null)
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return

    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          action: bulkAction,
        }),
      })

      if (res.ok) {
        fetchUsers()
        setSelectedUsers(new Set())
        setIsBulkActionDialogOpen(false)
        setBulkAction(null)
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 30) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  const getRoleForUser = (user: User) => {
    return roles.find((r) => r.id === user.roleId)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and access permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingInvitations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Send className="h-4 w-4 mr-2" />
            Invitations ({invitations.filter((i) => i.status === 'PENDING').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
              <span className="text-sm font-medium">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkAction('ACTIVATE')
                  setIsBulkActionDialogOpen(true)
                }}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkAction('DEACTIVATE')
                  setIsBulkActionDialogOpen(true)
                }}
              >
                <UserX className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  setBulkAction('DELETE')
                  setIsBulkActionDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

          {/* Users Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredUsers.length > 0 &&
                        selectedUsers.size === filteredUsers.length
                      }
                      onCheckedChange={selectAllUsers}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const role = getRoleForUser(user)
                    const statusConfig = STATUS_CONFIG[user.status]
                    const StatusIcon = statusConfig.icon

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              {user.jobTitle && (
                                <p className="text-xs text-muted-foreground">
                                  {user.jobTitle}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {role && (
                            <Badge
                              variant="outline"
                              className={cn('font-normal', ROLE_COLORS[role.slug])}
                            >
                              {role.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('font-normal', statusConfig.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.facilityIds.length} facilit{user.facilityIds.length !== 1 ? 'ies' : 'y'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(user.lastLoginAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/users/${user.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'ACTIVE' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'deactivate')}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {user.status === 'LOCKED' ? (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'unlock')}
                                >
                                  <Unlock className="h-4 w-4 mr-2" />
                                  Unlock Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleUserAction(user.id, 'lock')}
                                >
                                  <Lock className="h-4 w-4 mr-2" />
                                  Lock Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleUserAction(user.id, 'reset-password')}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedUserForAction(user)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="text-muted-foreground">
                        {isLoading ? 'Loading users...' : 'No users found'}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length > 0 ? (
                  invitations.map((invitation) => {
                    const role = roles.find((r) => r.id === invitation.roleId)

                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>
                          {invitation.firstName || invitation.lastName
                            ? `${invitation.firstName || ''} ${invitation.lastName || ''}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {role && (
                            <Badge
                              variant="outline"
                              className={cn('font-normal', ROLE_COLORS[role.slug])}
                            >
                              {role.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'font-normal',
                              invitation.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : invitation.status === 'ACCEPTED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(invitation.invitedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(invitation.expiresAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {invitation.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Invite Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Invitation
                                  </DropdownMenuItem>
                                </>
                              )}
                              {invitation.status !== 'PENDING' && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="text-muted-foreground">No invitations found</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={inviteForm.roleId}
                onValueChange={(v) => setInviteForm({ ...inviteForm, roleId: v })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to the invitation..."
                value={inviteForm.message}
                onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={!inviteForm.email || !inviteForm.roleId}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {selectedUserForAction?.firstName} {selectedUserForAction?.lastName}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'DELETE'
                ? 'Delete Users'
                : bulkAction === 'ACTIVATE'
                ? 'Activate Users'
                : 'Deactivate Users'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction?.toLowerCase()} {selectedUsers.size} user
              {selectedUsers.size !== 1 ? 's' : ''}?
              {bulkAction === 'DELETE' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={bulkAction === 'DELETE' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {bulkAction === 'DELETE' ? 'Delete' : bulkAction === 'ACTIVATE' ? 'Activate' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
