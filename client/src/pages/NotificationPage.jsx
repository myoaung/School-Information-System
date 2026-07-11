import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
  {
    value: 'attendance',
    label: 'Attendance',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    icon: '📊',
  },
  {
    value: 'fee',
    label: 'Fee',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    icon: '💰',
  },
  {
    value: 'exam',
    label: 'Exam',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    icon: '📝',
  },
  {
    value: 'announcement',
    label: 'Announcement',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    icon: '📢',
  },
  {
    value: 'emergency',
    label: 'Emergency',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    icon: '🚨',
  },
  {
    value: 'general',
    label: 'General',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: '🔔',
  },
];

export default function NotificationPage() {
  const { isAdmin, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'general',
    target_role: 'student',
    channels: ['in_app'],
  });

  const fetchNotifications = () => {
    setLoading(true);
    const params = {};
    if (filter !== 'all') params.type = filter;
    api
      .get('/notifications', { params })
      .then((r) => {
        setNotifications(r.data.notifications);
        setUnreadCount(r.data.unreadCount);
      })
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  const fetchPreferences = () => {
    api
      .get('/notifications/preferences')
      .then((r) => setPreferences(r.data.preferences))
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [filter]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await api.put('/notifications/preferences', preferences);
      toast.success('Preferences saved');
      setShowPrefs(false);
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/notifications/send', sendForm);
      toast.success('Notification sent');
      setShowSendModal(false);
      setSendForm({
        title: '',
        message: '',
        type: 'general',
        target_role: 'student',
        channels: ['in_app'],
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </button>
          )}
          <button
            onClick={() => setShowPrefs(true)}
            className="px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-xl text-sm hover:bg-purple-200 transition-colors cursor-pointer"
          >
            ⚙️ Preferences
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-xl text-sm hover:bg-green-200 transition-colors cursor-pointer"
            >
              ✓ Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'
          }`}
        >
          All
        </button>
        {NOTIFICATION_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilter(type.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              filter === type.value
                ? 'bg-indigo-600 text-white'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const type = NOTIFICATION_TYPES.find((t) => t.value === notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                  !notif.read ? 'border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{type?.icon || '🔔'}</span>
                    <div>
                      <p
                        className={`font-medium ${notif.read ? 'text-purple-600 dark:text-purple-400' : 'text-purple-900 dark:text-purple-100'}`}
                      >
                        {notif.title || 'Notification'}
                      </p>
                      {notif.message && (
                        <p className="text-sm text-purple-500 dark:text-purple-400 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-xs text-purple-400 dark:text-purple-500 mt-1">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="text-purple-400 hover:text-red-500 cursor-pointer p-1"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
          <svg
            className="w-12 h-12 text-purple-300 mx-auto mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <p className="text-purple-500">No notifications</p>
        </div>
      )}

      {/* Preferences Modal */}
      <Modal
        isOpen={showPrefs}
        onClose={() => setShowPrefs(false)}
        title="Notification Preferences"
      >
        {preferences && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Channels</h4>
              {[
                { key: 'email_enabled', label: 'Email notifications' },
                { key: 'sms_enabled', label: 'SMS notifications' },
                { key: 'push_enabled', label: 'Push notifications' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[key] === 1}
                    onChange={(e) =>
                      setPreferences({ ...preferences, [key]: e.target.checked ? 1 : 0 })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-purple-900 dark:text-purple-100">{label}</span>
                </label>
              ))}
            </div>
            <div>
              <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Categories</h4>
              {[
                { key: 'attendance_alerts', label: 'Attendance alerts' },
                { key: 'fee_reminders', label: 'Fee reminders' },
                { key: 'exam_notices', label: 'Exam notices' },
                { key: 'announcements', label: 'Announcements' },
                { key: 'emergency_alerts', label: 'Emergency alerts' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[key] === 1}
                    onChange={(e) =>
                      setPreferences({ ...preferences, [key]: e.target.checked ? 1 : 0 })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-purple-900 dark:text-purple-100">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrefs(false)}
                className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Modal (admin only) */}
      {isAdmin && (
        <Modal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          title="Send Notification"
        >
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={sendForm.title}
                onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Message
              </label>
              <textarea
                required
                value={sendForm.message}
                onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Type
                </label>
                <select
                  value={sendForm.type}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
                >
                  {NOTIFICATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Target
                </label>
                <select
                  value={sendForm.target_role}
                  onChange={(e) => setSendForm({ ...sendForm, target_role: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
                >
                  <option value="student">All Students</option>
                  <option value="teacher">All Teachers</option>
                  <option value="parent">All Parents</option>
                  <option value="admin">All Admins</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Channels
              </label>
              <div className="flex gap-3">
                {['in_app', 'email', 'sms'].map((ch) => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendForm.channels.includes(ch)}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...sendForm.channels, ch]
                          : sendForm.channels.filter((c) => c !== ch);
                        setSendForm({ ...sendForm, channels });
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm text-purple-900 dark:text-purple-100 capitalize">
                      {ch.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
