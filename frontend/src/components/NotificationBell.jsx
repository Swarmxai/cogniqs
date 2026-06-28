import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { api } from '../api/client'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = () => {
    api.unreadCount().then((r) => setCount(r.count || 0)).catch(() => {})
    api.getNotifications().then(setItems).catch(() => {})
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markAll = async () => {
    await api.markAllRead()
    setCount(0)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const markOne = async (id) => {
    await api.markRead(id)
    setCount((c) => Math.max(0, c - 1))
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) load() }}
        className="cq-btn cq-btn-ghost !px-2.5 !py-2 relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ background: 'var(--primary)' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto cq-card shadow-xl z-50 p-2">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-sm font-semibold">Notifications</span>
            {count > 0 && (
              <button type="button" onClick={markAll} className="text-xs flex items-center gap-1 text-faint hover:text-[var(--ink)]">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No notifications yet</p>
          ) : (
            <ul className="space-y-0.5">
              {items.slice(0, 20).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => { if (!n.is_read) markOne(n.id) }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      n.is_read ? 'opacity-60' : 'bg-[var(--surface-2)]'
                    }`}
                  >
                    <p className="font-medium truncate">{n.title}</p>
                    {n.message && <p className="text-xs text-muted truncate">{n.message}</p>}
                    {n.link && (
                      <Link to={n.link} className="text-xs mt-1 inline-block" style={{ color: 'var(--primary)' }}
                        onClick={() => setOpen(false)}>
                        View →
                      </Link>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
