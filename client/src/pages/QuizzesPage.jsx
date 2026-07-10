import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

export default function QuizzesPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher, user } = useAuth();
  const canManage = isAdmin || isTeacher;

  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // CRUD state
  const [showModal, setShowModal] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ course_id: '', title: '', description: '', time_limit_minutes: '', max_score: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchQuizzes = () => {
    setLoading(true);
    api.get('/quizzes')
      .then(r => setQuizzes(r.data.quizzes))
      .catch(() => setError(t('quizzes.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuizzes();
    api.get('/courses').then(r => setCourses(r.data.courses || [])).catch(() => toast.error('Failed to load courses'));
  }, []);

  const openCreate = () => {
    setEditQuiz(null);
    setForm({ course_id: '', title: '', description: '', time_limit_minutes: '', max_score: '', due_date: '' });
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditQuiz(q);
    setForm({
      course_id: q.course_id || '',
      title: q.title || '',
      description: q.description || '',
      time_limit_minutes: q.time_limit_minutes || '',
      max_score: q.max_score || '',
      due_date: q.due_date ? q.due_date.slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.course_id || !form.title) {
      setError('Course and title are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        course_id: Number(form.course_id),
        title: form.title,
        description: form.description || null,
        time_limit_minutes: form.time_limit_minutes ? Number(form.time_limit_minutes) : null,
        max_score: form.max_score ? Number(form.max_score) : 100,
        due_date: form.due_date || null,
      };
      if (editQuiz) {
        await api.put(`/quizzes/${editQuiz.id}`, payload);
        setMessage('Quiz updated successfully');
      } else {
        await api.post('/quizzes', payload);
        setMessage('Quiz created successfully');
      }
      setShowModal(false);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/quizzes/${deleteId}`);
      setMessage('Quiz deleted successfully');
      setDeleteId(null);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete quiz');
    }
  };

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Quiz taking
  const startQuiz = async (quizId) => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setActiveQuiz(res.data.quiz);
      setAnswers({});
      setResult(null);
    } catch {
      setError(t('quizzes.loadError'));
    }
  };

  const submitQuiz = () => {
    api.post(`/quizzes/${activeQuiz.id}/attempt`, { answers })
      .then(res => {
        setResult(res.data);
        setMessage(t('quizzes.submitted'));
      })
      .catch(err => setError(err.response?.data?.error || t('quizzes.submitError')));
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  // Quiz taking view
  if (activeQuiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => setActiveQuiz(null)} className="text-purple-600 dark:text-purple-400 hover:text-purple-800 text-sm font-medium mb-4 cursor-pointer">← {t('quizzes.backToList')}</button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
          <h1 className="text-2xl font-extrabold text-purple-900 dark:text-purple-100 mb-2">{activeQuiz.title}</h1>
          {activeQuiz.description && <p className="text-purple-600/60 dark:text-purple-300/60">{activeQuiz.description}</p>}
          <div className="flex gap-4 mt-3 text-xs text-purple-500 dark:text-purple-400">
            {activeQuiz.time_limit_minutes && <span>{t('quizzes.timeLimit')}: {activeQuiz.time_limit_minutes} min</span>}
            <span>{t('quizzes.maxScore')}: {activeQuiz.max_score}</span>
          </div>
        </div>

        {result ? (
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">{t('quizzes.completed')}</h2>
            <p className="text-3xl font-extrabold text-green-700 dark:text-green-300">{result.score} / {result.max_score}</p>
            <button onClick={() => setActiveQuiz(null)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 cursor-pointer">{t('quizzes.backToList')}</button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeQuiz.questions?.map((q, i) => (
              <div key={q.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
                <p className="font-bold text-purple-900 dark:text-purple-100 mb-3">{i + 1}. {q.question_text}</p>
                {q.question_type === 'mcq' && (
                  <div className="space-y-2">
                    {JSON.parse(q.options).map(opt => (
                      <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-purple-100 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer">
                        <input type="radio" name={`q_${q.id}`} value={opt} onChange={() => handleAnswer(q.id, opt)}
                          className="text-purple-600" checked={answers[q.id] === opt} />
                        <span className="text-sm text-purple-800 dark:text-purple-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.question_type === 'true_false' && (
                  <div className="flex gap-3">
                    {JSON.parse(q.options).map(opt => (
                      <label key={opt} className="flex items-center gap-2 p-3 rounded-xl border border-purple-100 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer">
                        <input type="radio" name={`q_${q.id}`} value={opt} onChange={() => handleAnswer(q.id, opt)}
                          className="text-purple-600" checked={answers[q.id] === opt} />
                        <span className="text-sm text-purple-800 dark:text-purple-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="text-xs text-purple-400 mt-2">{q.points} {t('quizzes.points')}</div>
              </div>
            ))}
            <button onClick={submitQuiz}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors cursor-pointer">
              {t('quizzes.submitQuiz')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('quizzes.title')}</h1>
        </div>
        {canManage && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors cursor-pointer">
            + New Quiz
          </button>
        )}
      </div>

      {message && <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {quizzes.length > 0 ? (
        <div className="space-y-4">
          {quizzes.map(q => (
            <div key={q.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">{q.title}</h3>
                <p className="text-sm text-purple-600/60 dark:text-purple-300/60">{q.course_title}</p>
                {q.description && <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">{q.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-purple-500 dark:text-purple-400">
                  {q.time_limit_minutes && <span>{q.time_limit_minutes} min</span>}
                  <span>{t('quizzes.maxScore')}: {q.max_score}</span>
                  {q.due_date && <span>{t('quizzes.due')}: {q.due_date}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <button onClick={() => openEdit(q)}
                      className="px-3 py-2 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 rounded-xl text-sm hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(q.id)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer">
                      Delete
                    </button>
                  </>
                )}
                <button onClick={() => startQuiz(q.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap">
                  {t('quizzes.startQuiz')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('quizzes.noQuizzes')}</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editQuiz ? 'Edit Quiz' : 'New Quiz'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Course *</label>
            <select value={form.course_id} onChange={e => setField('course_id', e.target.value)}
              className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select a course</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setField('title', e.target.value)}
              className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Quiz title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)}
              className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Time Limit (min)</label>
              <input type="number" value={form.time_limit_minutes} onChange={e => setField('time_limit_minutes', e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. 30" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Max Score</label>
              <input type="number" value={form.max_score} onChange={e => setField('max_score', e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="100" min="1" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setField('due_date', e.target.value)}
              className="w-full px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-xl bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-xl text-sm hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : editQuiz ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone." />
    </div>
  );
}
