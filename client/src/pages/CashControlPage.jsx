import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income', color: 'text-green-600' },
  { value: 'expense', label: 'Expense', color: 'text-red-600' },
  { value: 'refund', label: 'Refund', color: 'text-amber-600' },
  { value: 'adjustment', label: 'Adjustment', color: 'text-blue-600' },
];

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'mobile_payment', 'other'];

const TYPE_BADGES = {
  income: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  expense: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  refund: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  adjustment: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
};

export default function CashControlPage() {
  const [tab, setTab] = useState('current');
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showTransModal, setShowTransModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openForm, setOpenForm] = useState({ opening_balance: '', notes: '' });
  const [closeForm, setCloseForm] = useState({ actual_balance: '', notes: '' });
  const [transForm, setTransForm] = useState({
    type: 'income',
    amount: '',
    payment_method: 'cash',
    reference: '',
    description: '',
  });

  const fetchCurrent = () => {
    setLoading(true);
    api
      .get('/cash-control/session/current')
      .then((r) => {
        setSession(r.data.session);
        setTransactions(r.data.transactions || []);
        setSummary(r.data.summary);
      })
      .catch(() => toast.error('Failed to load cash session'))
      .finally(() => setLoading(false));
  };

  const fetchSessions = () => {
    api
      .get('/cash-control/sessions')
      .then((r) => setSessions(r.data.sessions))
      .catch(() => {});
  };

  useEffect(() => {
    fetchCurrent();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (tab === 'history') fetchSessions();
  }, [tab]);

  const handleOpenSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/cash-control/session/open', {
        opening_balance: parseFloat(openForm.opening_balance) || 0,
        notes: openForm.notes,
      });
      setShowOpenModal(false);
      toast.success('Cash session opened');
      fetchCurrent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to open session');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/cash-control/session/close', {
        actual_balance: parseFloat(closeForm.actual_balance) || 0,
        notes: closeForm.notes,
      });
      setShowCloseModal(false);
      toast.success('Session closed');
      fetchCurrent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to close session');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/cash-control/transactions', {
        ...transForm,
        amount: parseFloat(transForm.amount),
      });
      setShowTransModal(false);
      toast.success('Transaction recorded');
      fetchCurrent();
      setTransForm({
        type: 'income',
        amount: '',
        payment_method: 'cash',
        reference: '',
        description: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return (
      new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(
        amount
      ) + ' MMK'
    );
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Daily Cash Control
          </h1>
        </div>
        <div className="flex gap-2">
          {!session ? (
            <button
              onClick={() => {
                setOpenForm({ opening_balance: '', notes: '' });
                setShowOpenModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer"
            >
              Open Session
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowTransModal(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-700 transition-colors cursor-pointer"
              >
                + Record Transaction
              </button>
              <button
                onClick={() => {
                  setCloseForm({ actual_balance: summary?.expected_balance || '', notes: '' });
                  setShowCloseModal(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors cursor-pointer"
              >
                Close Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'current', label: '💰 Current Session' },
          { key: 'history', label: '📅 History' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
              tab === t.key
                ? 'bg-cyan-600 text-white'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Current Session Tab */}
      {tab === 'current' && (
        <>
          {!session ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <div className="text-6xl mb-4">🏪</div>
              <p className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">
                No Active Session
              </p>
              <p className="text-purple-500 mb-4">
                Open a cash session to start recording transactions.
              </p>
              <button
                onClick={() => {
                  setOpenForm({ opening_balance: '', notes: '' });
                  setShowOpenModal(true);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 cursor-pointer"
              >
                Open Session
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Opening Balance',
                    value: formatMoney(summary?.opening_balance),
                    color: 'text-blue-600 dark:text-blue-400',
                  },
                  {
                    label: 'Total Income',
                    value: formatMoney(summary?.total_income),
                    color: 'text-green-600 dark:text-green-400',
                  },
                  {
                    label: 'Total Expenses',
                    value: formatMoney(summary?.total_expenses),
                    color: 'text-red-600 dark:text-red-400',
                  },
                  {
                    label: 'Expected Balance',
                    value: formatMoney(summary?.expected_balance),
                    color: 'text-purple-600 dark:text-purple-400',
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-purple-500 dark:text-purple-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Session Info */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Session opened by {session.opened_by_name}</p>
                    <p className="text-sm opacity-80">
                      {formatDateTime(session.opened_at)} · {summary?.transaction_count}{' '}
                      transactions
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    OPEN
                  </span>
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-purple-100 dark:border-purple-900">
                  <h3 className="font-bold text-purple-900 dark:text-purple-100">Transactions</h3>
                </div>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                          <th className="px-4 py-2 font-medium">Time</th>
                          <th className="px-4 py-2 font-medium">Type</th>
                          <th className="px-4 py-2 font-medium">Amount</th>
                          <th className="px-4 py-2 font-medium">Method</th>
                          <th className="px-4 py-2 font-medium">Description</th>
                          <th className="px-4 py-2 font-medium">By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-purple-50/50">
                            <td className="px-4 py-2 text-purple-600 dark:text-purple-400">
                              {formatDateTime(t.created_at)}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGES[t.type]}`}
                              >
                                {t.type}
                              </span>
                            </td>
                            <td
                              className={`px-4 py-2 font-medium ${
                                t.type === 'income' || t.type === 'adjustment'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {t.type === 'income' || t.type === 'adjustment' ? '+' : '-'}
                              {formatMoney(t.amount)}
                            </td>
                            <td className="px-4 py-2 text-purple-600 dark:text-purple-400 capitalize">
                              {t.payment_method?.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-2 text-purple-600 dark:text-purple-400 max-w-[200px] truncate">
                              {t.description || t.reference || '—'}
                            </td>
                            <td className="px-4 py-2 text-purple-600 dark:text-purple-400">
                              {t.recorded_by_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-purple-500">No transactions yet today</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Opened By</th>
                    <th className="px-4 py-3 font-medium">Opening</th>
                    <th className="px-4 py-3 font-medium">Closing</th>
                    <th className="px-4 py-3 font-medium">Variance</th>
                    <th className="px-4 py-3 font-medium">Transactions</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                        {s.session_date}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {s.opened_by_name}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatMoney(s.opening_balance)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatMoney(s.closing_balance)}
                      </td>
                      <td className="px-4 py-3">
                        {s.variance !== null ? (
                          <span
                            className={`font-medium ${
                              s.variance === 0
                                ? 'text-green-600'
                                : Math.abs(s.variance) > 1000
                                  ? 'text-red-600'
                                  : 'text-amber-600'
                            }`}
                          >
                            {s.variance > 0 ? '+' : ''}
                            {formatMoney(s.variance)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {s.transaction_count}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.status === 'open'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-purple-500">No session history</p>
            </div>
          )}
        </div>
      )}

      {/* Open Session Modal */}
      <Modal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="Open Cash Session"
      >
        <form onSubmit={handleOpenSession} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Opening Balance (MMK) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={openForm.opening_balance}
              onChange={(e) => setOpenForm({ ...openForm, opening_balance: e.target.value })}
              placeholder="Enter the starting cash amount"
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Notes
            </label>
            <textarea
              value={openForm.notes}
              onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowOpenModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Opening...' : 'Open Session'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Close Session Modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Cash Session"
      >
        <form onSubmit={handleCloseSession} className="space-y-3">
          <div className="bg-purple-50 dark:bg-purple-950/40 rounded-lg p-3 text-sm">
            <p className="text-purple-700 dark:text-purple-300">
              Expected balance: <strong>{formatMoney(summary?.expected_balance)}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Actual Cash Count (MMK) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={closeForm.actual_balance}
              onChange={(e) => setCloseForm({ ...closeForm, actual_balance: e.target.value })}
              placeholder="Count and enter the actual cash amount"
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Notes
            </label>
            <textarea
              value={closeForm.notes}
              onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCloseModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Closing...' : 'Close Session'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={showTransModal}
        onClose={() => setShowTransModal(false)}
        title="Record Transaction"
      >
        <form onSubmit={handleRecordTransaction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Type *
              </label>
              <select
                value={transForm.type}
                onChange={(e) => setTransForm({ ...transForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Amount (MMK) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={transForm.amount}
                onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Payment Method
            </label>
            <select
              value={transForm.payment_method}
              onChange={(e) => setTransForm({ ...transForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Reference
            </label>
            <input
              type="text"
              value={transForm.reference}
              onChange={(e) => setTransForm({ ...transForm, reference: e.target.value })}
              placeholder="Receipt #, invoice #, etc."
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <textarea
              value={transForm.description}
              onChange={(e) => setTransForm({ ...transForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowTransModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Recording...' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
