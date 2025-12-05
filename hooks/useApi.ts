import { useState, useCallback } from 'react'

// Generic API response types
interface ApiSuccessResponse<T> {
  success: true
  data: T
}

interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UseApiOptions {
  onSuccess?: (data: unknown) => void
  onError?: (error: string) => void
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

// Generic API hook
export function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<Response>,
  options?: UseApiOptions
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiFunction(...args)
        const json = (await response.json()) as ApiResponse<T>

        if (json.success) {
          setData(json.data)
          options?.onSuccess?.(json.data)
          return json.data
        } else {
          const errorMessage = json.error.message
          setError(errorMessage)
          options?.onError?.(errorMessage)
          return null
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        options?.onError?.(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, options]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

// API client helper
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })
  return response.json()
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

export interface AnalyticsData {
  dateRange: { from: string; to: string }
  summary: {
    totalSubmissions: number
    submissionChange: number
    totalIncidents: number
    incidentChange: number
  }
  moduleStats: Record<string, number>
  dailySubmissions: Array<{ date: string; count: number }>
  incidentsBySeverity: Record<string, number>
  checklistStats: Record<string, number>
  equipmentStats: Record<string, number>
  maintenanceStats: Record<string, number>
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async (from?: Date, to?: Date) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from.toISOString())
      if (to) params.set('to', to.toISOString())

      const response = await apiRequest<AnalyticsData>(
        `/api/analytics?${params.toString()}`
      )

      if (response.success) {
        setData(response.data)
        return response.data
      } else {
        setError(response.error.message)
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchAnalytics }
}

// ============================================================================
// EQUIPMENT HOOKS
// ============================================================================

export interface Equipment {
  id: string
  facilityId: string
  name: string
  category: string
  model?: string
  serialNumber?: string
  manufacturer?: string
  purchaseDate?: string
  warrantyExpiry?: string
  location?: string
  status: string
  notes?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
  maintenanceRecords?: MaintenanceRecord[]
  _count?: { maintenanceRecords: number }
}

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  type: string
  priority: string
  title: string
  description?: string
  scheduledDate?: string
  completedDate?: string
  completedById?: string
  cost?: number
  vendor?: string
  notes?: string
  status: string
  createdAt: string
  updatedAt: string
}

export function useEquipment() {
  const [data, setData] = useState<PaginatedResponse<Equipment> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEquipment = useCallback(
    async (params?: {
      page?: number
      limit?: number
      category?: string
      status?: string
      search?: string
    }) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.category) searchParams.set('category', params.category)
        if (params?.status) searchParams.set('status', params.status)
        if (params?.search) searchParams.set('search', params.search)

        const response = await apiRequest<PaginatedResponse<Equipment>>(
          `/api/equipment?${searchParams.toString()}`
        )

        if (response.success) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch equipment')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createEquipment = useCallback(async (equipmentData: Partial<Equipment>) => {
    const response = await apiRequest<Equipment>('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    })
    return response.success ? response.data : null
  }, [])

  const updateEquipment = useCallback(
    async (id: string, equipmentData: Partial<Equipment>) => {
      const response = await apiRequest<Equipment>(`/api/equipment/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(equipmentData),
      })
      return response.success ? response.data : null
    },
    []
  )

  const deleteEquipment = useCallback(async (id: string) => {
    const response = await apiRequest<{ deleted: boolean }>(`/api/equipment/${id}`, {
      method: 'DELETE',
    })
    return response.success
  }, [])

  const addMaintenance = useCallback(
    async (equipmentId: string, maintenanceData: Partial<MaintenanceRecord>) => {
      const response = await apiRequest<MaintenanceRecord>(`/api/equipment/${equipmentId}`, {
        method: 'POST',
        body: JSON.stringify(maintenanceData),
      })
      return response.success ? response.data : null
    },
    []
  )

  return {
    data,
    loading,
    error,
    fetchEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    addMaintenance,
  }
}

// ============================================================================
// CHECKLISTS HOOKS
// ============================================================================

export interface ChecklistTemplate {
  id: string
  facilityId: string
  name: string
  description?: string
  category: string
  frequency: string
  estimatedDuration: number
  sections: unknown
  requiredRoles: string[]
  isActive: boolean
  version: number
  createdById: string
  createdAt: string
  updatedAt: string
  _count?: { instances: number }
}

export interface ChecklistInstance {
  id: string
  templateId: string
  facilityId: string
  status: string
  scheduledFor?: string
  dueBy?: string
  startedAt?: string
  completedAt?: string
  assignedToId?: string
  completedById?: string
  sections: unknown
  completionPercentage: number
  issues: unknown[]
  notes?: string
  signatureUrl?: string
  createdAt: string
  updatedAt: string
  template?: ChecklistTemplate
}

export function useChecklists() {
  const [data, setData] = useState<PaginatedResponse<ChecklistInstance> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChecklists = useCallback(
    async (params?: {
      page?: number
      limit?: number
      status?: string
      templateId?: string
      from?: Date
      to?: Date
    }) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.status) searchParams.set('status', params.status)
        if (params?.templateId) searchParams.set('templateId', params.templateId)
        if (params?.from) searchParams.set('from', params.from.toISOString())
        if (params?.to) searchParams.set('to', params.to.toISOString())

        const response = await apiRequest<PaginatedResponse<ChecklistInstance>>(
          `/api/checklists?${searchParams.toString()}`
        )

        if (response.success) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch checklists')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const startChecklist = useCallback(
    async (templateId: string, scheduledFor?: Date, dueBy?: Date) => {
      const response = await apiRequest<ChecklistInstance>('/api/checklists', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          scheduledFor: scheduledFor?.toISOString(),
          dueBy: dueBy?.toISOString(),
        }),
      })
      return response.success ? response.data : null
    },
    []
  )

  const updateChecklistItem = useCallback(
    async (
      instanceId: string,
      sectionId: string,
      itemId: string,
      value: unknown,
      notes?: string
    ) => {
      const response = await apiRequest<ChecklistInstance>(`/api/checklists/${instanceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ sectionId, itemId, value, notes }),
      })
      return response.success ? response.data : null
    },
    []
  )

  const completeChecklist = useCallback(
    async (instanceId: string, notes?: string, signatureUrl?: string) => {
      const response = await apiRequest<ChecklistInstance>(
        `/api/checklists/${instanceId}?action=complete`,
        {
          method: 'POST',
          body: JSON.stringify({ notes, signatureUrl }),
        }
      )
      return response.success ? response.data : null
    },
    []
  )

  return {
    data,
    loading,
    error,
    fetchChecklists,
    startChecklist,
    updateChecklistItem,
    completeChecklist,
  }
}

