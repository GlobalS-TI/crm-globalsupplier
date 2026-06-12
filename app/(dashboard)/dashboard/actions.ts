'use server'

import { sendStaleNotifications } from '@/lib/email/staleNotification'

export async function notifyStaleOpportunities(): Promise<{ sent: number; error?: string }> {
  try {
    return await sendStaleNotifications()
  } catch (e) {
    return { sent: 0, error: (e as Error).message }
  }
}
