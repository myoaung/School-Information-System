import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const CATEGORIES = [
  {
    value: 'salary',
    label: 'Salary',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    icon: '👤',
  },
  {
    value: 'supplies',
    label: 'Supplies',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    icon: '📦',
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    icon: '🔧',
  },
  {
    value: 'utilities',
    label: 'Utilities',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    icon: '💡',
  },
  {
    value: 'transport',
    label: 'Transport',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    icon: '🚌',
  },
  {
    value: 'events',
    label: 'Events',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
    icon: '🎉',
  },
  {
    value: 'other',
    label: 'Other',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: '📋',
  },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

export default function ExpensePage() {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: 'supplies',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    paid_to: '',
    payment_method: 'cash',
    notes: '',
  });

  const fetchExpenses = () => {
    setLoading(true);
    const params = {};
    if (categoryFilter) params.category = categoryFilter;
    if (statusFilter) params.status = statusFilter;
    api
      .get('/expenses', { params })
      .then((r) => setExpenses(r.data.expenses))
      .catch(() => toast.error('Failed to load expenses'))
      .finally(() => setLoading(false));
  };

  const fetchSummary = () => {
    api
      .get('/expenses/summary/financial')
      .then((r) => setSummary(r.data.summary))
      .catch(() => {});
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [categoryFilter, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/expenses', form);
      toast.success('Expense created');
      setShowCreateModal(false);
      setForm({
        category: 'supplies',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        paid_to: '',
        payment_method: 'cash',
        notes: '',
      });
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/expenses/${id}/approve`);
      toast.success('Expense approved');
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/expenses/${id}/reject`);
      toast.success('Expense rejected');
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteId}`);
      setDeleteId(null);
      toast.success('Expense deleted');
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const formatAmount = (amount) => {
    return (
      new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(
        amount
      ) + ' MMK'
    );
  };

  const formatDate = (dateStr) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Expenses</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Expense
          </button>
        )}
      </div>

      {/* Financial Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Income',
              value: formatAmount(summary.totalIncome),
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: 'Total Expenses',
              value: formatAmount(summary.totalExpenses),
              color: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'Balance',
              value: formatAmount(summary.balance),
              color:
                summary.balance >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
            },
            {
              label: 'Pending',
              value: formatAmount(summary.pendingExpenses),
              color: 'text-amber-600 dark:text-amber-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      {summary?.byCategory?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
            Expenses by Category
          </h2>
          <div className="space-y-3">
            {summary.byCategory.map((cat) => {
              const catInfo = CATEGORIES.find((c) => c.value === cat.category);
              const percentage =
                summary.totalExpenses > 0 ? (cat.total / summary.totalExpenses) * 100 : 0;
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-xl">{catInfo?.icon || '📋'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-purple-900 dark:text-purple-100">
                        {catInfo?.label || cat.category}
                      </span>
                      <span className="text-purple-500">{formatAmount(cat.total)}</span>
                    </div>
                    <div className="w-full bg-purple-100 dark:bg-purple-900/50 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs text-purple-400 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 border border-purple-200 dark:border-purple-800 rounded-xl text-sm bg-white dark:bg-gray-800 cursor-pointer"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-purple-200 dark:border-purple-800 rounded-xl text-sm bg-white dark:bg-gray-800 cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Expense List */}
      {expenses.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isAdmin && <th className="px-4 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {expenses.map((expense) => {
                  const cat = CATEGORIES.find((c) => c.value === expense.category);
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-purple-50/50 cursor-pointer"
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{cat?.icon || '📋'}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color || 'bg-gray-100 text-gray-700'}`}
                          >
                            {cat?.label || expense.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-purple-900 dark:text-purple-100 max-w-[200px] truncate">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 font-medium text-red-600 dark:text-red-400">
                        {formatAmount(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-4 py-3 text-purple-500 capitalize text-xs">
                        {expense.payment_method?.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[expense.status]}`}
                        >
                          {expense.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {expense.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(expense.id)}
                                className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(expense.id)}
                                className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {expense.status !== 'pending' && (
                            <button
                              onClick={() => setDeleteId(expense.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
          <p className="text-purple-500">No expenses found</p>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Expense">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Amount (MMK)
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Payment Method
              </label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Paid To
            </label>
            <input
              type="text"
              value={form.paid_to}
              onChange={(e) => setForm({ ...form, paid_to: e.target.value })}
              placeholder="Vendor or person"
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Expense Details"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Category:</span>
                <p>{CATEGORIES.find((c) => c.value === selectedExpense.category)?.label}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Amount:</span>
                <p className="font-bold text-red-600 dark:text-red-400">
                  {formatAmount(selectedExpense.amount)}
                </p>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Date:</span>
                <p>{formatDate(selectedExpense.expense_date)}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Method:</span>
                <p className="capitalize">{selectedExpense.payment_method?.replace('_', ' ')}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  Description:
                </span>
                <p>{selectedExpense.description}</p>
              </div>
              {selectedExpense.paid_to && (
                <div className="col-span-2">
                  <span className="font-medium text-purple-600 dark:text-purple-400">Paid To:</span>
                  <p>{selectedExpense.paid_to}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Status:</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedExpense.status]}`}
                >
                  {selectedExpense.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  Created By:
                </span>
                <p>{selectedExpense.created_by_name}</p>
              </div>
            </div>
            {selectedExpense.notes && (
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400 text-sm">
                  Notes:
                </span>
                <p className="text-sm mt-1">{selectedExpense.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense">
        <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
          Are you sure you want to delete this expense?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