export function useChecklistTemplates() {
  const [data, setData] = useState<PaginatedResponse<ChecklistTemplate> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(
    async (params?: {
      page?: number
      limit?: number
      category?: string
      isActive?: boolean
      search?: string
    }) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.category) searchParams.set('category', params.category)
        if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
        if (params?.search) searchParams.set('search', params.search)

        const response = await apiRequest<PaginatedResponse<ChecklistTemplate>>(
          `/api/checklists/templates?${searchParams.toString()}`
        )

        if (response.success) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch templates')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createTemplate = useCallback(async (templateData: Partial<ChecklistTemplate>) => {
    const response = await apiRequest<ChecklistTemplate>('/api/checklists/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    })
    return response.success ? response.data : null
  }, [])

  return { data, loading, error, fetchTemplates, createTemplate }
}

// ============================================================================
// INCIDENTS HOOKS
// ============================================================================

export interface Incident {
  id: string
  facilityId: string
  rinkId?: string
  reportNumber: string
  incidentDate: string
  incidentTime: string
  location: string
  severity: string
  status: string
  type: string
  description: string
  injuredParties: unknown[]
  witnesses: unknown[]
  immediateActions?: string
  rootCause?: string
  preventiveMeasures?: string
  reportedById: string
  assignedToId?: string
  reviewedById?: string
  reviewedAt?: string
  closedById?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  followUps?: IncidentFollowUp[]
  escalations?: IncidentEscalation[]
  _count?: { followUps: number; escalations: number }
}

