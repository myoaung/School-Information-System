import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const PAYSLIP_STATUSES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

export default function PayrollPage() {
  const [tab, setTab] = useState('structures');
  const [structures, setStructures] = useState([]);
  const [allowanceTypes, setAllowanceTypes] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/payroll/salary-structures').then((r) => setStructures(r.data.structures)),
      api.get('/payroll/allowance-types').then((r) => setAllowanceTypes(r.data.types)),
      api.get('/payroll/deduction-types').then((r) => setDeductionTypes(r.data.types)),
      api.get('/payroll/salary-assignments').then((r) => setAssignments(r.data.assignments)),
      api.get('/payroll/payslips').then((r) => setPayslips(r.data.payslips)),
      api.get('/hr/staff').then((r) => setStaff(r.data.staff)),
    ])
      .catch(() => toast.error('Failed to load payroll data'))
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
      if (modalType === 'structure') {
        if (form.id) {
          await api.put(`/payroll/salary-structures/${form.id}`, form);
        } else {
          await api.post('/payroll/salary-structures', form);
        }
      } else if (modalType === 'allowance') {
        await api.post('/payroll/allowance-types', form);
      } else if (modalType === 'deduction') {
        await api.post('/payroll/deduction-types', form);
      } else if (modalType === 'assignment') {
        await api.post('/payroll/salary-assignments', form);
      } else if (modalType === 'payslip') {
        await api.post('/payroll/payslips', form);
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

  const handlePayslipStatus = async (id, status) => {
    try {
      await api.put(`/payroll/payslips/${id}/status`, { status });
      toast.success(`Payslip ${status}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '—';
    return (
      new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(
        amount
      ) + ' MMK'
    );
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
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Payroll</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'structures', label: '💰 Salary Grades' },
          { key: 'allowances', label: '➕ Allowances' },
          { key: 'deductions', label: '➖ Deductions' },
          { key: 'assignments', label: '👤 Staff Salaries' },
          { key: 'payslips', label: '📄 Payslips' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${tab === t.key ? 'bg-green-600 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Salary Structures Tab */}
      {tab === 'structures' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('structure', {
                  grade_name: '',
                  min_salary: '',
                  max_salary: '',
                  description: '',
                })
              }
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer"
            >
              + New Grade
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Min Salary</th>
                  <th className="px-4 py-3 font-medium">Max Salary</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {s.grade_name}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {formatMoney(s.min_salary)}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {formatMoney(s.max_salary)}
                    </td>
                    <td className="px-4 py-3 text-purple-500">{s.description || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal('structure', s)}
                        className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Allowances Tab */}
      {tab === 'allowances' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('allowance', {
                  name: '',
                  description: '',
                  is_taxable: true,
                  is_fixed: true,
                })
              }
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer"
            >
              + New Allowance Type
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Taxable</th>
                  <th className="px-4 py-3 font-medium">Fixed</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {allowanceTypes.map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {a.name}
                    </td>
                    <td className="px-4 py-3">{a.is_taxable ? '✅' : '❌'}</td>
                    <td className="px-4 py-3">{a.is_fixed ? 'Fixed' : 'Variable'}</td>
                    <td className="px-4 py-3 text-purple-500">{a.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deductions Tab */}
      {tab === 'deductions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('deduction', { name: '', description: '', is_tax: false, is_fixed: true })
              }
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer"
            >
              + New Deduction Type
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Tax</th>
                  <th className="px-4 py-3 font-medium">Fixed</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {deductionTypes.map((d) => (
                  <tr key={d.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {d.name}
                    </td>
                    <td className="px-4 py-3">{d.is_tax ? '✅' : '❌'}</td>
                    <td className="px-4 py-3">{d.is_fixed ? 'Fixed' : 'Variable'}</td>
                    <td className="px-4 py-3 text-purple-500">{d.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('assignment', {
                  staff_id: '',
                  basic_salary: '',
                  effective_date: new Date().toISOString().split('T')[0],
                })
              }
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer"
            >
              + Assign Salary
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Basic Salary</th>
                  <th className="px-4 py-3 font-medium">Effective</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {a.staff_name}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {a.grade_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {formatMoney(a.basic_salary)}
                    </td>
                    <td className="px-4 py-3 text-purple-500">{a.effective_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslips Tab */}
      {tab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                openModal('payslip', {
                  staff_id: '',
                  pay_period: '',
                  pay_date: new Date().toISOString().split('T')[0],
                })
              }
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer"
            >
              + Generate Payslip
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Basic</th>
                  <th className="px-4 py-3 font-medium">Allowances</th>
                  <th className="px-4 py-3 font-medium">Deductions</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {payslips.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {p.staff_name}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {p.pay_period}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {formatMoney(p.basic_salary)}
                    </td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">
                      +{formatMoney(p.total_allowances)}
                    </td>
                    <td className="px-4 py-3 text-red-600 dark:text-red-400">
                      -{formatMoney(p.total_deductions)}
                    </td>
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {formatMoney(p.net_salary)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYSLIP_STATUSES[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {p.status === 'draft' && (
                        <button
                          onClick={() => handlePayslipStatus(p.id, 'approved')}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {p.status === 'approved' && (
                        <button
                          onClick={() => handlePayslipStatus(p.id, 'paid')}
                          className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
          modalType === 'structure'
            ? form.id
              ? 'Edit Salary Grade'
              : 'New Salary Grade'
            : modalType === 'allowance'
              ? 'New Allowance Type'
              : modalType === 'deduction'
                ? 'New Deduction Type'
                : modalType === 'assignment'
                  ? 'Assign Salary'
                  : 'Generate Payslip'
        }
      >
        <form onSubmit={handleSave} className="space-y-3">
          {modalType === 'structure' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Grade Name
                </label>
                <input
                  type="text"
                  required
                  value={form.grade_name || ''}
                  onChange={(e) => setForm({ ...form, grade_name: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Min Salary (MMK)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.min_salary || ''}
                    onChange={(e) => setForm({ ...form, min_salary: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Max Salary (MMK)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.max_salary || ''}
                    onChange={(e) => setForm({ ...form, max_salary: parseFloat(e.target.value) })}
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
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </>
          )}
          {modalType === 'allowance' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </>
          )}
          {modalType === 'deduction' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </>
          )}
          {modalType === 'assignment' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Staff
                </label>
                <select
                  required
                  value={form.staff_id || ''}
                  onChange={(e) => setForm({ ...form, staff_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
                >
                  <option value="">Select staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Basic Salary (MMK)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.basic_salary || ''}
                  onChange={(e) => setForm({ ...form, basic_salary: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  required
                  value={form.effective_date || ''}
                  onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
            </>
          )}
          {modalType === 'payslip' && (
            <>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Staff
                </label>
                <select
                  required
                  value={form.staff_id || ''}
                  onChange={(e) => setForm({ ...form, staff_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
                >
                  <option value="">Select staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Pay Period
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2026-07"
                  value={form.pay_period || ''}
                  onChange={(e) => setForm({ ...form, pay_period: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Pay Date
                </label>
                <input
                  type="date"
                  required
                  value={form.pay_date || ''}
                  onChange={(e) => setForm({ ...form, pay_date: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                />
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
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
