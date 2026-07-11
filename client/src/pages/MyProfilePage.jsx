import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';

const LEAVE_TYPES = {
  sick: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  personal: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  vacation: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  maternity: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const LEAVE_STATUSES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const REVIEW_STATUSES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  acknowledged: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
};

const RATINGS = {
  excellent: { label: 'Excellent', icon: '⭐', color: 'text-green-600' },
  good: { label: 'Good', icon: '👍', color: 'text-blue-600' },
  satisfactory: { label: 'Satisfactory', icon: '👌', color: 'text-amber-600' },
  needs_improvement: { label: 'Needs Improvement', icon: '📈', color: 'text-orange-600' },
  unsatisfactory: { label: 'Unsatisfactory', icon: '⚠️', color: 'text-red-600' },
};

const CONTRACT_STATUSES = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  terminated: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  renewed: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
};

export default function MyProfilePage() {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [contract, setContract] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [training, setTraining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '' });

  const fetchProfile = () => {
    setLoading(true);
    api
      .get('/hr/my/profile')
      .then((r) => {
        setProfile(r.data.profile);
        setContract(r.data.contract);
        setLeaveBalance(r.data.leaveBalance);
        setForm({
          phone: r.data.profile.phone || '',
          address: r.data.profile.address || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  };

  const fetchLeaves = () => {
    api
      .get('/hr/my/leaves')
      .then((r) => setLeaves(r.data.leaves))
      .catch(() => {});
  };

  const fetchContracts = () => {
    api
      .get('/hr/my/contracts')
      .then((r) => setContracts(r.data.contracts))
      .catch(() => {});
  };

  const fetchReviews = () => {
    api
      .get('/hr/reviews/my/list')
      .then((r) => setReviews(r.data.reviews))
      .catch(() => {});
  };

  const fetchTraining = () => {
    api
      .get('/training/my')
      .then((r) => setTraining(r.data.assignments))
      .catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
    fetchLeaves();
    fetchContracts();
    fetchReviews();
    fetchTraining();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/hr/my/profile', form);
      toast.success('Profile updated');
      setEditing(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
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

  const formatSalary = (amount) => {
    if (!amount) return '—';
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">My Profile</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'profile', label: '👤 Profile' },
          { key: 'contracts', label: '📋 Contracts' },
          { key: 'leaves', label: '🏖️ Leaves' },
          { key: 'reviews', label: '⭐ Reviews' },
          { key: 'training', label: '📚 Training' },
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

      {/* Profile Tab */}
      {tab === 'profile' && profile && (
        <div className="space-y-6">
          {/* Leave Balance Card */}
          {leaveBalance && (
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-medium opacity-80">Leave Balance (This Year)</h3>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-4xl font-extrabold">
                  {leaveBalance.allowed - leaveBalance.used}
                </span>
                <span className="text-sm opacity-80 mb-1">
                  days remaining ({leaveBalance.used} used / {leaveBalance.allowed} allowed)
                </span>
              </div>
              <div className="mt-3 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{
                    width: `${Math.min((leaveBalance.used / leaveBalance.allowed) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Profile Info */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                Personal Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Name', value: profile.name },
                  { label: 'Email', value: profile.email },
                  { label: 'Role', value: profile.role },
                  { label: 'Teacher ID', value: profile.teacher_id },
                  { label: 'Phone', value: profile.phone || profile.user_phone },
                  { label: 'Address', value: profile.address },
                  { label: 'Qualification', value: profile.qualification },
                  { label: 'Specialization', value: profile.specialization },
                  { label: 'Hire Date', value: formatDate(profile.hire_date) },
                  { label: 'Status', value: profile.employment_status },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-purple-500 dark:text-purple-400">{item.label}</p>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      {item.value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Contract */}
          {contract && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
                Active Contract
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Type', value: contract.contract_type },
                  { label: 'Position', value: contract.position },
                  { label: 'Department', value: contract.department },
                  { label: 'Salary', value: formatSalary(contract.salary) },
                  { label: 'Start Date', value: formatDate(contract.start_date) },
                  { label: 'End Date', value: formatDate(contract.end_date) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-purple-500 dark:text-purple-400">{item.label}</p>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100 capitalize">
                      {item.value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contracts Tab */}
      {tab === 'contracts' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Position</th>
                    <th className="px-4 py-3 font-medium">Start</th>
                    <th className="px-4 py-3 font-medium">End</th>
                    <th className="px-4 py-3 font-medium">Salary</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 capitalize text-purple-900 dark:text-purple-100">
                        {c.contract_type}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {c.position || '—'}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(c.start_date)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(c.end_date)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatSalary(c.salary)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONTRACT_STATUSES[c.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-purple-500">No contract history</p>
            </div>
          )}
        </div>
      )}

      {/* Leaves Tab */}
      {tab === 'leaves' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">To</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_TYPES[l.leave_type] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {l.leave_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(l.start_date)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(l.end_date)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400 max-w-[200px] truncate">
                        {l.reason || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEAVE_STATUSES[l.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {l.approved_by_name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-purple-500">No leave requests yet</p>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length > 0 ? (
            reviews.map((r) => {
              const rating = RATINGS[r.rating];
              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100 capitalize">
                          {r.review_type?.replace('_', ' ')} Review
                        </span>
                        {r.rating && (
                          <span className={`text-sm ${rating?.color}`}>
                            {rating?.icon} {rating?.label}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_STATUSES[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      {r.review_period && (
                        <p className="text-xs text-purple-500 mt-1">Period: {r.review_period}</p>
                      )}
                    </div>
                    <p className="text-xs text-purple-400">{formatDate(r.review_date)}</p>
                  </div>
                  {r.strengths && (
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                      <span className="font-medium">Strengths:</span> {r.strengths}
                    </p>
                  )}
                  {r.areas_for_improvement && (
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      <span className="font-medium">Areas to improve:</span>{' '}
                      {r.areas_for_improvement}
                    </p>
                  )}
                  <p className="text-xs text-purple-400 mt-2">By {r.reviewer_name || 'Unknown'}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No performance reviews yet</p>
            </div>
          )}
        </div>
      )}

      {/* Training Tab */}
      {tab === 'training' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {training.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">Program</th>
                    <th className="px-4 py-3 font-medium">Trainer</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {training.map((t) => (
                    <tr key={t.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                        {t.program_title}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {t.trainer || '—'}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(t.start_date)} — {formatDate(t.end_date)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {t.location || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            t.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                              : t.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {t.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-purple-500">No training assignments yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
