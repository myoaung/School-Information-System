import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const AGING_COLORS = {
  current: 'text-green-600 dark:text-green-400',
  '1_30': 'text-amber-600 dark:text-amber-400',
  '31_60': 'text-orange-600 dark:text-orange-400',
  '61_90': 'text-red-600 dark:text-red-400',
  '90_plus': 'text-red-800 dark:text-red-300',
};

const AGING_LABELS = {
  current: 'Current',
  '1_30': '1–30 Days',
  '31_60': '31–60 Days',
  '61_90': '61–90 Days',
  '90_plus': '90+ Days',
};

export default function AccountsReceivablePage() {
  const [tab, setTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [studentsWithDebt, setStudentsWithDebt] = useState([]);
  const [aging, setAging] = useState(null);
  const [agingSummary, setAgingSummary] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentStatement, setStudentStatement] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [writeOffForm, setWriteOffForm] = useState({ amount: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const fetchSummary = () => {
    setLoading(true);
    api
      .get('/accounts-receivable/summary')
      .then((r) => {
        setSummary(r.data.summary);
        setStudentsWithDebt(r.data.studentsWithDebt || []);
      })
      .catch(() => toast.error('Failed to load AR data'))
      .finally(() => setLoading(false));
  };

  const fetchAging = () => {
    api
      .get('/accounts-receivable/aging')
      .then((r) => {
        setAging(r.data.aging);
        setAgingSummary(r.data.summary);
      })
      .catch(() => {});
  };

  const fetchReminders = () => {
    api
      .get('/accounts-receivable/reminders')
      .then((r) => setReminders(r.data.students))
      .catch(() => {});
  };

  useEffect(() => {
    fetchSummary();
    fetchAging();
    fetchReminders();
  }, []);

  useEffect(() => {
    if (tab === 'aging') fetchAging();
    if (tab === 'reminders') fetchReminders();
  }, [tab]);

  const openStudentStatement = async (studentId) => {
    try {
      const r = await api.get(`/accounts-receivable/student/${studentId}`);
      setStudentStatement(r.data);
      setShowStatementModal(true);
    } catch (err) {
      toast.error('Failed to load statement');
    }
  };

  const openWriteOff = (invoice) => {
    setSelectedInvoice(invoice);
    setWriteOffForm({ amount: invoice.outstanding || invoice.amount, reason: '' });
    setShowWriteOffModal(true);
  };

  const handleWriteOff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/accounts-receivable/write-off', {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(writeOffForm.amount),
        reason: writeOffForm.reason,
      });
      setShowWriteOffModal(false);
      toast.success('Write-off recorded');
      fetchSummary();
      fetchAging();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to write off');
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl flex items-center justify-center">
          <svg
            className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6m3-3h-6" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
          Accounts Receivable
        </h1>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Outstanding',
              value: formatMoney(summary.total_outstanding),
              color: 'text-purple-600 dark:text-purple-400',
            },
            {
              label: 'Overdue',
              value: formatMoney(summary.total_overdue),
              color: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'Total Collected',
              value: formatMoney(summary.total_paid),
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: 'Collection Rate',
              value: `${summary.collection_rate}%`,
              color: 'text-cyan-600 dark:text-cyan-400',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'aging', label: '⏳ Aging' },
          { key: 'reminders', label: '🔔 Reminders' },
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

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Students with Debt */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-100 dark:border-purple-900">
              <h3 className="font-bold text-purple-900 dark:text-purple-100">
                Students with Outstanding Balances
              </h3>
            </div>
            {studentsWithDebt.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Grade</th>
                      <th className="px-4 py-3 font-medium">Invoices</th>
                      <th className="px-4 py-3 font-medium">Outstanding</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                    {studentsWithDebt.map((s) => (
                      <tr key={s.id} className="hover:bg-purple-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-purple-900 dark:text-purple-100">
                            {s.name}
                          </p>
                          <p className="text-xs text-purple-500">{s.email}</p>
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {s.grade_name || '—'}
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {s.invoice_count}
                        </td>
                        <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400">
                          {formatMoney(s.total_invoiced)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openStudentStatement(s.id)}
                            className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                          >
                            View Statement
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-purple-500">No outstanding balances 🎉</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aging Tab */}
      {tab === 'aging' && agingSummary && (
        <div className="space-y-6">
          {/* Aging Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(AGING_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 text-center"
              >
                <p className={`text-2xl font-bold ${AGING_COLORS[key]}`}>
                  {formatMoney(agingSummary[key])}
                </p>
                <p className="text-xs text-purple-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white text-center">
            <p className="text-sm opacity-80">Total Outstanding</p>
            <p className="text-4xl font-extrabold">{formatMoney(agingSummary.total)}</p>
            <p className="text-sm opacity-80 mt-1">{agingSummary.count} unpaid invoices</p>
          </div>

          {/* Aging Details by Bucket */}
          {aging &&
            Object.entries(aging).map(([bucket, invoices]) =>
              invoices.length > 0 ? (
                <div
                  key={bucket}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-purple-100 dark:border-purple-900 flex items-center justify-between">
                    <h3 className="font-bold text-purple-900 dark:text-purple-100">
                      {AGING_LABELS[bucket]}
                    </h3>
                    <span className={`text-sm font-medium ${AGING_COLORS[bucket]}`}>
                      {formatMoney(invoices.reduce((sum, i) => sum + i.outstanding, 0))}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-purple-700 dark:text-purple-300 text-left text-xs">
                          <th className="px-4 py-2 font-medium">Student</th>
                          <th className="px-4 py-2 font-medium">Grade</th>
                          <th className="px-4 py-2 font-medium">Due Date</th>
                          <th className="px-4 py-2 font-medium">Outstanding</th>
                          <th className="px-4 py-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-purple-50/50">
                            <td className="px-4 py-2 font-medium text-purple-900 dark:text-purple-100">
                              {inv.student_name}
                            </td>
                            <td className="px-4 py-2 text-purple-600 dark:text-purple-400">
                              {inv.grade_name || '—'}
                            </td>
                            <td className="px-4 py-2 text-purple-600 dark:text-purple-400">
                              {formatDate(inv.due_date)}
                            </td>
                            <td className="px-4 py-2 font-medium text-red-600">
                              {formatMoney(inv.outstanding)}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openStudentStatement(inv.student_id)}
                                  className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                                >
                                  Statement
                                </button>
                                <button
                                  onClick={() => openWriteOff(inv)}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                                >
                                  Write Off
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null
            )}
        </div>
      )}

      {/* Reminders Tab */}
      {tab === 'reminders' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {reminders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Overdue Invoices</th>
                    <th className="px-4 py-3 font-medium">Total Overdue</th>
                    <th className="px-4 py-3 font-medium">Oldest Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {reminders.map((s) => (
                    <tr key={s.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        <p>{s.email}</p>
                        {s.phone && <p className="text-xs">{s.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {s.overdue_count}
                      </td>
                      <td className="px-4 py-3 font-medium text-red-600">
                        {formatMoney(s.total_overdue)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(s.oldest_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-purple-500">No overdue invoices — all clear! 🎉</p>
            </div>
          )}
        </div>
      )}

      {/* Student Statement Modal */}
      <Modal
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        title={`Statement: ${studentStatement?.student?.name || ''}`}
        size="lg"
      >
        {studentStatement && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-purple-500">Total Invoiced</p>
                <p className="font-bold text-purple-900 dark:text-purple-100">
                  {formatMoney(studentStatement.summary.total_invoiced)}
                </p>
              </div>
              <div>
                <p className="text-purple-500">Total Paid</p>
                <p className="font-bold text-green-600">
                  {formatMoney(studentStatement.summary.total_paid)}
                </p>
              </div>
              <div>
                <p className="text-purple-500">Balance Due</p>
                <p className="font-bold text-red-600">
                  {formatMoney(studentStatement.summary.balance)}
                </p>
              </div>
              <div>
                <p className="text-purple-500">Unpaid Invoices</p>
                <p className="font-bold text-purple-900 dark:text-purple-100">
                  {studentStatement.summary.unpaid_count}
                </p>
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">Invoices</h4>
              <div className="max-h-[300px] overflow-y-auto">
                {studentStatement.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b border-purple-50 dark:border-purple-900 text-sm"
                  >
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">
                        {inv.fee_type || 'Invoice'} — {inv.description || `#${inv.id}`}
                      </p>
                      <p className="text-xs text-purple-500">Due: {formatDate(inv.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-purple-900 dark:text-purple-100">
                        {formatMoney(inv.amount)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          inv.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : inv.status === 'overdue'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Write Off Modal */}
      <Modal
        isOpen={showWriteOffModal}
        onClose={() => setShowWriteOffModal(false)}
        title="Write Off Invoice"
      >
        <form onSubmit={handleWriteOff} className="space-y-3">
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
            This action will mark part or all of this invoice as uncollectible.
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
              value={writeOffForm.amount}
              onChange={(e) => setWriteOffForm({ ...writeOffForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Reason
            </label>
            <textarea
              value={writeOffForm.reason}
              onChange={(e) => setWriteOffForm({ ...writeOffForm, reason: e.target.value })}
              rows={2}
              placeholder="Why is this being written off?"
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowWriteOffModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Writing off...' : 'Write Off'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
