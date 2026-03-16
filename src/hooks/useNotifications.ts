import { useState, useEffect, useCallback, useRef } from 'react'
import { blink } from '@/lib/blink'
import { toast } from 'react-hot-toast'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'disaster' | 'rescue' | 'volunteer' | 'alert'
  severity: 'emergency' | 'warning' | 'info' | 'success'
  timestamp: number
  read: boolean
}

export function useNotifications(user: any) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const lastUserIdRef = useRef<string | null>(null)
  const realtimeDisabledRef = useRef(false)
  const loggedRealtimeErrorRef = useRef(false)

  // Load notification history (optional - for now let's just use memory)
  useEffect(() => {
    if (!user?.id) return
    if (realtimeDisabledRef.current) return

    if (lastUserIdRef.current === user.id) {
      return
    }

    lastUserIdRef.current = user.id

    let mounted = true
    let channel: any = null

    const initRealtime = async () => {
      try {
        channel = blink.realtime.channel('emergency-alerts')
        
        await channel.subscribe({
          userId: user.id,
          metadata: { displayName: user.displayName }
        })

        if (!mounted) return

        channel.onMessage((msg: any) => {
          if (!mounted) return
          
          const newNotif: Notification = {
            id: msg.id,
            title: msg.data.title || 'Emergency Update',
            message: msg.data.message || '',
            type: msg.data.type || 'alert',
            severity: msg.data.severity || 'info',
            timestamp: msg.timestamp,
            read: false
          }

          setNotifications(prev => [newNotif, ...prev])
          setUnreadCount(prev => prev + 1)

          // Show toast for critical alerts
          if (newNotif.severity === 'emergency') {
            toast.error(`${newNotif.title}: ${newNotif.message}`, { duration: 5000 })
          } else if (newNotif.severity === 'warning') {
            toast(newNotif.message, { icon: '⚠️', duration: 4000 })
          } else {
            toast.success(newNotif.title)
          }
        })

      } catch (error) {
        if (!loggedRealtimeErrorRef.current) {
          console.error('Failed to connect to realtime:', error)
          loggedRealtimeErrorRef.current = true
        }
        realtimeDisabledRef.current = true
      }
    }

    initRealtime()

    return () => {
      mounted = false
      channel?.unsubscribe()
    }
  }, [user?.id])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll
  }
}
