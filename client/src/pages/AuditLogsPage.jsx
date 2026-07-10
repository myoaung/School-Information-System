import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import { toast } from 'sonner';

const ENTITY_TYPES = [
  '',
  'student',
  'teacher',
  'grade',
  'fee_structure',
  'invoice',
  'payment',
  'timetable',
];
const ACTIONS = ['', 'create', 'update', 'delete'];

const actionColors = {
  create: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchLogs = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = {
          limit: PAGE_SIZE,
          offset: (p - 1) * PAGE_SIZE,
        };
        if (entityFilter) params.entity_type = entityFilter;
        if (actionFilter) params.action = actionFilter;

        const res = await api.get('/audit', { params });
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setPage(p);
      } catch {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    },
    [entityFilter, actionFilter]
  );

  useEffect(() => {
    if (isAdmin) fetchLogs();
  }, [isAdmin, fetchLogs]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-purple-50/30 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-purple-600 dark:text-purple-400">Access denied. Admin only.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatJson = (val) => {
    if (!val) return null;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(', ');
    } catch {
      return String(val);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50/30 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-purple-900 dark:text-purple-100">Audit Logs</h1>
            <p className="text-purple-600 dark:text-purple-400 text-sm mt-1">
              {total} total log entries
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:outline-none focus:border-purple-500 cursor-pointer"
            aria-label="Filter by entity type"
          >
            <option value="">All Entities</option>
            {ENTITY_TYPES.filter(Boolean).map((et) => (
              <option key={et} value={et}>
                {et.charAt(0).toUpperCase() + et.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:outline-none focus:border-purple-500 cursor-pointer"
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            {ACTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchLogs(1)}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
          {(entityFilter || actionFilter) && (
            <button
              onClick={() => {
                setEntityFilter('');
                setActionFilter('');
              }}
              className="px-4 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-purple-100 dark:border-purple-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-purple-400">{t('common.loading')}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-purple-400">No audit log entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Audit Logs</caption>
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      User
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Action
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Entity
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Entity ID
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-purple-500 dark:text-purple-400 text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-purple-900 dark:text-purple-100">
                          {log.user_name || 'System'}
                        </div>
                        <div className="text-xs text-purple-400">{log.user_email || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100 capitalize">
                        {log.entity_type.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-purple-500 dark:text-purple-400 text-xs">
                        {log.entity_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs max-w-[200px] truncate">
                        {formatJson(log.new_values) || formatJson(log.old_values) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expanded row detail */}
          {expandedRow && logs.find((l) => l.id === expandedRow) && (
            <div className="border-t border-purple-100 dark:border-purple-800 px-6 py-4 bg-purple-50/30 dark:bg-purple-950/20">
              {(() => {
                const log = logs.find((l) => l.id === expandedRow);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-purple-500 dark:text-purple-400 font-medium">
                        IP Address:{' '}
                      </span>
                      <span className="text-purple-900 dark:text-purple-100">
                        {log.ip_address || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-500 dark:text-purple-400 font-medium">
                        User Agent:{' '}
                      </span>
                      <span className="text-purple-900 dark:text-purple-100 text-xs break-all">
                        {log.user_agent || '—'}
                      </span>
                    </div>
                    {log.old_values && (
                      <div className="sm:col-span-2">
                        <span className="text-purple-500 dark:text-purple-400 font-medium">
                          Previous Values:{' '}
                        </span>
                        <span className="text-purple-900 dark:text-purple-100 text-xs">
                          {formatJson(log.old_values)}
                        </span>
                      </div>
                    )}
                    {log.new_values && (
                      <div className="sm:col-span-2">
                        <span className="text-purple-500 dark:text-purple-400 font-medium">
                          New Values:{' '}
                        </span>
                        <span className="text-purple-900 dark:text-purple-100 text-xs">
                          {formatJson(log.new_values)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => fetchLogs(page - 1)}
              className="px-3 py-1.5 rounded-lg text-sm bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 dark:bg-gray-800 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/30 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchLogs(page + 1)}
              className="px-3 py-1.5 rounded-lg text-sm bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 dark:bg-gray-800 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/30 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
