import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CoursesPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher } = useAuth();
  const canManage = isAdmin || isTeacher;

  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // CRUD state
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ class_id: '', subject_id: '', title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    api.get('/courses')
      .then(r => setCourses(r.data.courses))
      .catch(() => setError(t('courses.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
    // Fetch classes and subjects for dropdowns
    api.get('/classes').then(r => setClasses(r.data.classes || [])).catch(() => {});
    api.get('/curriculum').then(r => {
      const allSubjects = [];
      r.data.levels?.forEach(l => l.grades?.forEach(g => {
        // curriculum endpoint returns nested data; also try flat subjects
      }));
      // Try direct subjects endpoint via curriculum data
      if (r.data.subjects) setSubjects(r.data.subjects);
    }).catch(() => {});
    // Fallback: fetch subjects directly if endpoint exists
    api.get('/subjects').then(r => setSubjects(r.data.subjects || r.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditCourse(null);
    setForm({ class_id: '', subject_id: '', title: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({
      class_id: c.class_id || '',
      subject_id: c.subject_id || '',
      title: c.title || '',
      description: c.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCourse) {
        await api.put(`/courses/${editCourse.id}`, form);
      } else {
        await api.post('/courses', form);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/courses/${deleteId}`);
      setDeleteId(null);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('courses.title')}</h1>
        </div>
        {canManage && (
          <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New Course
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 hover:shadow-lg transition-shadow relative group">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">{c.subject_code}</span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">{c.class_name}</span>
              </div>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">{c.title}</h3>
              {c.description && <p className="text-sm text-purple-600/60 dark:text-purple-300/60 line-clamp-2">{c.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <Link to={`/courses/${c.id}`} className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:text-purple-800">{t('courses.viewDetails')} →</Link>
                {canManage && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-xs font-medium cursor-pointer">Edit</button>
                    <button onClick={() => setDeleteId(c.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 text-xs font-medium cursor-pointer">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('courses.noCourses')}</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCourse ? 'Edit Course' : 'New Course'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Class</label>
              <select required value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Subject</label>
              <select required value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ${s.name}` : s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : editCourse ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Course" message="Are you sure you want to delete this course? This action cannot be undone." />
    </div>
  );
}
