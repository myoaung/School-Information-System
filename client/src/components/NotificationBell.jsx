import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.get('/notifications/unread-count').then(r => setUnreadCount(r.data.count)).catch(() => toast.error('Failed to load notification count'));
  }, []);

  useEffect(() => {
    if (open) {
      api.get('/notifications?limit=10').then(r => setNotifications(r.data)).catch(() => toast.error('Failed to load notifications'));
    }
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(n => n.map(notif => notif.id === id ? { ...notif, is_read: 1 } : notif));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { toast.error('Failed to mark notification as read'); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(n => n.map(notif => ({ ...notif, is_read: 1 })));
      setUnreadCount(0);
    } catch { toast.error('Failed to mark all as read'); }
  };

  const typeIcons = {
    announcement: '📢',
    grade: '📝',
    submission: '📋',
    attendance: '✅',
    message: '💬',
    alert: '⚠️',
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Notifications">
        <svg className="w-5 h-5 text-purple-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-purple-100 dark:border-gray-700 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 cursor-pointer">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length ? notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-purple-50 dark:border-gray-700/50 last:border-0 ${
                !n.is_read ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{n.title}</p>
                    <p className="text-xs text-purple-500 dark:text-purple-400 truncate">{n.message}</p>
                    <p className="text-[10px] text-purple-400 dark:text-purple-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)}
                      className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0 cursor-pointer" title="Mark as read" />
                  )}
                </div>
              </div>
            )) : (
              <p className="p-6 text-center text-sm text-purple-400">No notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
