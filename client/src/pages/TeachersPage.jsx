import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function TeachersPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', qualification: '', specialization: '' });
  const [saving, setSaving] = useState(false);

  const fetchTeachers = (q = '') => {
    setLoading(true);
    api.get('/teachers', { params: { search: q } })
      .then(r => setTeachers(r.data.teachers))
      .catch(() => setError(t('teachers.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchTeachers(search); };

  const openCreate = () => {
    setEditTeacher(null);
    setForm({ name: '', email: '', password: '', phone: '', qualification: '', specialization: '' });
    setShowModal(true);
  };

  const openEdit = (tc) => {
    setEditTeacher(tc);
    setForm({ name: tc.name, email: tc.email, password: '', phone: tc.phone || '', qualification: tc.qualification || '', specialization: tc.specialization || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTeacher) {
        await api.put(`/teachers/${editTeacher.id}`, form);
      } else {
        await api.post('/teachers', form);
      }
      setShowModal(false);
      fetchTeachers(search);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/teachers/${deleteId}`);
      setDeleteId(null);
      fetchTeachers(search);
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
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('teachers.title')}</h1>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              New Teacher
            </button>
          )}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('teachers.searchPlaceholder')}
              className="px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-800" />
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer">{t('teachers.search')}</button>
          </form>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {teachers.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">{t('teachers.teacherId')}</th>
                  <th className="px-4 py-3 font-medium">{t('teachers.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('teachers.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('teachers.qualification')}</th>
                  <th className="px-4 py-3 font-medium">{t('teachers.specialization')}</th>
                  <th className="px-4 py-3 font-medium">{t('teachers.status')}</th>
                  {isAdmin && <th className="px-4 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {teachers.map(tc => (
                  <tr key={tc.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">{tc.teacher_id || '—'}</td>
                    <td className="px-4 py-3 text-purple-900 dark:text-purple-100">{tc.name}</td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{tc.email}</td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{tc.qualification || '—'}</td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{tc.specialization || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        tc.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                        tc.status === 'on_leave' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>{tc.status || 'active'}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(tc)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-xs font-medium cursor-pointer">Edit</button>
                          <button onClick={() => setDeleteId(tc.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 text-xs font-medium cursor-pointer">Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 dark:text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('teachers.noTeachers')}</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTeacher ? 'Edit Teacher' : 'New Teacher'}>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          {!editTeacher && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Qualification</label>
              <input type="text" value={form.qualification} onChange={e => setForm({...form, qualification: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Specialization</label>
            <input type="text" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : editTeacher ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Teacher" message="Are you sure you want to delete this teacher? This action cannot be undone." />
    </div>
  );
}
