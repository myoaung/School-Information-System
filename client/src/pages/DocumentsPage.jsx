import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

const CATEGORIES = [
  {
    value: 'student',
    label: 'Student',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'staff',
    label: 'Staff',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  {
    value: 'general',
    label: 'General',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
];

const SUBCATEGORIES = {
  student: [
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'previous_school_record', label: 'Previous School Record' },
    { value: 'medical_record', label: 'Medical Record' },
    { value: 'photo', label: 'Photo' },
    { value: 'other', label: 'Other' },
  ],
  staff: [
    { value: 'contract', label: 'Contract' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'training_record', label: 'Training Record' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'other', label: 'Other' },
  ],
  general: [
    { value: 'policy', label: 'Policy' },
    { value: 'memo', label: 'Memo' },
    { value: 'form', label: 'Form' },
    { value: 'other', label: 'Other' },
  ],
};

const FILE_ICONS = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'video/mp4': '🎬',
  'audio/mpeg': '🎵',
  'text/plain': '📝',
};

function getFileIcon(mimeType) {
  if (!mimeType) return '📎';
  return FILE_ICONS[mimeType] || '📎';
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function DocumentsPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher } = useAuth();
  const canManage = isAdmin || isTeacher;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [versions, setVersions] = useState([]);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'general',
    subcategory: '',
    entity_id: '',
    description: '',
  });

  const fetchDocuments = () => {
    setLoading(true);
    const params = {};
    if (categoryFilter) params.category = categoryFilter;
    if (subcategoryFilter) params.subcategory = subcategoryFilter;
    if (search) params.search = search;
    api
      .get('/documents', { params })
      .then((r) => setDocuments(r.data.documents))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, subcategoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const openCreate = () => {
    setEditDoc(null);
    setFile(null);
    setForm({ title: '', category: 'general', subcategory: '', entity_id: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setFile(null);
    setForm({
      title: doc.title,
      category: doc.category,
      subcategory: doc.subcategory || '',
      entity_id: doc.entity_id || '',
      description: doc.description || '',
    });
    setShowModal(true);
  };

  const openDetail = async (doc) => {
    setSelectedDoc(doc);
    try {
      const res = await api.get(`/documents/${doc.id}`);
      setVersions(res.data.versions || []);
    } catch {
      setVersions([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editDoc) {
        await api.put(`/documents/${editDoc.id}`, form);
      } else {
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('category', form.category);
        if (form.subcategory) fd.append('subcategory', form.subcategory);
        if (form.entity_id) fd.append('entity_id', form.entity_id);
        if (form.description) fd.append('description', form.description);
        if (file) fd.append('file', file);
        await api.post('/documents', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowModal(false);
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/documents/${deleteId}`);
      setDeleteId(null);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleDownload = (doc) => {
    if (doc.file_path) {
      window.open(`/api/documents/${doc.id}/download`, '_blank');
    }
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
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Documents
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canManage && (
            <button
              onClick={openCreate}
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
              Upload Document
            </button>
          )}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-800"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => {
            setCategoryFilter('');
            setSubcategoryFilter('');
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            !categoryFilter
              ? 'bg-indigo-600 text-white'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setCategoryFilter(cat.value);
              setSubcategoryFilter('');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              categoryFilter === cat.value
                ? 'bg-indigo-600 text-white'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Subcategory filters */}
      {categoryFilter && SUBCATEGORIES[categoryFilter] && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {SUBCATEGORIES[categoryFilter].map((sub) => (
            <button
              key={sub.value}
              onClick={() => setSubcategoryFilter(subcategoryFilter === sub.value ? '' : sub.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                subcategoryFilter === sub.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Document Grid */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const cat = CATEGORIES.find((c) => c.value === doc.category);
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-xl">
                      {getFileIcon(doc.mime_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-sm line-clamp-1">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-purple-500 dark:text-purple-400">
                        {doc.file_name || 'No file'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color || 'bg-gray-100 text-gray-700'}`}
                  >
                    {cat?.label || doc.category}
                  </span>
                  {doc.subcategory && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {doc.subcategory.replace(/_/g, ' ')}
                    </span>
                  )}
                  {doc.version > 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      v{doc.version}
                    </span>
                  )}
                </div>

                {doc.description && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-3 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-purple-400 dark:text-purple-500 mb-3">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{doc.uploaded_by_name || 'Unknown'}</span>
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-purple-100 dark:border-purple-800">
                  <button
                    onClick={() => openDetail(doc)}
                    className="flex-1 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer font-medium"
                  >
                    Details
                  </button>
                  {doc.file_path && (
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 py-1.5 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg cursor-pointer font-medium"
                    >
                      Download
                    </button>
                  )}
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEdit(doc)}
                        className="py-1.5 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(doc.id)}
                        className="py-1.5 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg
            className="w-12 h-12 text-purple-300 dark:text-purple-300 mx-auto mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-purple-500 dark:text-purple-400">No documents found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editDoc ? 'Edit Document' : 'Upload Document'}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Type
              </label>
              <select
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
              >
                <option value="">Select type</option>
                {(SUBCATEGORIES[form.category] || []).map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!editDoc && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.wav"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-purple-700 dark:text-purple-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700 dark:file:bg-indigo-900/50 dark:file:text-indigo-300 hover:file:bg-indigo-200 dark:hover:file:bg-indigo-800/50 cursor-pointer"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
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
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editDoc ? 'Update' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || 'Document Details'}
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Category:</span>
                <span className="ml-2">{selectedDoc.category}</span>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Type:</span>
                <span className="ml-2">{selectedDoc.subcategory?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">File:</span>
                <span className="ml-2">{selectedDoc.file_name || '—'}</span>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Size:</span>
                <span className="ml-2">{formatFileSize(selectedDoc.file_size)}</span>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  Uploaded by:
                </span>
                <span className="ml-2">{selectedDoc.uploaded_by_name || '—'}</span>
              </div>
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400">Date:</span>
                <span className="ml-2">
                  {new Date(selectedDoc.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedDoc.description && (
              <div>
                <span className="font-medium text-purple-600 dark:text-purple-400 text-sm">
                  Description:
                </span>
                <p className="text-sm mt-1">{selectedDoc.description}</p>
              </div>
            )}

            {selectedDoc.file_path && (
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer"
              >
                📥 Download File
              </button>
            )}

            {versions.length > 1 && (
              <div>
                <h4 className="font-medium text-purple-700 dark:text-purple-300 text-sm mb-2">
                  Version History
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-xs"
                    >
                      <div>
                        <span className="font-medium">v{v.version}</span>
                        <span className="text-purple-500 ml-2">{v.file_name}</span>
                      </div>
                      <span className="text-purple-400">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? All versions will be removed."
      />
    </div>
  );
}
