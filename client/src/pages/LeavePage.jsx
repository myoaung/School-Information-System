import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const LEAVE_TYPES = [
  {
    value: 'sick',
    label: 'Sick Leave',
    color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  },
  {
    value: 'personal',
    label: 'Personal',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'vacation',
    label: 'Vacation',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  {
    value: 'maternity',
    label: 'Maternity',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
  {
    value: 'other',
    label: 'Other',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
];

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

export default function LeavePage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const canManage = isAdmin || isTeacher;
  const [tab, setTab] = useState('my-leaves');
  const [leaves, setLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [adminNotes, setAdminNotes] = useState('');

  const fetchLeaves = () => {
    setLoading(true);
    api
      .get('/leaves')
      .then((r) => setLeaves(r.data.leaves))
      .catch(() => toast.error('Failed to load leave requests'))
      .finally(() => setLoading(false));
  };

  const fetchMyLeaves = () => {
    api
      .get('/leaves/my/requests')
      .then((r) => setMyLeaves(r.data.leaves))
      .catch(() => {});
  };

  const fetchStats = () => {
    if (canManage) {
      api
        .get('/leaves/stats/summary')
        .then((r) => setStats(r.data.stats))
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchMyLeaves();
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 'all-leaves') fetchLeaves();
    if (tab === 'my-leaves') fetchMyLeaves();
  }, [tab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave request created');
      setShowCreateModal(false);
      setForm({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
      fetchMyLeaves();
      if (tab === 'all-leaves') fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create request');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/leaves/${id}/approve`, { admin_notes: adminNotes });
      toast.success('Leave request approved');
      setShowDetailModal(false);
      setAdminNotes('');
      fetchLeaves();
      fetchMyLeaves();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/leaves/${id}/reject`, { admin_notes: adminNotes });
      toast.success('Leave request rejected');
      setShowDetailModal(false);
      setAdminNotes('');
      fetchLeaves();
      fetchMyLeaves();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  };

  const openDetail = (leave) => {
    setSelectedLeave(leave);
    setAdminNotes(leave.admin_notes || '');
    setShowDetailModal(true);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysCount = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
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
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Leave Management
          </h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2"
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
          Request Leave
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Requests',
              value: stats.total,
              color: 'text-indigo-600 dark:text-indigo-400',
            },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600 dark:text-amber-400' },
            {
              label: 'Approved',
              value: stats.approved,
              color: 'text-green-600 dark:text-green-400',
            },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-600 dark:text-red-400' },
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
        <button
          onClick={() => setTab('my-leaves')}
          className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
            tab === 'my-leaves'
              ? 'bg-indigo-600 text-white'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200'
          }`}
        >
          📋 My Requests
        </button>
        {canManage && (
          <button
            onClick={() => setTab('all-leaves')}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
              tab === 'all-leaves'
                ? 'bg-indigo-600 text-white'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200'
            }`}
          >
            📊 All Requests
          </button>
        )}
      </div>

      {/* My Leaves Tab */}
      {tab === 'my-leaves' && (
        <div className="space-y-3">
          {myLeaves.length > 0 ? (
            myLeaves.map((leave) => {
              const type = LEAVE_TYPES.find((t) => t.value === leave.leave_type);
              return (
                <div
                  key={leave.id}
                  onClick={() => openDetail(leave)}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${type?.color || 'bg-gray-100 text-gray-700'}`}
                      >
                        {type?.label || leave.leave_type}
                      </span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                      </span>
                      <span className="text-xs text-purple-400">
                        ({getDaysCount(leave.start_date, leave.end_date)} day
                        {getDaysCount(leave.start_date, leave.end_date) > 1 ? 's' : ''})
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[leave.status]}`}
                    >
                      {leave.status}
                    </span>
                  </div>
                  {leave.reason && (
                    <p className="text-sm text-purple-500 dark:text-purple-400 mt-2 line-clamp-1">
                      {leave.reason}
                    </p>
                  )}
                  {leave.admin_notes && (
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                      Admin: {leave.admin_notes}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No leave requests yet</p>
            </div>
          )}
        </div>
      )}

      {/* All Leaves Tab */}
      {tab === 'all-leaves' && canManage && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Days</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {leaves.map((leave) => {
                  const type = LEAVE_TYPES.find((t) => t.value === leave.leave_type);
                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-purple-50/50 cursor-pointer"
                      onClick={() => openDetail(leave)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-purple-900 dark:text-purple-100">
                          {leave.user_name}
                        </p>
                        <p className="text-xs text-purple-500">{leave.user_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${type?.color || 'bg-gray-100 text-gray-700'}`}
                        >
                          {type?.label || leave.leave_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {getDaysCount(leave.start_date, leave.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[leave.status]}`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {leave.status === 'pending' && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                handleApprove(leave.id);
                              }}
                              className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                handleReject(leave.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Request Leave"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Leave Type
            </label>
            <select
              value={form.leave_type}
              onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
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
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
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
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Leave Request Details"
      >
        {selectedLeave && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Employee:</span>
                <p>{selectedLeave.user_name}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Type:</span>
                <p>{LEAVE_TYPES.find((t) => t.value === selectedLeave.leave_type)?.label}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Period:</span>
                <p>
                  {formatDate(selectedLeave.start_date)} — {formatDate(selectedLeave.end_date)}
                </p>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Days:</span>
                <p>{getDaysCount(selectedLeave.start_date, selectedLeave.end_date)}</p>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Status:</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedLeave.status]}`}
                >
                  {selectedLeave.status}
                </span>
              </div>
              {selectedLeave.approved_by_name && (
                <div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    Reviewed by:
                  </span>
                  <p>{selectedLeave.approved_by_name}</p>
                </div>
              )}
            </div>

            {selectedLeave.reason && (
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400 text-sm">
                  Reason:
                </span>
                <p className="text-sm mt-1">{selectedLeave.reason}</p>
              </div>
            )}

            {selectedLeave.admin_notes && (
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400 text-sm">
                  Admin Notes:
                </span>
                <p className="text-sm mt-1">{selectedLeave.admin_notes}</p>
              </div>
            )}

            {canManage && selectedLeave.status === 'pending' && (
              <div className="border-t border-purple-100 dark:border-purple-800 pt-4">
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Add notes (optional)..."
                  className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedLeave.id)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedLeave.id)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