export interface IncidentFollowUp {
  id: string
  incidentId: string
  type: string
  dueDate: string
  completedDate?: string
  assignedToId?: string
  notes?: string
  status: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface IncidentEscalation {
  id: string
  incidentId: string
  fromLevel: string
  toLevel: string
  reason: string
  escalatedById: string
  createdAt: string
}

export function useIncidents() {
  const [data, setData] = useState<PaginatedResponse<Incident> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(
    async (params?: {
      page?: number
      limit?: number
      severity?: string
      status?: string
      rinkId?: string
      search?: string
      from?: Date
      to?: Date
    }) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.severity) searchParams.set('severity', params.severity)
        if (params?.status) searchParams.set('status', params.status)
        if (params?.rinkId) searchParams.set('rinkId', params.rinkId)
        if (params?.search) searchParams.set('search', params.search)
        if (params?.from) searchParams.set('from', params.from.toISOString())
        if (params?.to) searchParams.set('to', params.to.toISOString())

        const response = await apiRequest<PaginatedResponse<Incident>>(
          `/api/incidents?${searchParams.toString()}`
        )

        if (response.success) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch incidents')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createIncident = useCallback(async (incidentData: Partial<Incident>) => {
    const response = await apiRequest<Incident>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    })
    return response.success ? response.data : null
  }, [])

  const updateIncident = useCallback(async (id: string, incidentData: Partial<Incident>) => {
    const response = await apiRequest<Incident>(`/api/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(incidentData),
    })
    return response.success ? response.data : null
  }, [])

  const addFollowUp = useCallback(
    async (incidentId: string, followUpData: Partial<IncidentFollowUp>) => {
      const response = await apiRequest<IncidentFollowUp>(
        `/api/incidents/${incidentId}?action=follow-up`,
        {
          method: 'POST',
          body: JSON.stringify(followUpData),
        }
      )
      return response.success ? response.data : null
    },
    []
  )

  const escalateIncident = useCallback(
    async (incidentId: string, toLevel: string, reason: string) => {
      const response = await apiRequest<IncidentEscalation>(
        `/api/incidents/${incidentId}?action=escalate`,
        {
          method: 'POST',
          body: JSON.stringify({ toLevel, reason }),
        }
      )
      return response.success ? response.data : null
    },
    []
  )

  const completeFollowUp = useCallback(
    async (incidentId: string, followUpId: string, notes?: string) => {
      const response = await apiRequest<IncidentFollowUp>(
        `/api/incidents/${incidentId}?action=complete-followup`,
        {
          method: 'POST',
          body: JSON.stringify({ followUpId, notes }),
        }
      )
      return response.success ? response.data : null
    },
    []
  )

  return {
    data,
    loading,
    error,
    fetchIncidents,
    createIncident,
    updateIncident,
    addFollowUp,
    escalateIncident,
    completeFollowUp,
  }
}

// ============================================================================
// SCHEDULE HOOKS
// ============================================================================

export interface Schedule {
  id: string
  facilityId: string
  rinkId: string
  name: string
  startDate: string
  endDate: string
  status: string
  publishedAt?: string
  publishedById?: string
  createdAt: string
  updatedAt: string
  entries?: ScheduleEntry[]
}

export interface ScheduleEntry {
  id: string
  scheduleId: string
  userId: string
  shiftDefinitionId?: string
  date: string
  startTime: string
  endTime: string
  role: string
  notes?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface Shift {
  id: string
  scheduleEntryId?: string
  userId: string
  date: string
  startTime: string
  endTime: string
  role: string
  status: string
}

export function useSchedule() {
  const [data, setData] = useState<PaginatedResponse<Schedule> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = useCallback(
    async (params?: {
      page?: number
      limit?: number
      status?: string
      rinkId?: string
      from?: Date
      to?: Date
    }) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.status) searchParams.set('status', params.status)
        if (params?.rinkId) searchParams.set('rinkId', params.rinkId)
        if (params?.from) searchParams.set('from', params.from.toISOString())
        if (params?.to) searchParams.set('to', params.to.toISOString())

        const response = await apiRequest<PaginatedResponse<Schedule>>(
          `/api/schedules?${searchParams.toString()}`
        )

        if (response.success) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schedules')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const fetchShifts = useCallback(
    async (params?: {
      page?: number
      limit?: number
      userId?: string
      date?: string
      from?: Date
      to?: Date
    }) => {
      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.userId) searchParams.set('userId', params.userId)
        if (params?.date) searchParams.set('date', params.date)
        if (params?.from) searchParams.set('from', params.from.toISOString())
        if (params?.to) searchParams.set('to', params.to.toISOString())

        const response = await apiRequest<PaginatedResponse<Shift>>(
          `/api/shifts?${searchParams.toString()}`
        )

        return response.success ? response.data : null
      } catch (err) {
        console.error('Failed to fetch shifts:', err)
        return null
      }
    },
    []
  )

  const createShift = useCallback(async (shiftData: Partial<Shift>) => {
    const response = await apiRequest<Shift>('/api/shifts', {
      method: 'POST',
      body: JSON.stringify(shiftData),
    })
    return response.success ? response.data : null
  }, [])

  const updateShift = useCallback(async (id: string, shiftData: Partial<Shift>) => {
    const response = await apiRequest<Shift>(`/api/shifts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(shiftData),
    })
    return response.success ? response.data : null
  }, [])

  const deleteShift = useCallback(async (id: string) => {
    const response = await apiRequest<{ deleted: boolean }>(`/api/shifts/${id}`, {
      method: 'DELETE',
    })
    return response.success
  }, [])

  return {
    data,
    loading,
    error,
    fetchSchedules,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
  }
}

