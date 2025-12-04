// Push Notification Service
// Web Push API integration for browser notifications

import {
  PushSubscription,
  PushMessage,
  PushSendResult,
} from '@/types/notifications'

// ============================================
// PUSH NOTIFICATION CONFIGURATION
// ============================================

// VAPID keys should be generated and stored as environment variables
// Generate with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@rink.mfo.com'

// In-memory storage for subscriptions (use database in production)
const subscriptions = new Map<string, PushSubscription[]>()

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: Omit<PushSubscription, 'id' | 'createdAt' | 'lastUsedAt'>
): Promise<PushSubscription> {
  const newSubscription: PushSubscription = {
    ...subscription,
    id: `push-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    userId,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  }

  const userSubs = subscriptions.get(userId) || []

  // Check if subscription already exists (by endpoint)
  const existingIndex = userSubs.findIndex(
    (s) => s.endpoint === subscription.endpoint
  )

  if (existingIndex >= 0) {
    // Update existing subscription
    userSubs[existingIndex] = newSubscription
  } else {
    // Add new subscription
    userSubs.push(newSubscription)
  }

  subscriptions.set(userId, userSubs)
  console.log(`[Push Service] Saved subscription for user ${userId}`)

  return newSubscription
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(
  userId: string
): Promise<PushSubscription[]> {
  return subscriptions.get(userId) || []
}

/**
 * Remove a subscription
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  const userSubs = subscriptions.get(userId)
  if (!userSubs) return false

  const filtered = userSubs.filter((s) => s.endpoint !== endpoint)
  subscriptions.set(userId, filtered)

  console.log(`[Push Service] Removed subscription for user ${userId}`)
  return true
}

/**
 * Remove all subscriptions for a user
 */
export async function removeAllUserSubscriptions(userId: string): Promise<void> {
  subscriptions.delete(userId)
  console.log(`[Push Service] Removed all subscriptions for user ${userId}`)
}

// ============================================
// PUSH NOTIFICATION SENDING
// ============================================

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  message: PushMessage
): Promise<PushSendResult[]> {
  const userSubs = await getUserSubscriptions(userId)

  if (userSubs.length === 0) {
    console.log(`[Push Service] No subscriptions found for user ${userId}`)
    return []
  }

  const results: PushSendResult[] = []

  for (const subscription of userSubs) {
    const result = await sendToSubscription(subscription, message)
    results.push(result)

    // Remove subscription if it's no longer valid
    if (!result.success && result.error?.includes('expired')) {
      await removeSubscription(userId, subscription.endpoint)
    }
  }

  return results
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  subscription: PushSubscription,
  message: PushMessage
): Promise<PushSendResult> {
  // If no VAPID keys configured, simulate success (for development)
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('[Push Service] No VAPID keys configured. Push notification would be sent:')
    console.log(`  Endpoint: ${subscription.endpoint.substring(0, 50)}...`)
    console.log(`  Title: ${message.title}`)
    console.log(`  Body: ${message.body}`)

    return {
      success: true,
      endpoint: subscription.endpoint,
    }
  }

  try {
    // Import web-push dynamically
    const webPush = await import('web-push')

    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      icon: message.icon || '/icons/icon-192x192.png',
      badge: message.badge || '/icons/badge-72x72.png',
      image: message.image,
      data: message.data,
      actions: message.actions,
      tag: message.tag,
      requireInteraction: message.requireInteraction,
    })

    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payload
    )

    console.log(`[Push Service] Push notification sent to ${subscription.endpoint.substring(0, 50)}...`)

    return {
      success: true,
      endpoint: subscription.endpoint,
    }
  } catch (error) {
    console.error('[Push Service] Error sending push notification:', error)

    return {
      success: false,
      endpoint: subscription.endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  message: PushMessage
): Promise<Map<string, PushSendResult[]>> {
  const results = new Map<string, PushSendResult[]>()

  await Promise.all(
    userIds.map(async (userId) => {
      const userResults = await sendPushNotification(userId, message)
      results.set(userId, userResults)
    })
  )

  return results
}

/**
 * Send push notification to all subscribers
 */
export async function broadcastPush(
  message: PushMessage
): Promise<Map<string, PushSendResult[]>> {
  const allUserIds = Array.from(subscriptions.keys())
  return sendPushToUsers(allUserIds, message)
}

// ============================================
// CLIENT-SIDE HELPERS
// ============================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Get the VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string | undefined {
  return vapidPublicKey
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied'
  }

  return await Notification.requestPermission()
}

/**
 * Subscribe to push notifications (client-side)
 * Returns the subscription object to send to the server
 */
export async function subscribeToPush(): Promise<PushSubscriptionJSON | null> {
  if (!isPushSupported()) {
    console.warn('[Push Service] Push notifications not supported')
    return null
  }

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    console.warn('[Push Service] Notification permission denied')
    return null
  }

  if (!vapidPublicKey) {
    console.warn('[Push Service] VAPID public key not configured')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })

    return subscription.toJSON()
  } catch (error) {
    console.error('[Push Service] Failed to subscribe:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications (client-side)
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      return true
    }

    return false
  } catch (error) {
    console.error('[Push Service] Failed to unsubscribe:', error)
    return false
  }
}

/**
 * Get current push subscription (client-side)
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      return null
    }

    const json = subscription.toJSON()
    return {
      id: '',
      userId: '',
      endpoint: json.endpoint || '',
      keys: {
        p256dh: json.keys?.p256dh || '',
        auth: json.keys?.auth || '',
      },
      deviceType: 'web',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Push Service] Failed to get subscription:', error)
    return null
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Show a local notification (for testing without server)
 */
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isPushSupported()) {
    console.warn('[Push Service] Notifications not supported')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Push Service] Notification permission not granted')
    return
  }

  new Notification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    ...options,
  })
}
