import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const REVIEW_TYPES = [
  {
    value: 'probation',
    label: 'Probation',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    value: 'annual',
    label: 'Annual',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'mid_year',
    label: 'Mid-Year',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
  {
    value: 'observation',
    label: 'Observation',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  {
    value: 'goal_setting',
    label: 'Goal Setting',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  },
  {
    value: 'other',
    label: 'Other',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
];

const RATINGS = [
  {
    value: 'excellent',
    label: 'Excellent',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    icon: '⭐',
  },
  {
    value: 'good',
    label: 'Good',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    icon: '👍',
  },
  {
    value: 'satisfactory',
    label: 'Satisfactory',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    icon: '👌',
  },
  {
    value: 'needs_improvement',
    label: 'Needs Improvement',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    icon: '📈',
  },
  {
    value: 'unsatisfactory',
    label: 'Unsatisfactory',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    icon: '⚠️',
  },
];

const REVIEW_STATUSES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  acknowledged: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
};

const CONTRACT_TYPES = [
  {
    value: 'permanent',
    label: 'Permanent',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  {
    value: 'temporary',
    label: 'Temporary',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'probation',
    label: 'Probation',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    value: 'contract',
    label: 'Contract',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
  {
    value: 'intern',
    label: 'Intern',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
];

const CONTRACT_STATUSES = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  terminated: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  renewed: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
};

export default function HRPage() {
  const [tab, setTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    staff_id: '',
    review_type: 'annual',
    review_period: '',
    rating: '',
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    development_plan: '',
    comments: '',
    review_date: new Date().toISOString().split('T')[0],
    next_review_date: '',
  });
  const [form, setForm] = useState({
    contract_type: 'permanent',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    salary: '',
    position: '',
    department: '',
    notes: '',
  });

  const fetchStaff = () => {
    setLoading(true);
    api
      .get('/hr/staff')
      .then((r) => setStaff(r.data.staff))
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api
      .get('/hr/stats')
      .then((r) => setStats(r.data.stats))
      .catch(() => {});
  };

  const fetchExpiring = () => {
    api
      .get('/hr/contracts/expiring?days=90')
      .then((r) => setExpiring(r.data.contracts))
      .catch(() => {});
  };

  const fetchReviews = () => {
    api
      .get('/hr/reviews')
      .then((r) => setReviews(r.data.reviews))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStaff();
    fetchStats();
    fetchExpiring();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (tab === 'reviews') fetchReviews();
  }, [tab]);

  const openContractModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setForm({
      contract_type: 'permanent',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      salary: '',
      position: staffMember.specialization || '',
      department: '',
      notes: '',
    });
    setShowContractModal(true);
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/hr/contracts', {
        staff_id: selectedStaff.id,
        ...form,
      });
      setShowContractModal(false);
      toast.success('Contract created');
      fetchStaff();
      fetchStats();
      fetchExpiring();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create contract');
    } finally {
      setSaving(false);
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

  const openReviewModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setReviewForm({
      staff_id: staffMember.id,
      review_type: 'annual',
      review_period: '',
      rating: '',
      strengths: '',
      areas_for_improvement: '',
      goals: '',
      development_plan: '',
      comments: '',
      review_date: new Date().toISOString().split('T')[0],
      next_review_date: '',
    });
    setShowReviewModal(true);
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/hr/reviews', reviewForm);
      setShowReviewModal(false);
      toast.success('Review created');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create review');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async (id) => {
    try {
      await api.put(`/hr/reviews/${id}/submit`);
      toast.success('Review submitted');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    }
  };

  const handleAcknowledgeReview = async (id) => {
    try {
      await api.put(`/hr/reviews/${id}/acknowledge`);
      toast.success('Review acknowledged');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to acknowledge');
    }
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
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Human Resources
          </h1>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Staff',
              value: stats.totalStaff,
              color: 'text-cyan-600 dark:text-cyan-400',
            },
            {
              label: 'Active Contracts',
              value: stats.activeContracts,
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: 'Expiring (90 days)',
              value: stats.expiringContracts,
              color: 'text-amber-600 dark:text-amber-400',
            },
            {
              label: 'Pending Leaves',
              value: stats.pendingLeaves,
              color: 'text-purple-600 dark:text-purple-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'staff', label: '👥 Staff' },
          { key: 'contracts', label: '📋 Contracts' },
          { key: 'expiring', label: '⏰ Expiring' },
          { key: 'reviews', label: '⭐ Reviews' },
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

      {/* Staff Tab */}
      {tab === 'staff' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Contract</th>
                  <th className="px-4 py-3 font-medium">Salary</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {staff.map((s) => {
                  const contractType = CONTRACT_TYPES.find((c) => c.value === s.contract_type);
                  return (
                    <tr key={s.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-purple-900 dark:text-purple-100">{s.name}</p>
                        <p className="text-xs text-purple-500">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-purple-600 dark:text-purple-400">
                        {s.role}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {s.position || s.specialization || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {s.contract_type ? (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${contractType?.color || 'bg-gray-100 text-gray-700'}`}
                          >
                            {contractType?.label || s.contract_type}
                          </span>
                        ) : (
                          <span className="text-xs text-purple-400">No contract</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatSalary(s.salary)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openContractModal(s)}
                          className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                        >
                          {s.contract_type ? 'New Contract' : 'Add Contract'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contracts Tab */}
      {tab === 'contracts' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Start</th>
                  <th className="px-4 py-3 font-medium">End</th>
                  <th className="px-4 py-3 font-medium">Salary</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {staff
                  .filter((s) => s.contract_id)
                  .map((s) => {
                    const contractType = CONTRACT_TYPES.find((c) => c.value === s.contract_type);
                    return (
                      <tr key={s.contract_id} className="hover:bg-purple-50/50">
                        <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                          {s.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${contractType?.color}`}
                          >
                            {contractType?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {formatDate(s.contract_start)}
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {formatDate(s.contract_end)}
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {formatSalary(s.salary)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONTRACT_STATUSES[s.contract_status] || 'bg-gray-100 text-gray-700'}`}
                          >
                            {s.contract_status}
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

      {/* Expiring Tab */}
      {tab === 'expiring' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {expiring.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">End Date</th>
                    <th className="px-4 py-3 font-medium">Days Left</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {expiring.map((c) => {
                    const contractType = CONTRACT_TYPES.find((ct) => ct.value === c.contract_type);
                    const daysLeft = Math.ceil(
                      (new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={c.id} className="hover:bg-purple-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-purple-900 dark:text-purple-100">
                            {c.staff_name}
                          </p>
                          <p className="text-xs text-purple-500">{c.staff_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${contractType?.color}`}
                          >
                            {contractType?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {formatDate(c.end_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${daysLeft <= 7 ? 'text-red-600 dark:text-red-400' : daysLeft <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}
                          >
                            {daysLeft} days
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              openContractModal({
                                id: c.staff_id,
                                name: c.staff_name,
                                specialization: '',
                              })
                            }
                            className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                          >
                            Renew
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-purple-500">No contracts expiring in the next 90 days</p>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openReviewModal({ id: '', name: 'Select Staff' })}
              className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-700 transition-colors cursor-pointer"
            >
              + New Review
            </button>
          </div>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r) => {
                const reviewType = REVIEW_TYPES.find((t) => t.value === r.review_type);
                const rating = RATINGS.find((rt) => rt.value === r.rating);
                return (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-purple-900 dark:text-purple-100">
                          {r.staff_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${reviewType?.color}`}
                          >
                            {reviewType?.label}
                          </span>
                          {r.rating && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${rating?.color}`}
                            >
                              {rating?.icon} {rating?.label}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_STATUSES[r.status]}`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {r.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitReview(r.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          >
                            Submit
                          </button>
                        )}
                        {r.status === 'submitted' && (
                          <button
                            onClick={() => handleAcknowledgeReview(r.id)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                    {r.review_period && (
                      <p className="text-xs text-purple-500 mt-2">Period: {r.review_period}</p>
                    )}
                    {r.strengths && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 line-clamp-2">
                        <span className="font-medium">Strengths:</span> {r.strengths}
                      </p>
                    )}
                    <p className="text-xs text-purple-400 mt-2">
                      By {r.reviewer_name || 'Unknown'} ·{' '}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No performance reviews yet</p>
            </div>
          )}
        </div>
      )}

      {/* Contract Modal */}
      <Modal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        title={`New Contract: ${selectedStaff?.name}`}
      >
        <form onSubmit={handleCreateContract} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Contract Type
            </label>
            <select
              value={form.contract_type}
              onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              {CONTRACT_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Salary (MMK)
              </label>
              <input
                type="number"
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Position
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
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
              onClick={() => setShowContractModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Contract'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`New Review: ${selectedStaff?.name}`}
      >
        <form onSubmit={handleCreateReview} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Review Type
              </label>
              <select
                value={reviewForm.review_type}
                onChange={(e) => setReviewForm({ ...reviewForm, review_type: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {REVIEW_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Rating
              </label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                <option value="">Select rating</option>
                {RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Review Period
              </label>
              <input
                type="text"
                value={reviewForm.review_period}
                onChange={(e) => setReviewForm({ ...reviewForm, review_period: e.target.value })}
                placeholder="e.g., 2026 Q1"
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Review Date
              </label>
              <input
                type="date"
                value={reviewForm.review_date}
                onChange={(e) => setReviewForm({ ...reviewForm, review_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Strengths
            </label>
            <textarea
              value={reviewForm.strengths}
              onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Areas for Improvement
            </label>
            <textarea
              value={reviewForm.areas_for_improvement}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, areas_for_improvement: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Goals
            </label>
            <textarea
              value={reviewForm.goals}
              onChange={(e) => setReviewForm({ ...reviewForm, goals: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
