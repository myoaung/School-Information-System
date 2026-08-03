import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const CONTRACT_TYPES = [
  {
    value: 'permanent',
    label: 'Permanent',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    icon: '🏛️',
  },
  {
    value: 'temporary',
    label: 'Temporary',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    icon: '⏳',
  },
  {
    value: 'probation',
    label: 'Probation',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    icon: '🔍',
  },
  {
    value: 'contract',
    label: 'Contract',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    icon: '📄',
  },
  {
    value: 'intern',
    label: 'Intern',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: '🎓',
  },
];

const CONTRACT_STATUSES = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  terminated: {
    label: 'Terminated',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  renewed: {
    label: 'Renewed',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
};

const DEPARTMENTS = [
  'Administration',
  'Academic',
  'Science',
  'Mathematics',
  'Languages',
  'Arts',
  'Sports',
  'Finance',
  'IT',
  'HR',
];

export default function ContractsPage() {
  const [tab, setTab] = useState('all');
  const [contracts, setContracts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // create, edit, renew, terminate
  const [selectedContract, setSelectedContract] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ status: '', contract_type: '', search: '' });

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.contract_type) params.contract_type = filters.contract_type;
    if (filters.search) params.search = filters.search;

    Promise.all([
      api.get('/hr/contracts', { params }).then((r) => setContracts(r.data.contracts)),
      api.get('/hr/contracts/stats').then((r) => setStats(r.data.stats)),
      api.get('/hr/staff').then((r) => setStaff(r.data.staff)),
    ])
      .catch(() => toast.error('Failed to load contracts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const openCreateModal = () => {
    setModalType('create');
    setSelectedContract(null);
    setForm({
      staff_id: '',
      contract_type: 'permanent',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      salary: '',
      position: '',
      department: '',
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (contract) => {
    setModalType('edit');
    setSelectedContract(contract);
    setForm({
      contract_type: contract.contract_type,
      start_date: contract.start_date,
      end_date: contract.end_date || '',
      salary: contract.salary || '',
      position: contract.position || '',
      department: contract.department || '',
      status: contract.status,
      notes: contract.notes || '',
    });
    setShowModal(true);
  };

  const openRenewModal = (contract) => {
    setModalType('renew');
    setSelectedContract(contract);
    setForm({
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      salary: contract.salary || '',
      position: contract.position || '',
      department: contract.department || '',
      notes: '',
    });
    setShowModal(true);
  };

  const openTerminateModal = (contract) => {
    setModalType('terminate');
    setSelectedContract(contract);
    setForm({ notes: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === 'create') {
        await api.post('/hr/contracts', form);
        toast.success('Contract created');
      } else if (modalType === 'edit') {
        await api.put(`/hr/contracts/${selectedContract.id}`, form);
        toast.success('Contract updated');
      } else if (modalType === 'renew') {
        await api.put(`/hr/contracts/${selectedContract.id}/renew`, form);
        toast.success('Contract renewed');
      } else if (modalType === 'terminate') {
        await api.put(`/hr/contracts/${selectedContract.id}/terminate`, form);
        toast.success('Contract terminated');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contract) => {
    if (!confirm(`Delete contract for ${contract.staff_name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/hr/contracts/${contract.id}`);
      toast.success('Contract deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const formatSalary = (amount) => {
    if (!amount) return '—';
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

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryColor = (days) => {
    if (days === null) return 'text-purple-400';
    if (days <= 0) return 'text-red-600 dark:text-red-400';
    if (days <= 7) return 'text-red-600 dark:text-red-400';
    if (days <= 30) return 'text-amber-600 dark:text-amber-400';
    if (days <= 90) return 'text-blue-600 dark:text-blue-400';
    return 'text-green-600 dark:text-green-400';
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
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
              Contracts
            </h1>
            <p className="text-sm text-purple-500 dark:text-purple-400">
              Manage staff contracts, renewals, and expirations
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl shadow-md shadow-purple-200 dark:shadow-purple-900/30 transition-all hover:shadow-lg cursor-pointer"
        >
          + New Contract
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            {
              label: 'Total',
              value: stats.total,
              color: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-50 dark:bg-purple-950/30',
            },
            {
              label: 'Active',
              value: stats.active,
              color: 'text-green-600 dark:text-green-400',
              bg: 'bg-green-50 dark:bg-green-950/30',
            },
            {
              label: 'Expiring Soon',
              value: stats.expiring,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-950/30',
            },
            {
              label: 'Expired',
              value: stats.expired,
              color: 'text-red-600 dark:text-red-400',
              bg: 'bg-red-50 dark:bg-red-950/30',
            },
            {
              label: 'Renewed',
              value: stats.renewed,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-950/30',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-xl p-4 border border-purple-100 dark:border-purple-900/50`}
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search staff, position, department..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="flex-1 min-w-[200px] px-4 py-2 border border-purple-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-purple-900 dark:text-purple-100 cursor-pointer"
        >
          <option value="">All Statuses</option>
          {Object.entries(CONTRACT_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
        <select
          value={filters.contract_type}
          onChange={(e) => setFilters({ ...filters, contract_type: e.target.value })}
          className="px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-purple-900 dark:text-purple-100 cursor-pointer"
        >
          <option value="">All Types</option>
          {CONTRACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: '📋 All Contracts' },
          { key: 'active', label: '✅ Active' },
          { key: 'expiring', label: '⏰ Expiring Soon' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
              tab === t.key
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Start</th>
                <th className="px-4 py-3 font-medium">End</th>
                <th className="px-4 py-3 font-medium">Salary</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
              {(() => {
                let filtered = contracts;
                if (tab === 'active') filtered = filtered.filter((c) => c.status === 'active');
                if (tab === 'expiring') {
                  filtered = filtered.filter((c) => {
                    if (c.status !== 'active' || !c.end_date) return false;
                    const days = getDaysUntilExpiry(c.end_date);
                    return days !== null && days <= 90;
                  });
                }

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <p className="text-purple-400 dark:text-purple-500">No contracts found</p>
                      </td>
                    </tr>
                  );
                }

                return filtered.map((c) => {
                  const type = CONTRACT_TYPES.find((t) => t.value === c.contract_type);
                  const status = CONTRACT_STATUSES[c.status] || CONTRACT_STATUSES.active;
                  const days = getDaysUntilExpiry(c.end_date);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-purple-900 dark:text-purple-100">
                          {c.staff_name}
                        </p>
                        <p className="text-xs text-purple-500 dark:text-purple-400">
                          {c.staff_email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${type?.color}`}
                        >
                          {type?.icon} {type?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {c.position || '—'}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {c.department || '—'}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400 text-xs">
                        {formatDate(c.start_date)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={getExpiryColor(days)}>
                          {formatDate(c.end_date)}
                          {days !== null && c.status === 'active' && (
                            <span className="block text-[10px] mt-0.5">
                              {days <= 0 ? 'Expired' : `${days}d left`}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400 font-medium">
                        {formatSalary(c.salary)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 font-medium cursor-pointer"
                          >
                            Edit
                          </button>
                          {c.status === 'active' && (
                            <button
                              onClick={() => openRenewModal(c)}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium cursor-pointer"
                            >
                              Renew
                            </button>
                          )}
                          {c.status === 'active' && (
                            <button
                              onClick={() => openTerminateModal(c)}
                              className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 font-medium cursor-pointer"
                            >
                              End
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'create'
            ? 'New Contract'
            : modalType === 'edit'
              ? `Edit Contract: ${selectedContract?.staff_name}`
              : modalType === 'renew'
                ? `Renew Contract: ${selectedContract?.staff_name}`
                : `Terminate Contract: ${selectedContract?.staff_name}`
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Staff Selection (create only) */}
          {modalType === 'create' && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Staff Member *
              </label>
              <select
                required
                value={form.staff_id || ''}
                onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
              >
                <option value="">Select staff member</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Contract Type */}
          {(modalType === 'create' || modalType === 'edit') && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Contract Type *
              </label>
              <select
                required
                value={form.contract_type || 'permanent'}
                onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
              >
                {CONTRACT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status (edit only) */}
          {modalType === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Status
              </label>
              <select
                value={form.status || 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
              >
                {Object.entries(CONTRACT_STATUSES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={form.start_date || ''}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                End Date {modalType === 'create' ? '' : '(blank = no expiry)'}
              </label>
              <input
                type="date"
                value={form.end_date || ''}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
              />
            </div>
          </div>

          {/* Salary & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Salary (MMK)
              </label>
              <input
                type="number"
                min="0"
                value={form.salary || ''}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="e.g. 500000"
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Position
              </label>
              <input
                type="text"
                value={form.position || ''}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Senior Teacher"
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Department
            </label>
            <select
              value={form.department || ''}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
            >
              <option value="">No department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes about this contract..."
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 resize-none"
            />
          </div>

          {/* Terminate Warning */}
          {modalType === 'terminate' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                ⚠️ This will mark the contract as <strong>terminated</strong>. This action can be
                reversed by editing the contract status.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            {modalType === 'terminate' ? (
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Terminating...' : 'Terminate Contract'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {saving
                  ? 'Saving...'
                  : modalType === 'create'
                    ? 'Create Contract'
                    : modalType === 'renew'
                      ? 'Renew Contract'
                      : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
