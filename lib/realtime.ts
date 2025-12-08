// Real-time service using Pusher
// Can be swapped for Socket.io or other providers

import Pusher from 'pusher'

// Server-side Pusher instance
let pusherServer: Pusher | null = null

export function getPusherServer(): Pusher | null {
  if (pusherServer) return pusherServer

  // Check if Pusher is configured
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER || 'us2'

  if (!appId || !key || !secret) {
    console.warn('Pusher not configured - real-time updates disabled')
    return null
  }

  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  })

  return pusherServer
}

// Channel naming conventions
export const CHANNELS = {
  // Facility-wide channel for broadcasts
  facility: (facilityId: string) => `facility-${facilityId}`,
  // User-specific channel for private notifications
  user: (userId: string) => `private-user-${userId}`,
  // Schedule channel for schedule updates
  schedule: (facilityId: string) => `schedule-${facilityId}`,
}

// Event types
export const EVENTS = {
  // Schedule events
  SCHEDULE_CREATED: 'schedule:created',
  SCHEDULE_UPDATED: 'schedule:updated',
  SCHEDULE_DELETED: 'schedule:deleted',
  SCHEDULE_PUBLISHED: 'schedule:published',
  SHIFT_CLAIMED: 'shift:claimed',
  SHIFT_OPEN: 'shift:open',
  SHIFT_EMERGENCY: 'shift:emergency',

  // Notification events
  NOTIFICATION_NEW: 'notification:new',

  // Time-off events
  TIMEOFF_REQUESTED: 'timeoff:requested',
  TIMEOFF_APPROVED: 'timeoff:approved',
  TIMEOFF_DENIED: 'timeoff:denied',
}

// Broadcast a schedule update to all users in a facility
export async function broadcastScheduleUpdate(
  facilityId: string,
  event: string,
  data: any
) {
  const pusher = getPusherServer()
  if (!pusher) return false

  try {
    await pusher.trigger(CHANNELS.schedule(facilityId), event, {
      ...data,
      timestamp: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('Failed to broadcast schedule update:', error)
    return false
  }
}

// Send a notification to a specific user
export async function sendUserNotification(
  userId: string,
  event: string,
  data: any
) {
  const pusher = getPusherServer()
  if (!pusher) return false

  try {
    await pusher.trigger(CHANNELS.user(userId), event, {
      ...data,
      timestamp: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('Failed to send user notification:', error)
    return false
  }
}

// Broadcast to entire facility
export async function broadcastToFacility(
  facilityId: string,
  event: string,
  data: any
) {
  const pusher = getPusherServer()
  if (!pusher) return false

  try {
    await pusher.trigger(CHANNELS.facility(facilityId), event, {
      ...data,
      timestamp: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('Failed to broadcast to facility:', error)
    return false
  }
}

// Helper functions for common broadcasts
export const ScheduleBroadcast = {
  created: (facilityId: string, entry: any) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SCHEDULE_CREATED, { entry }),

  updated: (facilityId: string, entry: any) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SCHEDULE_UPDATED, { entry }),

  deleted: (facilityId: string, entryId: string) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SCHEDULE_DELETED, { entryId }),

  published: (facilityId: string, entries: any[]) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SCHEDULE_PUBLISHED, { entries }),

  bulkPublished: (facilityId: string, entries: any[]) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SCHEDULE_PUBLISHED, { entries }),

  shiftClaimed: (facilityId: string, entry: any, claimedBy: any) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SHIFT_CLAIMED, { entry, claimedBy }),

  openShift: (facilityId: string, entry: any) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SHIFT_OPEN, { entry }),

  emergencyShift: (facilityId: string, entry: any) =>
    broadcastScheduleUpdate(facilityId, EVENTS.SHIFT_EMERGENCY, { entry }),
}
