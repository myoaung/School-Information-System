import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const VACANCY_TYPES = [
  {
    value: 'full_time',
    label: 'Full Time',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  {
    value: 'part_time',
    label: 'Part Time',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'contract',
    label: 'Contract',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
  {
    value: 'intern',
    label: 'Intern',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
];

const VACANCY_STATUSES = {
  open: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  filled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const PRIORITIES = [
  {
    value: 'critical',
    label: 'Critical',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  {
    value: 'high',
    label: 'High',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  },
  {
    value: 'medium',
    label: 'Medium',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    value: 'low',
    label: 'Low',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
];

export default function WorkforcePage() {
  const [tab, setTab] = useState('overview');
  const [budgets, setBudgets] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/workforce/department-budgets').then((r) => setBudgets(r.data.budgets)),
      api.get('/workforce/vacancies').then((r) => setVacancies(r.data.vacancies)),
      api.get('/workforce/staffing-gaps').then((r) => setGaps(r.data.gaps)),
      api.get('/workforce/summary').then((r) => setSummary(r.data.summary)),
    ])
      .catch(() => toast.error('Failed to load workforce data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openModal = (type, data = {}) => {
    setModalType(type);
    setForm(data);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === 'budget') {
        if (form.id) {
          await api.put(`/workforce/department-budgets/${form.id}`, form);
        } else {
          await api.post('/workforce/department-budgets', form);
        }
      } else if (modalType === 'vacancy') {
        if (form.id) {
          await api.put(`/workforce/vacancies/${form.id}`, form);
        } else {
          await api.post('/workforce/vacancies', form);
        }
      } else if (modalType === 'gap') {
        if (form.id) {
          await api.put(`/workforce/staffing-gaps/${form.id}`, form);
        } else {
          await api.post('/workforce/staffing-gaps', form);
        }
      }
      toast.success('Saved successfully');
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleFillVacancy = async (id) => {
    try {
      await api.put(`/workforce/vacancies/${id}/fill`, {});
      toast.success('Vacancy marked as filled');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fill vacancy');
    }
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
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Workforce Planning
          </h1>
        </div>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Staff',
              value: summary.totalStaff,
              color: 'text-indigo-600 dark:text-indigo-400',
            },
            {
              label: 'Active Contracts',
              value: summary.activeContracts,
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: 'Open Vacancies',
              value: summary.openVacancies,
              color: 'text-amber-600 dark:text-amber-400',
            },
            { label: 'Staffing Gaps', value: gaps.length, color: 'text-red-600 dark:text-red-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'budgets', label: '💼 Dept Budgets' },
          { key: 'vacancies', label: '📢 Vacancies' },
          { key: 'gaps', label: '⚠️ Staffing Gaps' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              By Department
            </h3>
            {summary.byDepartment.length > 0 ? (
              <div className="space-y-3">
                {summary.byDepartment.map((d) => (
                  <div key={d.department} className="flex justify-between items-center">
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      {d.department}
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {d.count} staff
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-purple-500 text-sm">No department data</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              Gaps by Priority
            </h3>
            {summary.gapsByPriority.length > 0 ? (
              <div className="space-y-3">
                {summary.gapsByPriority.map((g) => {
                  const p = PRIORITIES.find((pr) => pr.value === g.priority);
                  return (
                    <div key={g.priority} className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p?.color}`}>
                        {p?.label}
                      </span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {g.count} gaps
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-purple-500 text-sm">No staffing gaps recorded</p>
            )}
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {tab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('budget', {
                  department: '',
                  academic_year: new Date().getFullYear().toString(),
                  budgeted_positions: '',
                  notes: '',
                })
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              + Add Budget
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Budgeted</th>
                  <th className="px-4 py-3 font-medium">Filled</th>
                  <th className="px-4 py-3 font-medium">Vacant</th>
                  <th className="px-4 py-3 font-medium">Fill Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {budgets.map((b) => {
                  const vacant = b.budgeted_positions - b.filled_positions;
                  const fillRate =
                    b.budgeted_positions > 0
                      ? Math.round((b.filled_positions / b.budgeted_positions) * 100)
                      : 0;
                  return (
                    <tr key={b.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                        {b.department}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {b.academic_year}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {b.budgeted_positions}
                      </td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">
                        {b.filled_positions}
                      </td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400">{vacant}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${fillRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-purple-500">{fillRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vacancies Tab */}
      {tab === 'vacancies' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('vacancy', {
                  title: '',
                  department: '',
                  position: '',
                  vacancy_type: 'full_time',
                  description: '',
                  requirements: '',
                  salary_range_min: '',
                  salary_range_max: '',
                  closing_date: '',
                })
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              + Post Vacancy
            </button>
          </div>
          <div className="space-y-3">
            {vacancies.length > 0 ? (
              vacancies.map((v) => {
                const vType = VACANCY_TYPES.find((t) => t.value === v.vacancy_type);
                return (
                  <div
                    key={v.id}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-purple-900 dark:text-purple-100">
                          {v.title}
                        </p>
                        <p className="text-sm text-purple-500">
                          {v.department} · {v.position}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${vType?.color}`}
                          >
                            {vType?.label}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${VACANCY_STATUSES[v.status]}`}
                          >
                            {v.status}
                          </span>
                          {v.salary_range_min && v.salary_range_max && (
                            <span className="text-xs text-purple-500">
                              {v.salary_range_min.toLocaleString()} -{' '}
                              {v.salary_range_max.toLocaleString()} MMK
                            </span>
                          )}
                        </div>
                      </div>
                      {v.status === 'open' && (
                        <button
                          onClick={() => handleFillVacancy(v.id)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                        >
                          Mark Filled
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
                <p className="text-purple-500">No vacancies posted</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gaps Tab */}
      {tab === 'gaps' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('gap', {
                  department: '',
                  academic_year: new Date().getFullYear().toString(),
                  required_count: '',
                  current_count: '',
                  priority: 'medium',
                  notes: '',
                })
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              + Record Gap
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Required</th>
                  <th className="px-4 py-3 font-medium">Current</th>
                  <th className="px-4 py-3 font-medium">Gap</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {gaps.map((g) => {
                  const p = PRIORITIES.find((pr) => pr.value === g.priority);
                  const gap = g.required_count - g.current_count;
                  return (
                    <tr key={g.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                        {g.department}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {g.academic_year}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {g.required_count}
                      </td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">
                        {g.current_count}
                      </td>
                      <td
                        className={`px-4 py-3 font-medium ${gap > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                      >
                        {gap > 0 ? `+${gap}` : gap}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${p?.color}`}
                        >
                          {p?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'budget'
            ? form.id
              ? 'Edit Department Budget'
              : 'Add Department Budget'
            : modalType === 'vacancy'
              ? form.id
                ? 'Edit Vacancy'
                : 'Post Vacancy'
              : 'Record Staffing Gap'
        }
      >
        <form onSubmit={handleSave} className="space-y-3">
          {modalType === 'budget' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={form.department || ''}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    required
                    value={form.academic_year || ''}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Budgeted Positions
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.budgeted_positions || ''}
                    onChange={(e) =>
                      setForm({ ...form, budgeted_positions: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </>
          )}
          {modalType === 'vacancy' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={form.department || ''}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    required
                    value={form.position || ''}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Type
                </label>
                <select
                  value={form.vacancy_type || 'full_time'}
                  onChange={(e) => setForm({ ...form, vacancy_type: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
                >
                  {VACANCY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Min Salary
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.salary_range_min || ''}
                    onChange={(e) =>
                      setForm({ ...form, salary_range_min: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Max Salary
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.salary_range_max || ''}
                    onChange={(e) =>
                      setForm({ ...form, salary_range_max: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
                />
              </div>
            </>
          )}
          {modalType === 'gap' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={form.department || ''}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    required
                    value={form.academic_year || ''}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Required
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.required_count || ''}
                    onChange={(e) => setForm({ ...form, required_count: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Current
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.current_count || ''}
                    onChange={(e) => setForm({ ...form, current_count: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority || 'medium'}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
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
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
