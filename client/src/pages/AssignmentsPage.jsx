import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = { course_id: '', title: '', description: '', due_date: '', max_score: '100', allow_late: false };

export default function AssignmentsPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher, user } = useAuth();
  const canManage = isAdmin || isTeacher;

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Submission state (student)
  const [submitting, setSubmitting] = useState(null);
  const [submitContent, setSubmitContent] = useState('');

  // Grading state (admin/teacher)
  const [grading, setGrading] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // CRUD modal state
  const [showModal, setShowModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState(null);

  const fetchAssignments = () => {
    setLoading(true);
    api.get('/assignments')
      .then(r => setAssignments(r.data.assignments))
      .catch(() => setError(t('assignments.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssignments();
    if (canManage) {
      api.get('/courses').then(r => setCourses(r.data.courses)).catch(() => {});
    }
  }, []);

  // ---- Create / Edit ----
  const openCreate = () => {
    setEditAssignment(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditAssignment(a);
    setForm({
      course_id: String(a.course_id || ''),
      title: a.title || '',
      description: a.description || '',
      due_date: a.due_date || '',
      max_score: String(a.max_score ?? '100'),
      allow_late: !!a.allow_late,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        max_score: Number(form.max_score) || 100,
        allow_late: form.allow_late ? 1 : 0,
      };
      if (editAssignment) {
        await api.put(`/assignments/${editAssignment.id}`, payload);
      } else {
        await api.post('/assignments', payload);
      }
      setShowModal(false);
      setMessage(editAssignment ? t('assignments.updated') || 'Assignment updated' : t('assignments.created') || 'Assignment created');
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    try {
      await api.delete(`/assignments/${deleteId}`);
      setDeleteId(null);
      setMessage('Assignment deleted');
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete assignment');
    }
  };

  // ---- Student submission ----
  const handleSubmit = (id) => {
    setSubmitting(id);
    api.post(`/assignments/${id}/submit`, { content: submitContent })
      .then(() => { setMessage(t('assignments.submitted')); setSubmitContent(''); fetchAssignments(); })
      .catch(err => setError(err.response?.data?.error || t('assignments.submitError')))
      .finally(() => setSubmitting(null));
  };

  // ---- Grading ----
  const handleGrade = (submissionId) => {
    api.post(`/assignments/submissions/${submissionId}/grade`, { score: Number(gradeScore), feedback: gradeFeedback })
      .then(() => { setMessage(t('assignments.graded')); setGrading(null); setGradeScore(''); setGradeFeedback(''); fetchAssignments(); })
      .catch(err => setError(err.response?.data?.error || t('assignments.gradeError')));
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('assignments.title')}</h1>
        </div>
        {canManage && (
          <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            {t('assignments.newAssignment') || 'New Assignment'}
          </button>
        )}
      </div>

      {message && <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 relative group">
              {/* Edit / Delete buttons (admin/teacher) */}
              {canManage && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(a)} className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 cursor-pointer">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 cursor-pointer">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">{a.title}</h3>
                  <p className="text-sm text-purple-600/60 dark:text-purple-300/60 mt-1">{a.course_title}</p>
                  {a.description && <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">{a.description}</p>}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-purple-500 dark:text-purple-400">
                    {a.due_date && <span>{t('assignments.due')}: {a.due_date}</span>}
                    <span>{t('assignments.maxScore')}: {a.max_score}</span>
                    <span>{t('assignments.createdBy')}: {a.created_by_name}</span>
                    {a.allow_late ? <span className="text-green-600 dark:text-green-400">Late submissions allowed</span> : null}
                  </div>
                </div>
                {user.role === 'student' && (
                  <button onClick={() => setSubmitting(submitting === a.id ? null : a.id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer whitespace-nowrap">
                    {t('assignments.submit')}
                  </button>
                )}
              </div>

              {/* Submit form (student) */}
              {submitting === a.id && (
                <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800">
                  <textarea value={submitContent} onChange={e => setSubmitContent(e.target.value)}
                    placeholder={t('assignments.submitPlaceholder')}
                    className="w-full px-4 py-2 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 resize-none" rows={3} />
                  <button onClick={() => handleSubmit(a.id)}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer">
                    {t('assignments.confirmSubmit')}
                  </button>
                </div>
              )}

              {/* Submissions (admin/teacher) */}
              {(isAdmin || isTeacher) && a.submissions?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800">
                  <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-3">{t('assignments.submissions')} ({a.submissions.length})</h4>
                  <div className="space-y-2">
                    {a.submissions.map(s => (
                      <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl p-3">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">{s.student_name}</span>
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            s.status === 'graded' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : s.status === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          }`}>{s.status}</span>
                          {s.score != null && <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">{s.score}/{a.max_score}</span>}
                        </div>
                        {s.status !== 'graded' && (
                          <button onClick={() => setGrading(grading === s.id ? null : s.id)}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 font-medium cursor-pointer">
                            {t('assignments.grade')}
                          </button>
                        )}
                        {grading === s.id && (
                          <div className="flex gap-2 items-center mt-2">
                            <input type="number" value={gradeScore} onChange={e => setGradeScore(e.target.value)} placeholder={t('assignments.score')}
                              className="w-20 px-2 py-1 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-lg text-sm" />
                            <input type="text" value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} placeholder={t('assignments.feedback')}
                              className="flex-1 px-2 py-1 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-lg text-sm" />
                            <button onClick={() => handleGrade(s.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 cursor-pointer">{t('assignments.save')}</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('assignments.noAssignments')}</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editAssignment ? (t('assignments.editAssignment') || 'Edit Assignment') : (t('assignments.newAssignment') || 'New Assignment')}>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Course</label>
            <select required value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
              <option value="">Select a course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Max Score</label>
              <input type="number" min="0" value={form.max_score} onChange={e => setForm({...form, max_score: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="allow_late" checked={form.allow_late} onChange={e => setForm({...form, allow_late: e.target.checked})}
              className="w-4 h-4 text-purple-600 bg-white dark:bg-gray-800 border-purple-300 dark:border-gray-600 rounded focus:ring-purple-500 cursor-pointer" />
            <label htmlFor="allow_late" className="text-sm text-purple-700 dark:text-purple-300 cursor-pointer">Allow late submissions</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : editAssignment ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Assignment" message="Are you sure you want to delete this assignment? All student submissions will also be removed." />
    </div>
  );
}
