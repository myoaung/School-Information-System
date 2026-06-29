import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function MessagesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [form, setForm] = useState({ receiver_id: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);

  const fetchMessages = () => {
    setLoading(true);
    const endpoint = tab === 'inbox' ? '/messages/inbox' : '/messages/sent';
    api.get(endpoint)
      .then(r => setMessages(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(); }, [tab]);

  useEffect(() => {
    if (showCompose) {
      api.get('/messages/users').then(r => setUsers(r.data)).catch(() => {});
    }
  }, [showCompose]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.receiver_id || !form.body.trim()) return;
    setSending(true);
    try {
      await api.post('/messages', form);
      setShowCompose(false);
      setForm({ receiver_id: '', subject: '', body: '' });
      if (tab === 'sent') fetchMessages();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/messages/${id}/read`);
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, is_read: 1 } : m));
    } catch {}
  };

  const deleteMsg = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/messages/${id}`);
      setMessages(msgs => msgs.filter(m => m.id !== id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Messages</h1>
          <p className="text-purple-600/60 dark:text-purple-300/60 mt-1">Send and receive messages</p>
        </div>
        <button onClick={() => setShowCompose(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Compose
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-purple-100/50 dark:bg-gray-800/50 rounded-xl p-1">
        {['inbox', 'sent'].map(t => (
          <button key={t} onClick={() => { setTab(t); setSelectedMsg(null); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer capitalize ${
              tab === t ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-purple-600 dark:text-purple-400 hover:text-purple-800'
            }`}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="md:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 bg-purple-200 dark:bg-gray-700 rounded-xl" />)}</div>
          ) : messages.length ? messages.map(msg => (
            <button key={msg.id} onClick={() => { setSelectedMsg(msg); if (!msg.is_read && tab === 'inbox') markRead(msg.id); }}
              className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${
                selectedMsg?.id === msg.id
                  ? 'bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-300 dark:border-purple-700'
                  : msg.is_read || tab === 'sent'
                    ? 'bg-white dark:bg-gray-800 border-2 border-transparent hover:bg-purple-50 dark:hover:bg-gray-700'
                    : 'bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 font-semibold'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-purple-900 dark:text-purple-100 truncate">
                  {tab === 'inbox' ? msg.sender_name : msg.receiver_name}
                </span>
                <span className="text-xs text-purple-400 dark:text-purple-500">{new Date(msg.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{msg.subject || '(no subject)'}</p>
              <p className="text-xs text-purple-400 dark:text-purple-500 truncate mt-0.5">{msg.body}</p>
            </button>
          )) : <p className="text-center text-sm text-purple-400 py-8">No messages</p>}
        </div>

        {/* Message Detail */}
        <div className="md:col-span-2">
          {selectedMsg ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">{selectedMsg.subject || '(no subject)'}</h3>
                  <p className="text-sm text-purple-500 dark:text-purple-400 mt-1">
                    {tab === 'inbox' ? `From: ${selectedMsg.sender_name}` : `To: ${selectedMsg.receiver_name}`}
                    {' • '}{new Date(selectedMsg.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => deleteMsg(selectedMsg.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
              <div className="border-t border-purple-100 dark:border-gray-700 pt-4">
                <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">{selectedMsg.body}</p>
              </div>
              {tab === 'inbox' && (
                <div className="mt-6 pt-4 border-t border-purple-100 dark:border-gray-700">
                  <button onClick={() => { setShowCompose(true); setForm({ receiver_id: String(selectedMsg.sender_id), subject: `Re: ${selectedMsg.subject || ''}`, body: '' }); }}
                    className="bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    Reply
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-purple-200 dark:text-purple-800 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <p className="text-purple-400 dark:text-purple-500">Select a message to read</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Compose Message</h3>
              <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">To</label>
                <select value={form.receiver_id} onChange={e => setForm({...form, receiver_id: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                  <option value="">Select recipient...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Subject</label>
                <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Optional subject" />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Message</label>
                <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} rows={5}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" placeholder="Type your message..." required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={sending}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
