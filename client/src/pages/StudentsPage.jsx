import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

export default function StudentsPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', grade_id: '', section: 'A', gender: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const fetchStudents = (q = '') => {
    setLoading(true);
    api.get('/students', { params: { search: q } })
      .then(r => setStudents(r.data.students))
      .catch(() => setError(t('students.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
    api.get('/curriculum').then(r => {
      const allGrades = [];
      r.data.levels?.forEach(l => l.grades?.forEach(g => allGrades.push(g)));
      setGrades(allGrades);
    }).catch(() => toast.error('Failed to load grades'));
  }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchStudents(search); };

  const openCreate = () => {
    setEditStudent(null);
    setForm({ name: '', email: '', password: '', grade_id: '', section: 'A', gender: '', phone: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setForm({ name: s.name, email: s.email, password: '', grade_id: s.grade_id || '', section: s.section || 'A', gender: s.gender || '', phone: s.phone || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editStudent) {
        await api.put(`/students/${editStudent.id}`, form);
      } else {
        await api.post('/students', form);
      }
      setShowModal(false);
      fetchStudents(search);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${deleteId}`);
      setDeleteId(null);
      fetchStudents(search);
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
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('students.title')}</h1>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              New Student
            </button>
          )}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('students.searchPlaceholder')}
              className="px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-800" />
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer">{t('students.search')}</button>
          </form>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {students.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">{t('students.studentId')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.grade')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.section')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">{s.student_id || '—'}</td>
                    <td className="px-4 py-3 text-purple-900 dark:text-purple-100">{s.name}</td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{s.email}</td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{s.grade_name || '—'}</td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{s.section || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                        s.status === 'suspended' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300' :
                        s.status === 'graduated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>{s.status || 'active'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/students/${s.id}`} className="text-purple-600 dark:text-purple-400 hover:text-purple-800 text-xs font-medium">{t('students.view')}</Link>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(s)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-xs font-medium cursor-pointer">Edit</button>
                            <button onClick={() => setDeleteId(s.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 text-xs font-medium cursor-pointer">Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 dark:text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('students.noStudents')}</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editStudent ? 'Edit Student' : 'New Student'}>
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
          {!editStudent && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Grade</label>
              <select value={form.grade_id} onChange={e => setForm({...form, grade_id: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
                <option value="">Select grade</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Section</label>
              <select value={form.section} onChange={e => setForm({...form, section: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
                {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Gender</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : editStudent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Student" message="Are you sure you want to delete this student? This action cannot be undone." />
    </div>
  );
}
