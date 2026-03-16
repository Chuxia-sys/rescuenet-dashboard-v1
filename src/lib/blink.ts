import { createClient } from '@blinkdotnew/sdk'

export function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  return match ? match[1] : 'demo-project'
}

export const blink = createClient({
  projectId: getProjectId(),
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_MOV18iIuva2AKsZrRjB6icpBXmCiVB_-',
  auth: { mode: 'managed' },
})