import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const POSTING_STATUSES = {
  open: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  filled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
};

const APPLICATION_STATUSES = {
  new: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  offered: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  hired: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const INTERVIEW_RESULTS = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pass: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  fail: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  conditional: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

export default function RecruitmentPage() {
  const [tab, setTab] = useState('postings');
  const [postings, setPostings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [editingPosting, setEditingPosting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterPosting, setFilterPosting] = useState('');
  const [postingForm, setPostingForm] = useState({
    title: '',
    description: '',
    department: '',
    position: '',
    employment_type: 'full_time',
    salary_range: '',
    requirements: '',
  });
  const [interviewForm, setInterviewForm] = useState({
    interviewer_id: '',
    scheduled_at: '',
    location: '',
    notes: '',
  });

  const fetchPostings = () => {
    setLoading(true);
    api
      .get('/recruitment/postings')
      .then((r) => setPostings(r.data.postings))
      .catch(() => toast.error('Failed to load postings'))
      .finally(() => setLoading(false));
  };

  const fetchApplications = () => {
    const params = {};
    if (filterPosting) params.posting_id = filterPosting;
    api
      .get('/recruitment/applications', { params })
      .then((r) => setApplications(r.data.applications))
      .catch(() => {});
  };

  const fetchStats = () => {
    api
      .get('/recruitment/stats')
      .then((r) => setStats(r.data.stats))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPostings();
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 'applications') fetchApplications();
  }, [tab, filterPosting]);

  const openCreatePosting = () => {
    setEditingPosting(null);
    setPostingForm({
      title: '',
      description: '',
      department: '',
      position: '',
      employment_type: 'full_time',
      salary_range: '',
      requirements: '',
    });
    setShowPostingModal(true);
  };

  const openEditPosting = (posting) => {
    setEditingPosting(posting);
    setPostingForm({
      title: posting.title,
      description: posting.description || '',
      department: posting.department || '',
      position: posting.position || '',
      employment_type: posting.employment_type || 'full_time',
      salary_range: posting.salary_range || '',
      requirements: posting.requirements || '',
    });
    setShowPostingModal(true);
  };

  const handleSavePosting = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPosting) {
        await api.put(`/recruitment/postings/${editingPosting.id}`, postingForm);
        toast.success('Posting updated');
      } else {
        await api.post('/recruitment/postings', postingForm);
        toast.success('Posting created');
      }
      setShowPostingModal(false);
      fetchPostings();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save posting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePosting = async (id) => {
    if (!confirm('Delete this job posting?')) return;
    try {
      await api.delete(`/recruitment/postings/${id}`);
      toast.success('Posting deleted');
      fetchPostings();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleUpdateAppStatus = async (id, status) => {
    try {
      await api.put(`/recruitment/applications/${id}`, { status });
      toast.success('Application updated');
      fetchApplications();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const openInterviewModal = (app) => {
    setSelectedApp(app);
    setInterviewForm({
      interviewer_id: '',
      scheduled_at: '',
      location: '',
      notes: '',
    });
    setShowInterviewModal(true);
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/recruitment/interviews', {
        application_id: selectedApp.id,
        ...interviewForm,
      });
      setShowInterviewModal(false);
      toast.success('Interview scheduled');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule interview');
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
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
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Recruitment
          </h1>
        </div>
        <button
          onClick={openCreatePosting}
          className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-700 transition-colors cursor-pointer"
        >
          + New Posting
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Open Postings',
              value: stats.openPostings,
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: 'Total Applications',
              value: stats.totalApplications,
              color: 'text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Pending Review',
              value: stats.pendingReview,
              color: 'text-amber-600 dark:text-amber-400',
            },
            {
              label: 'Interviews Scheduled',
              value: stats.scheduledInterviews,
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
          { key: 'postings', label: '📋 Job Postings' },
          { key: 'applications', label: '📄 Applications' },
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

      {/* Job Postings Tab */}
      {tab === 'postings' && (
        <div className="space-y-4">
          {postings.length > 0 ? (
            postings.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        {p.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${POSTING_STATUSES[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-purple-500">
                      {p.department && <span>🏢 {p.department}</span>}
                      {p.position && <span>💼 {p.position}</span>}
                      <span>📝 {p.employment_type?.replace('_', ' ')}</span>
                      {p.salary_range && <span>💰 {p.salary_range}</span>}
                    </div>
                    {p.description && (
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                    <p className="text-xs text-purple-400 mt-2">
                      {p.application_count} applications · Posted by {p.posted_by_name || 'Unknown'}{' '}
                      · {formatDate(p.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openEditPosting(p)}
                      className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePosting(p.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No job postings yet</p>
            </div>
          )}
        </div>
      )}

      {/* Applications Tab */}
      {tab === 'applications' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-3">
            <select
              value={filterPosting}
              onChange={(e) => setFilterPosting(e.target.value)}
              className="px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="">All Postings</option>
              {postings.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {applications.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                      <th className="px-4 py-3 font-medium">Applicant</th>
                      <th className="px-4 py-3 font-medium">Posting</th>
                      <th className="px-4 py-3 font-medium">Applied</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                    {applications.map((a) => (
                      <tr key={a.id} className="hover:bg-purple-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-purple-900 dark:text-purple-100">
                            {a.applicant_name}
                          </p>
                          <p className="text-xs text-purple-500">{a.applicant_email}</p>
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {a.posting_title || '—'}
                        </td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                          {formatDate(a.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={a.status}
                            onChange={(e) => handleUpdateAppStatus(a.id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${APPLICATION_STATUSES[a.status]} bg-transparent`}
                          >
                            {Object.keys(APPLICATION_STATUSES).map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {a.status !== 'hired' && a.status !== 'rejected' && (
                            <button
                              onClick={() => openInterviewModal(a)}
                              className="text-xs text-purple-600 hover:text-purple-800 font-medium cursor-pointer"
                            >
                              Schedule Interview
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No applications found</p>
            </div>
          )}
        </div>
      )}

      {/* Posting Modal */}
      <Modal
        isOpen={showPostingModal}
        onClose={() => setShowPostingModal(false)}
        title={editingPosting ? 'Edit Job Posting' : 'New Job Posting'}
      >
        <form onSubmit={handleSavePosting} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={postingForm.title}
              onChange={(e) => setPostingForm({ ...postingForm, title: e.target.value })}
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
                value={postingForm.department}
                onChange={(e) => setPostingForm({ ...postingForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Position
              </label>
              <input
                type="text"
                value={postingForm.position}
                onChange={(e) => setPostingForm({ ...postingForm, position: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Employment Type
              </label>
              <select
                value={postingForm.employment_type}
                onChange={(e) =>
                  setPostingForm({ ...postingForm, employment_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Salary Range
              </label>
              <input
                type="text"
                value={postingForm.salary_range}
                onChange={(e) => setPostingForm({ ...postingForm, salary_range: e.target.value })}
                placeholder="e.g., 500,000 - 800,000 MMK"
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <textarea
              value={postingForm.description}
              onChange={(e) => setPostingForm({ ...postingForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Requirements
            </label>
            <textarea
              value={postingForm.requirements}
              onChange={(e) => setPostingForm({ ...postingForm, requirements: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPostingModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editingPosting ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interview Modal */}
      <Modal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        title={`Schedule Interview: ${selectedApp?.applicant_name}`}
      >
        <form onSubmit={handleScheduleInterview} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Interview Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={interviewForm.scheduled_at}
              onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={interviewForm.location}
              onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
              placeholder="e.g., Room 201 or Zoom link"
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Notes
            </label>
            <textarea
              value={interviewForm.notes}
              onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowInterviewModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
