import { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';

export default function ChatLogsPage() {
  const { t, formatDate } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get('/chat/logs', { params: { page: p, limit: 20, search: q } });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPage(res.data.page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1, search);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('chatLogs.confirmDelete'))) return;
    try {
      await api.delete(`/chat/logs/${id}`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      // ignore
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-purple-50/30 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-purple-900 dark:text-purple-100">{t('chatLogs.title')}</h1>
            <p className="text-purple-600 dark:text-purple-400 text-sm mt-1">{t('chatLogs.subtitle', { count: total })}</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('chatLogs.searchPlaceholder')}
              aria-label={t('chatLogs.searchPlaceholder')}
              className="px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-800"
            />
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer">
              {t('chatLogs.search')}
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-purple-400 dark:text-purple-400">{t('common.loading')}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-purple-400 dark:text-purple-400">{t('chatLogs.noLogs')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{t('chatLogs.title')}</caption>
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th scope="col" className="px-4 py-3 font-medium">{t('chatLogs.user')}</th>
                    <th scope="col" className="px-4 py-3 font-medium">{t('chatLogs.role')}</th>
                    <th scope="col" className="px-4 py-3 font-medium">{t('chatLogs.message')}</th>
                    <th scope="col" className="px-4 py-3 font-medium">{t('chatLogs.reply')}</th>
                    <th scope="col" className="px-4 py-3 font-medium">{t('chatLogs.file')}</th>
                    <th scope="col" className="px-4 py-3 font-medium">{t('chatLogs.date')}</th>
                    <th scope="col" className="px-4 py-3 font-medium">{t('chatLogs.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                      <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">{log.user_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.user_role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                          log.user_role === 'teacher' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                          'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                        }`}>
                          {log.user_role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{log.message || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[250px] truncate">{log.reply || '—'}</td>
                      <td className="px-4 py-3">
                        {log.file_name ? (
                          <a href={log.file_path} target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
                            📎 {log.file_name}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-purple-500 dark:text-purple-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(log.id)} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer" title={t('chatLogs.delete')}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => fetchLogs(page - 1, search)}
              className="px-3 py-1.5 rounded-lg text-sm bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 dark:bg-gray-800 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/30 disabled:opacity-40 cursor-pointer"
            >
              ←
            </button>
            <span className="px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchLogs(page + 1, search)}
              className="px-3 py-1.5 rounded-lg text-sm bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 dark:bg-gray-800 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/30 disabled:opacity-40 cursor-pointer"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
