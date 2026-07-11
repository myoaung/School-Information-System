import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const PERIODS = ['annual', 'quarterly', 'monthly'];

const EXPENSE_CATEGORIES = [
  'salary',
  'supplies',
  'maintenance',
  'utilities',
  'transport',
  'events',
  'other',
  'infrastructure',
  'technology',
  'professional_development',
];

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: '',
    description: '',
    allocated_amount: '',
    period: 'annual',
    period_start: '',
    period_end: '',
  });

  const fetchBudgets = () => {
    setLoading(true);
    api
      .get('/budgeting')
      .then((r) => setBudgets(r.data.budgets))
      .catch(() => toast.error('Failed to load budgets'))
      .finally(() => setLoading(false));
  };

  const fetchSummary = () => {
    api
      .get('/budgeting/summary')
      .then((r) => setSummary(r.data))
      .catch(() => {});
  };

  const fetchCategories = () => {
    api
      .get('/budgeting/categories')
      .then((r) => setCategories(r.data.categories))
      .catch(() => {});
  };

  useEffect(() => {
    fetchBudgets();
    fetchSummary();
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      category: '',
      description: '',
      allocated_amount: '',
      period: 'annual',
      period_start: '',
      period_end: '',
    });
    setShowModal(true);
  };

  const openEdit = (budget) => {
    setEditing(budget);
    setForm({
      category: budget.category,
      description: budget.description || '',
      allocated_amount: budget.allocated_amount,
      period: budget.period || 'annual',
      period_start: budget.period_start || '',
      period_end: budget.period_end || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        allocated_amount: parseFloat(form.allocated_amount) || 0,
      };
      if (editing) {
        await api.put(`/budgeting/${editing.id}`, data);
        toast.success('Budget updated');
      } else {
        await api.post('/budgeting', data);
        toast.success('Budget created');
      }
      setShowModal(false);
      fetchBudgets();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget entry?')) return;
    try {
      await api.delete(`/budgeting/${id}`);
      toast.success('Budget deleted');
      fetchBudgets();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUtilizationColor = (pct) => {
    if (pct > 100) return 'bg-red-500';
    if (pct > 85) return 'bg-amber-500';
    if (pct > 60) return 'bg-blue-500';
    return 'bg-green-500';
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
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Budgeting
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-700 transition-colors cursor-pointer"
        >
          + New Budget
        </button>
      </div>

      {/* Overall Summary */}
      {summary && summary.totals && (
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white mb-8">
          <h2 className="text-lg font-bold mb-3">Overall Budget Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-80">Total Allocated</p>
              <p className="text-2xl font-bold">{formatMoney(summary.totals.allocated)} MMK</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Spent</p>
              <p className="text-2xl font-bold">{formatMoney(summary.totals.spent)} MMK</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Remaining</p>
              <p className="text-2xl font-bold">{formatMoney(summary.totals.remaining)} MMK</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Utilization</p>
              <p className="text-2xl font-bold">{summary.totals.utilization}%</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-3">
            <div
              className={`rounded-full h-3 transition-all ${getUtilizationColor(summary.totals.utilization)}`}
              style={{ width: `${Math.min(summary.totals.utilization, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && summary.summary && summary.summary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {summary.summary.map((s) => (
            <div key={s.category} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-purple-900 dark:text-purple-100 capitalize">
                  {s.category?.replace('_', ' ')}
                </h3>
                <span
                  className={`text-xs font-medium ${
                    s.utilization > 100
                      ? 'text-red-600'
                      : s.utilization > 85
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }`}
                >
                  {s.utilization}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-purple-500 mb-1">
                <span>Spent: {formatMoney(s.spent)}</span>
                <span>Budget: {formatMoney(s.allocated)}</span>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full h-2">
                <div
                  className={`rounded-full h-2 transition-all ${getUtilizationColor(s.utilization)}`}
                  style={{ width: `${Math.min(s.utilization, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
        {budgets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Allocated</th>
                  <th className="px-4 py-3 font-medium">Spent</th>
                  <th className="px-4 py-3 font-medium">Remaining</th>
                  <th className="px-4 py-3 font-medium">Utilization</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100 capitalize">
                      {b.category?.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400 capitalize">
                      {b.period}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400 text-xs">
                      {b.period_start && b.period_end ? `${b.period_start} — ${b.period_end}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {formatMoney(b.allocated_amount)}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {formatMoney(b.spent_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${
                          b.remaining < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatMoney(b.remaining)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-purple-100 dark:bg-purple-900 rounded-full h-2">
                          <div
                            className={`rounded-full h-2 ${getUtilizationColor(b.utilization)}`}
                            style={{ width: `${Math.min(b.utilization, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-purple-500">{b.utilization}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(b)}
                          className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">
              No Budgets Yet
            </p>
            <p className="text-purple-500 mb-4">
              Create your first budget to start tracking spending.
            </p>
            <button
              onClick={openCreate}
              className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-700 cursor-pointer"
            >
              + New Budget
            </button>
          </div>
        )}
      </div>

      {/* Budget Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Budget' : 'New Budget'}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Category *
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Allocated Amount (MMK) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={form.allocated_amount}
              onChange={(e) => setForm({ ...form, allocated_amount: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Period
              </label>
              <select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
