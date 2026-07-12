import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  draft: {
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    label: 'Draft',
    icon: '📝',
  },
  incomplete: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    label: 'Incomplete',
    icon: '⚠️',
  },
  ready: {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    label: 'Ready',
    icon: '✅',
  },
  active: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    label: 'Active',
    icon: '🟢',
  },
};

export default function ClassesPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    teacher_id: '',
    academic_year_id: '',
    grade_id: '',
    section: 'A',
    capacity: 40,
    schedule: '',
    room: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchClasses = () => {
    setLoading(true);
    let url = '/classes';
    if (statusFilter) url += `?status=${statusFilter}`;
    api
      .get(url)
      .then((r) => setClasses(r.data.classes))
      .catch(() => setError(t('classes.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClasses();
    if (isAdmin) {
      api
        .get('/teachers')
        .then((r) => setTeachers(r.data.teachers || []))
        .catch(() => {});
      api
        .get('/curriculum')
        .then((r) => {
          setGrades(r.data.grades || []);
          setAcademicYears(r.data.academic_years || []);
        })
        .catch(() => {});
      // Also fetch academic years separately
      api
        .get('/academic')
        .then((r) => {
          if (r.data.academic_years) setAcademicYears(r.data.academic_years);
        })
        .catch(() => {});
    }
  }, [statusFilter]);

  const openCreate = () => {
    setEditClass(null);
    setForm({
      name: '',
      description: '',
      teacher_id: '',
      academic_year_id: '',
      grade_id: '',
      section: 'A',
      capacity: 40,
      schedule: '',
      room: '',
    });
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditClass(cls);
    setForm({
      name: cls.name,
      description: cls.description || '',
      teacher_id: cls.teacher_id || '',
      academic_year_id: cls.academic_year_id || '',
      grade_id: cls.grade_id || '',
      section: cls.section || 'A',
      capacity: cls.capacity || 40,
      schedule: cls.schedule || '',
      room: cls.room || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        academic_year_id: form.academic_year_id || null,
        grade_id: form.grade_id || null,
        teacher_id: form.teacher_id || null,
        capacity: parseInt(form.capacity) || 40,
      };
      if (editClass) {
        await api.put(`/classes/${editClass.id}`, data);
        toast.success('Class updated');
      } else {
        await api.post('/classes', data);
        toast.success('Class created');
      }
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/classes/${deleteId}`);
      setDeleteId(null);
      fetchClasses();
      toast.success('Class deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            {t('classes.title')}
          </h1>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2"
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
            New Class
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Status Filter */}
      {isAdmin && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${!statusFilter ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200'}`}
          >
            All ({classes.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${statusFilter === key ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200'}`}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
      )}

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const status = STATUS_CONFIG[cls.status] || STATUS_CONFIG.draft;
            const teacherProgress =
              cls.total_subjects > 0
                ? Math.round((cls.assigned_teachers / cls.total_subjects) * 100)
                : 0;
            return (
              <Link
                to={`/classes/${cls.id}`}
                key={cls.id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 relative group hover:shadow-lg transition-shadow block"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openEdit(cls);
                        }}
                        className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 cursor-pointer"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteId(cls.id);
                        }}
                        className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 cursor-pointer"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-1">
                  {cls.name}
                </h2>

                {/* Grade & Section */}
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mb-3">
                  {cls.grade_name && <span className="font-medium">{cls.grade_name}</span>}
                  {cls.section && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded text-xs">
                      Section {cls.section}
                    </span>
                  )}
                  {cls.year_name && (
                    <span className="text-xs text-purple-400">• {cls.year_name}</span>
                  )}
                </div>

                {/* Teacher Progress */}
                {cls.total_subjects > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400 mb-1">
                      <span>Teachers Assigned</span>
                      <span className="font-medium">
                        {cls.assigned_teachers}/{cls.total_subjects}
                      </span>
                    </div>
                    <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          teacherProgress === 100
                            ? 'bg-green-500'
                            : teacherProgress > 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${teacherProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Capacity */}
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <span>
                    {cls.student_count}/{cls.capacity} students
                  </span>
                </div>

                {cls.room && (
                  <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mt-1">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{cls.room}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg
            className="w-12 h-12 text-purple-300 mx-auto mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <p className="text-purple-500 dark:text-purple-400">{t('classes.noClasses')}</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editClass ? 'Edit Class' : 'New Class'}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Grade 5-A"
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Grade
              </label>
              <select
                value={form.grade_id}
                onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                <option value="">Select grade</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Section
              </label>
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {['A', 'B', 'C', 'D', 'E'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Academic Year
            </label>
            <select
              value={form.academic_year_id}
              onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="">Select year</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Homeroom Teacher
            </label>
            <select
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="">No teacher assigned</option>
              {teachers.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name}
                </option>
              ))}
            </select>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Schedule
              </label>
              <input
                type="text"
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                placeholder="e.g. Mon/Wed 9:00-10:00"
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Room
              </label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="e.g. Room 101"
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
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
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editClass ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message="Are you sure you want to delete this class? All enrollments will be removed."
      />
    </div>
  );
}
