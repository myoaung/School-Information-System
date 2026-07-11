import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const PROGRAM_STATUSES = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ASSIGNMENT_STATUSES = {
  enrolled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  dropped: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

const RATINGS = [
  { value: 'excellent', label: 'Excellent', icon: '⭐' },
  { value: 'good', label: 'Good', icon: '👍' },
  { value: 'satisfactory', label: 'Satisfactory', icon: '👌' },
  { value: 'poor', label: 'Poor', icon: '⚠️' },
];

export default function TrainingPage() {
  const [tab, setTab] = useState('programs');
  const [programs, setPrograms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [myTraining, setMyTraining] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [saving, setSaving] = useState(false);
  const [programForm, setProgramForm] = useState({
    title: '',
    description: '',
    trainer: '',
    start_date: '',
    end_date: '',
    location: '',
    max_participants: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    status: '',
    completion_date: '',
    feedback: '',
    rating: '',
  });

  const fetchPrograms = () => {
    setLoading(true);
    api
      .get('/training/programs')
      .then((r) => setPrograms(r.data.programs))
      .catch(() => toast.error('Failed to load programs'))
      .finally(() => setLoading(false));
  };

  const fetchStaff = () => {
    api
      .get('/hr/staff')
      .then((r) => setStaff(r.data.staff))
      .catch(() => {});
  };

  const fetchMyTraining = () => {
    api
      .get('/training/my')
      .then((r) => setMyTraining(r.data.assignments))
      .catch(() => {});
  };

  const fetchStats = () => {
    api
      .get('/training/stats')
      .then((r) => setStats(r.data.stats))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPrograms();
    fetchStaff();
    fetchStats();
    fetchMyTraining();
  }, []);

  useEffect(() => {
    if (tab === 'my') fetchMyTraining();
  }, [tab]);

  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramForm({
      title: '',
      description: '',
      trainer: '',
      start_date: '',
      end_date: '',
      location: '',
      max_participants: '',
    });
    setShowProgramModal(true);
  };

  const openEditProgram = (program) => {
    setEditingProgram(program);
    setProgramForm({
      title: program.title,
      description: program.description || '',
      trainer: program.trainer || '',
      start_date: program.start_date || '',
      end_date: program.end_date || '',
      location: program.location || '',
      max_participants: program.max_participants || '',
    });
    setShowProgramModal(true);
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...programForm,
        max_participants: programForm.max_participants
          ? parseInt(programForm.max_participants)
          : null,
      };
      if (editingProgram) {
        await api.put(`/training/programs/${editingProgram.id}`, data);
        toast.success('Program updated');
      } else {
        await api.post('/training/programs', data);
        toast.success('Program created');
      }
      setShowProgramModal(false);
      fetchPrograms();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!confirm('Delete this training program?')) return;
    try {
      await api.delete(`/training/programs/${id}`);
      toast.success('Program deleted');
      fetchPrograms();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const openAssignModal = (program) => {
    setSelectedProgram(program);
    setSelectedStaff([]);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (selectedStaff.length === 0) {
      toast.error('Select at least one staff member');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/training/programs/${selectedProgram.id}/assign`, {
        staff_ids: selectedStaff,
      });
      setShowAssignModal(false);
      toast.success('Staff assigned');
      fetchPrograms();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign staff');
    } finally {
      setSaving(false);
    }
  };

  const openEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentForm({
      status: assignment.status || 'enrolled',
      completion_date: assignment.completion_date || '',
      feedback: assignment.feedback || '',
      rating: assignment.rating || '',
    });
    setShowEditAssignmentModal(true);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/training/assignments/${selectedAssignment.id}`, assignmentForm);
      toast.success('Assignment updated');
      setShowEditAssignmentModal(false);
      fetchPrograms();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update assignment');
    } finally {
      setSaving(false);
    }
  };

  const toggleStaffSelection = (staffId) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
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
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Training & Development
          </h1>
        </div>
        <button
          onClick={openCreateProgram}
          className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm hover:bg-cyan-700 transition-colors cursor-pointer"
        >
          + New Program
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Active Programs',
              value: stats.activePrograms,
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: 'Total Enrolled',
              value: stats.totalEnrolled,
              color: 'text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Completed',
              value: stats.completed,
              color: 'text-purple-600 dark:text-purple-400',
            },
            {
              label: 'Completion Rate',
              value: `${stats.completionRate}%`,
              color: 'text-cyan-600 dark:text-cyan-400',
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
          { key: 'programs', label: '📚 Programs' },
          { key: 'assignments', label: '👥 Assignments' },
          { key: 'my', label: '🎓 My Training' },
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

      {/* Programs Tab */}
      {tab === 'programs' && (
        <div className="space-y-4">
          {programs.length > 0 ? (
            programs.map((p) => (
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
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROGRAM_STATUSES[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-purple-500">
                      {p.trainer && <span>👨‍🏫 {p.trainer}</span>}
                      {p.location && <span>📍 {p.location}</span>}
                      {p.start_date && (
                        <span>
                          📅 {formatDate(p.start_date)} — {formatDate(p.end_date)}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                    <p className="text-xs text-purple-400 mt-2">
                      {p.enrolled_count} enrolled · {p.completed_count} completed
                      {p.max_participants ? ` · Max ${p.max_participants}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openAssignModal(p)}
                      className="text-xs text-cyan-600 hover:text-cyan-800 font-medium cursor-pointer"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => openEditProgram(p)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(p.id)}
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
              <p className="text-purple-500">No training programs yet</p>
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          {programs.filter((p) => p.enrolled_count > 0).length > 0 ? (
            programs
              .filter((p) => p.enrolled_count > 0)
              .map((p) => (
                <AssignmentSection
                  key={p.id}
                  program={p}
                  onEdit={openEditAssignment}
                  formatDate={formatDate}
                />
              ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No assignments yet. Assign staff to programs first.</p>
            </div>
          )}
        </div>
      )}

      {/* My Training Tab */}
      {tab === 'my' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {myTraining.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">Program</th>
                    <th className="px-4 py-3 font-medium">Trainer</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {myTraining.map((t) => (
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
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${ASSIGNMENT_STATUSES[t.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {t.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {t.rating
                          ? RATINGS.find((r) => r.value === t.rating)?.icon +
                            ' ' +
                            RATINGS.find((r) => r.value === t.rating)?.label
                          : '—'}
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

      {/* Program Modal */}
      <Modal
        isOpen={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        title={editingProgram ? 'Edit Program' : 'New Training Program'}
      >
        <form onSubmit={handleSaveProgram} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={programForm.title}
              onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Trainer
              </label>
              <input
                type="text"
                value={programForm.trainer}
                onChange={(e) => setProgramForm({ ...programForm, trainer: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={programForm.location}
                onChange={(e) => setProgramForm({ ...programForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={programForm.start_date}
                onChange={(e) => setProgramForm({ ...programForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={programForm.end_date}
                onChange={(e) => setProgramForm({ ...programForm, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Max Participants
            </label>
            <input
              type="number"
              min="1"
              value={programForm.max_participants}
              onChange={(e) => setProgramForm({ ...programForm, max_participants: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <textarea
              value={programForm.description}
              onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowProgramModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editingProgram ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Staff: ${selectedProgram?.title}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-purple-500">
            Select staff members to assign to this training program.
          </p>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {staff.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStaff.includes(s.id)
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20'
                    : 'border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedStaff.includes(s.id)}
                  onChange={() => toggleStaffSelection(s.id)}
                  className="rounded text-cyan-600"
                />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {s.name}
                  </p>
                  <p className="text-xs text-purple-500">{s.position || s.role}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={saving || selectedStaff.length === 0}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Assigning...' : `Assign ${selectedStaff.length} Staff`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal
        isOpen={showEditAssignmentModal}
        onClose={() => setShowEditAssignmentModal(false)}
        title="Update Assignment"
      >
        <form onSubmit={handleUpdateAssignment} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Status
            </label>
            <select
              value={assignmentForm.status}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              {Object.entries(ASSIGNMENT_STATUSES).map(([key]) => (
                <option key={key} value={key}>
                  {key.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Completion Date
              </label>
              <input
                type="date"
                value={assignmentForm.completion_date}
                onChange={(e) =>
                  setAssignmentForm({ ...assignmentForm, completion_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Rating
              </label>
              <select
                value={assignmentForm.rating}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, rating: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                <option value="">No rating</option>
                {RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Feedback
            </label>
            <textarea
              value={assignmentForm.feedback}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, feedback: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditAssignmentModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Assignment Section (sub-component) ──────────────────────
function AssignmentSection({ program, onEdit, formatDate }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/training/programs/${program.id}`)
      .then((r) => setAssignments(r.data.assignments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [program.id]);

  if (loading) return null;
  if (assignments.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900">
        <h3 className="font-bold text-purple-900 dark:text-purple-100">{program.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-purple-700 dark:text-purple-300 text-left text-xs">
              <th className="px-4 py-2 font-medium">Staff</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Completed</th>
              <th className="px-4 py-2 font-medium">Rating</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-purple-50/50">
                <td className="px-4 py-2 font-medium text-purple-900 dark:text-purple-100">
                  {a.staff_name || `Staff #${a.staff_id}`}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${ASSIGNMENT_STATUSES[a.status] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {a.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-2 text-purple-600 dark:text-purple-400">
                  {formatDate(a.completion_date)}
                </td>
                <td className="px-4 py-2 text-purple-600 dark:text-purple-400">
                  {a.rating
                    ? RATINGS.find((r) => r.value === a.rating)?.icon +
                      ' ' +
                      RATINGS.find((r) => r.value === a.rating)?.label
                    : '—'}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onEdit(a)}
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
  );
}
