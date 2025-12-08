'use client'

import { useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'

// Singleton Pusher instance
let pusherClient: Pusher | null = null

function getPusherClient(): Pusher | null {
  if (pusherClient) return pusherClient

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'

  if (!key) {
    console.warn('Pusher client not configured')
    return null
  }

  pusherClient = new Pusher(key, {
    cluster,
    // For private channels, you'd need auth endpoint
    // authEndpoint: '/api/pusher/auth',
  })

  return pusherClient
}

// Channel naming conventions (must match server)
export const CHANNELS = {
  facility: (facilityId: string) => `facility-${facilityId}`,
  user: (userId: string) => `private-user-${userId}`,
  schedule: (facilityId: string) => `schedule-${facilityId}`,
}

// Event types (must match server)
export const EVENTS = {
  SCHEDULE_CREATED: 'schedule:created',
  SCHEDULE_UPDATED: 'schedule:updated',
  SCHEDULE_DELETED: 'schedule:deleted',
  SCHEDULE_PUBLISHED: 'schedule:published',
  SHIFT_CLAIMED: 'shift:claimed',
  SHIFT_OPEN: 'shift:open',
  SHIFT_EMERGENCY: 'shift:emergency',
  NOTIFICATION_NEW: 'notification:new',
  TIMEOFF_REQUESTED: 'timeoff:requested',
  TIMEOFF_APPROVED: 'timeoff:approved',
  TIMEOFF_DENIED: 'timeoff:denied',
}

interface UseRealtimeOptions {
  channelName: string
  events: {
    [eventName: string]: (data: any) => void
  }
  enabled?: boolean
}

// Hook to subscribe to real-time events
export function useRealtime({ channelName, events, enabled = true }: UseRealtimeOptions) {
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled) return

    const pusher = getPusherClient()
    if (!pusher) return

    // Subscribe to channel
    const channel = pusher.subscribe(channelName)
    channelRef.current = channel

    // Bind event handlers
    Object.entries(events).forEach(([eventName, handler]) => {
      channel.bind(eventName, handler)
    })

    // Cleanup
    return () => {
      Object.entries(events).forEach(([eventName, handler]) => {
        channel.unbind(eventName, handler)
      })
      pusher.unsubscribe(channelName)
    }
  }, [channelName, enabled])

  return channelRef.current
}

// Hook specifically for schedule updates
export function useScheduleRealtime(
  facilityId: string | null,
  callbacks: {
    onCreated?: (entry: any) => void
    onUpdated?: (entry: any) => void
    onDeleted?: (entryId: string) => void
    onPublished?: (entries: any[]) => void
    onShiftClaimed?: (data: { entry: any; claimedBy: any }) => void
    onOpenShift?: (entry: any) => void
    onEmergencyShift?: (entry: any) => void
  }
) {
  const events: { [key: string]: (data: any) => void } = {}

  if (callbacks.onCreated) {
    events[EVENTS.SCHEDULE_CREATED] = (data) => callbacks.onCreated!(data.entry)
  }
  if (callbacks.onUpdated) {
    events[EVENTS.SCHEDULE_UPDATED] = (data) => callbacks.onUpdated!(data.entry)
  }
  if (callbacks.onDeleted) {
    events[EVENTS.SCHEDULE_DELETED] = (data) => callbacks.onDeleted!(data.entryId)
  }
  if (callbacks.onPublished) {
    events[EVENTS.SCHEDULE_PUBLISHED] = (data) => callbacks.onPublished!(data.entries)
  }
  if (callbacks.onShiftClaimed) {
    events[EVENTS.SHIFT_CLAIMED] = callbacks.onShiftClaimed
  }
  if (callbacks.onOpenShift) {
    events[EVENTS.SHIFT_OPEN] = (data) => callbacks.onOpenShift!(data.entry)
  }
  if (callbacks.onEmergencyShift) {
    events[EVENTS.SHIFT_EMERGENCY] = (data) => callbacks.onEmergencyShift!(data.entry)
  }

  useRealtime({
    channelName: facilityId ? CHANNELS.schedule(facilityId) : '',
    events,
    enabled: !!facilityId,
  })
}

// Hook for user notifications
export function useNotificationRealtime(
  userId: string | null,
  onNotification: (notification: any) => void
) {
  useRealtime({
    channelName: userId ? CHANNELS.user(userId) : '',
    events: {
      [EVENTS.NOTIFICATION_NEW]: onNotification,
    },
    enabled: !!userId,
  })
}

// Toast notification helper
export function showRealtimeToast(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  // Simple toast implementation - could be replaced with a toast library
  const toast = document.createElement('div')
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in ${
    type === 'success' ? 'bg-green-500' :
    type === 'warning' ? 'bg-yellow-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-blue-500'
  } text-white`
  toast.textContent = message

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('animate-fade-out')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}
