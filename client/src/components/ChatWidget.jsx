import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [sendError, setSendError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const chatPanelRef = useRef(null);
  const chatButtonRef = useRef(null);

  // Load chat history on open
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    api.get('/chat/history').then((res) => {
      setMessages(res.data);
    }).catch(() => toast.error('Failed to load chat history'));
  }, [open, isAuthenticated]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus management for chat panel
  useEffect(() => {
    if (!open) return;

    // Focus the input field when chat opens
    const timer = setTimeout(() => chatInputRef.current?.focus(), 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setTimeout(() => chatButtonRef.current?.focus(), 0);
        return;
      }
      // Trap Tab inside chat panel
      if (e.key === 'Tab' && chatPanelRef.current) {
        const focusable = chatPanelRef.current.querySelectorAll(
          'button:not([disabled]), textarea, input:not([type="hidden"]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const handleSend = async () => {
    if ((!input.trim() && !file) || loading) return;

    setSendError(null);
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    // Optimistic user message
    const tempId = Date.now();
    setMessages((prev) => [...prev, { id: tempId, message: userMsg, reply: null, file_name: file?.name }]);

    try {
      const formData = new FormData();
      if (userMsg) formData.append('message', userMsg);
      if (file) formData.append('file', file);

      const res = await api.post('/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...res.data, message: userMsg || res.data.message } : m))
      );
      setFile(null);
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, reply: 'Sorry, something went wrong. Please try again.' } : m))
      );
      setSendError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = [
    t('chat.quick.announcements'),
    t('chat.quick.classes'),
    t('chat.quick.help'),
  ];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          ref={chatButtonRef}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200 cursor-pointer flex items-center justify-center"
          aria-expanded={open}
          aria-label="Open chat assistant"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div ref={chatPanelRef} className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl shadow-purple-500/20 flex flex-col overflow-hidden border border-purple-100" role="dialog" aria-label="Chat assistant">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
              </svg>
              <span className="font-semibold text-sm">{t('chat.title')}</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-lg p-1 transition-colors cursor-pointer" aria-label="Close chat assistant">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-purple-50/30" role="log" aria-label="Chat messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-center text-purple-400 text-sm mt-8">
                <p className="text-2xl mb-2">🤖</p>
                <p>{t('chat.welcome')}</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {/* User message */}
                {(m.message || m.file_name) && (
                  <div className="flex justify-end">
                    <div className="bg-purple-600 text-white px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%] text-sm break-words">
                      {m.file_name && (
                        <div className="flex items-center gap-1 mb-1 text-purple-200 text-xs">
                          📎 {m.file_name}
                        </div>
                      )}
                      {m.message}
                    </div>
                  </div>
                )}
                {/* AI reply */}
                {m.reply && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 px-3 py-2 rounded-2xl rounded-bl-sm max-w-[85%] text-sm shadow-sm whitespace-pre-line">
                      {m.reply}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-purple-400 px-3 py-2 rounded-2xl rounded-bl-sm text-sm shadow-sm">
                  <span className="chat-typing">{t('chat.thinking')}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length === 0 && (
            <div className="px-3 pb-1 flex flex-wrap gap-1 shrink-0">
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => { setInput(qr); }}
                  className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* File preview */}
          {file && (
            <div className="px-3 py-1 bg-purple-50 flex items-center justify-between text-xs text-purple-700 shrink-0">
              <span className="truncate">📎 {file.name}</span>
              <button onClick={() => setFile(null)} className="text-purple-400 hover:text-purple-700 cursor-pointer ml-2">✕</button>
            </div>
          )}

          {/* Send Error */}
          {sendError && (
            <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-center justify-between rounded-t-lg">
              <span>{sendError}</span>
              <button onClick={() => { setSendError(null); handleSend(); }} className="underline hover:no-underline">
                Retry
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-2 border-t border-purple-100 flex items-end gap-1 bg-white shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-purple-400 hover:text-purple-700 transition-colors cursor-pointer"
              title={t('chat.attach')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <textarea
              ref={chatInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              rows={1}
              className="flex-1 resize-none border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500 max-h-20"
              aria-label="Type your message"
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !file) || loading}
              className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
