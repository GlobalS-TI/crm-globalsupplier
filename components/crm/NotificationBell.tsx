'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { markNotificationRead, markAllNotificationsRead } from '@/app/(dashboard)/actions/notifications'

interface Notification {
  id:         string
  title:      string
  body:       string
  href:       string | null
  read_at:    string | null
  created_at: string
}

interface Props {
  userId: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)  return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function NotificationBell({ userId }: Props) {
  const router = useRouter()
  // Stable client — createBrowserClient is a singleton but useState ensures
  // the same reference is used in all effects and cleanup functions.
  const [supabase] = useState(() => createClient())
  const [open, setOpen]             = useState(false)
  const [notifications, setNotifs]  = useState<Notification[]>([])
  const [unreadCount, setUnread]    = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, href, read_at, created_at')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setNotifs(data)
      setUnread(data.filter(n => !n.read_at).length)
    }
  }

  // Fetch inicial
  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Refetch cada vez que se abre el panel — fallback si Realtime no llega
  useEffect(() => {
    if (open) void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Realtime: escuchar INSERTs para actualizar badge
  useEffect(() => {
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        payload => {
          const newNotif = payload.new as Notification
          setNotifs(prev => [newNotif, ...prev].slice(0, 20))
          setUnread(c => c + 1)
        }
      )
      .subscribe()
    channelRef.current = channel
    return () => { void supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function handleClick(notif: Notification) {
    if (!notif.read_at) {
      await markNotificationRead(notif.id)
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
      setUnread(c => Math.max(0, c - 1))
    }
    setOpen(false)
    if (notif.href) router.push(notif.href)
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead()
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnread(0)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative w-full justify-start text-muted-foreground">
          <Bell className="h-4 w-4 mr-2 shrink-0" />
          Notificaciones
          {unreadCount > 0 && (
            <span className="absolute left-5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent side="right" align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sin notificaciones</p>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => void handleClick(n)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b last:border-0 hover:bg-accent transition-colors',
                  !n.read_at && 'bg-accent/40'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('text-sm leading-snug', !n.read_at && 'font-medium')}>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