// ============================================================================
// NOTIFICATIONS HOOKS
// ============================================================================

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  readAt?: string
  isArchived: boolean
  archivedAt?: string
  createdAt: string
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  types: Record<string, boolean>
}

export function useNotifications() {
  const [data, setData] = useState<PaginatedResponse<Notification> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(
    async (params?: {
      page?: number
      limit?: number
      isRead?: boolean
      isArchived?: boolean
      type?: string
    }) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.isRead !== undefined) searchParams.set('isRead', String(params.isRead))
        if (params?.isArchived !== undefined) searchParams.set('isArchived', String(params.isArchived))
        if (params?.type) searchParams.set('type', params.type)

        const response = await apiRequest<PaginatedResponse<Notification>>(
          `/api/notifications?${searchParams.toString()}`
        )

        if (response.success) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiRequest<{ unread: number; total: number }>(
        '/api/notifications/stats'
      )
      if (response.success) {
        setUnreadCount(response.data.unread)
        return response.data
      }
      return null
    } catch (err) {
      console.error('Failed to fetch notification stats:', err)
      return null
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    const response = await apiRequest<Notification>(`/api/notifications/${id}/read`, {
      method: 'POST',
    })
    if (response.success) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    return response.success ? response.data : null
  }, [])

  const markAllAsRead = useCallback(async () => {
    const response = await apiRequest<{ count: number }>('/api/notifications/mark-all-read', {
      method: 'POST',
    })
    if (response.success) {
      setUnreadCount(0)
    }
    return response.success
  }, [])

  const archiveNotification = useCallback(async (id: string) => {
    const response = await apiRequest<Notification>(`/api/notifications/${id}/archive`, {
      method: 'POST',
    })
    return response.success ? response.data : null
  }, [])

  const getPreferences = useCallback(async () => {
    const response = await apiRequest<NotificationPreferences>('/api/notifications/preferences')
    return response.success ? response.data : null
  }, [])

  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    const response = await apiRequest<NotificationPreferences>('/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    })
    return response.success ? response.data : null
  }, [])

  return {
    data,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    getPreferences,
    updatePreferences,
  }
}

// ============================================================================
// SUBMISSIONS HOOKS (Generic for Module pages)
// ============================================================================

export interface Submission {
  id: string
  formTemplateId: string
  rinkId: string
  submittedById: string
  data: Record<string, unknown>
  status: string
  reviewedById?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export function useSubmissions() {
  const [data, setData] = useState<PaginatedResponse<Submission> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = useCallback(
    async (params?: {
      page?: number
      limit?: number
      moduleType?: string
      status?: string
      rinkId?: string
      submittedById?: string
      from?: Date
      to?: Date
    }) => {
      setLoading(true)
      setError(null)

      try {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.limit) searchParams.set('limit', String(params.limit))
        if (params?.moduleType) searchParams.set('moduleType', params.moduleType)
        if (params?.status) searchParams.set('status', params.status)
        if (params?.rinkId) searchParams.set('rinkId', params.rinkId)
        if (params?.submittedById) searchParams.set('submittedById', params.submittedById)
        if (params?.from) searchParams.set('from', params.from.toISOString())
        if (params?.to) searchParams.set('to', params.to.toISOString())

        const response = await apiRequest<PaginatedResponse<Submission>>(
          `/api/submissions?${searchParams.toString()}`
        )

        if (response.success) {
          setData(response.data)
          return response.data
        } else {
          setError(response.error.message)
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch submissions')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createSubmission = useCallback(
    async (submissionData: { formTemplateId: string; rinkId: string; data: Record<string, unknown> }) => {
      const response = await apiRequest<Submission>('/api/submissions', {
        method: 'POST',
        body: JSON.stringify(submissionData),
      })
      return response.success ? response.data : null
    },
    []
  )

  const updateSubmission = useCallback(async (id: string, submissionData: Partial<Submission>) => {
    const response = await apiRequest<Submission>(`/api/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(submissionData),
    })
    return response.success ? response.data : null
  }, [])

  return {
    data,
    loading,
    error,
    fetchSubmissions,
    createSubmission,
    updateSubmission,
  }
}
