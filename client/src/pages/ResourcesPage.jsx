import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

const TYPE_ICONS = {
  pdf: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  audio: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  image: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  link: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

const TYPE_COLORS = {
  pdf: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  video: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  audio: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  image: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  link: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  document: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
};

export default function ResourcesPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher } = useAuth();
  const canManage = isAdmin || isTeacher;
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  // CRUD state
  const [showModal, setShowModal] = useState(false);
  const [editResource, setEditResource] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    course_id: '',
    title: '',
    type: 'link',
    url: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchResources = () => {
    setLoading(true);
    api
      .get('/resources')
      .then((r) => setResources(r.data.resources))
      .catch(() => setError(t('resources.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResources();
    if (canManage) {
      api
        .get('/courses')
        .then((r) => setCourses(r.data.courses || []))
        .catch(() => toast.error('Failed to load courses'));
    }
  }, []);

  const openCreate = () => {
    setEditResource(null);
    setForm({ course_id: '', title: '', type: 'link', url: '', description: '' });
    setFile(null);
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditResource(r);
    setForm({
      course_id: r.course_id,
      title: r.title,
      type: r.type,
      url: r.url || '',
      description: r.description || '',
    });
    setFile(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('course_id', form.course_id);
      formData.append('title', form.title);
      formData.append('type', form.type);
      if (form.url) formData.append('url', form.url);
      if (form.description) formData.append('description', form.description);
      if (file) formData.append('file', file);

      if (editResource) {
        await api.put(`/resources/${editResource.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/resources', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowModal(false);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/resources/${deleteId}`);
      setDeleteId(null);
      fetchResources();
      toast.success('Resource deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const types = ['all', 'pdf', 'video', 'audio', 'image', 'link', 'document'];
  const filtered = filter === 'all' ? resources : resources.filter((r) => r.type === filter);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            {t('resources.title')}
          </h1>
        </div>
        {canManage && (
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('resources.addResource')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Type filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              filter === type
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/30'
            }`}
          >
            {type === 'all' ? t('resources.allTypes') : type.toUpperCase()}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 card-interactive"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_COLORS[r.type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  {TYPE_ICONS[r.type] || TYPE_ICONS.document}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-purple-900 dark:text-purple-100 truncate">
                    {r.title}
                  </h3>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                  >
                    {r.type.toUpperCase()}
                  </span>
                </div>
              </div>
              {r.description && (
                <p className="text-sm text-purple-600/70 dark:text-purple-300/60 mb-3 line-clamp-2">
                  {r.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-purple-500 dark:text-purple-400 mb-3">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  {r.subject_code}
                </span>
                <span className="truncate">{r.course_title}</span>
              </div>
              {r.uploaded_by_name && (
                <p className="text-xs text-purple-400 dark:text-purple-500 mb-3">
                  Uploaded by {r.uploaded_by_name}
                </p>
              )}
              <div className="flex items-center gap-2">
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t('resources.open')}
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
                {canManage && (
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={() => openEdit(r)}
                      className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
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
                      onClick={() => setDeleteId(r.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
          <svg
            className="w-16 h-16 text-purple-300 dark:text-purple-300 mx-auto mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          <p className="text-purple-600 dark:text-purple-400 text-lg">
            {t('resources.noResources')}
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title={editResource ? 'Edit Resource' : 'Add Resource'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                Course *
              </label>
              <select
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.subject_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Resource title"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="link">Link</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="image">Image</option>
                <option value="document">Document</option>
              </select>
            </div>
            {form.type === 'link' ? (
              <div>
                <label className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/resource"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  {editResource ? 'Upload new file (optional)' : 'Upload file *'}
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required={!editResource}
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.mp4,.mp3,.wav,.jpg,.jpeg,.png,.gif"
                  className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                />
                {editResource?.url && (
                  <p className="text-xs text-purple-500 mt-1">Current: {editResource.url}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Optional description"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-purple-200 dark:border-purple-800 rounded-xl text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Saving...' : editResource ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <ConfirmDialog
          message="Are you sure you want to delete this resource? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
