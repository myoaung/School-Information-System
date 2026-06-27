import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function AssignmentsPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [grading, setGrading] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [message, setMessage] = useState('');

  const fetchAssignments = () => {
    setLoading(true);
    api.get('/assignments')
      .then(r => setAssignments(r.data.assignments))
      .catch(() => setError(t('assignments.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleSubmit = (id) => {
    setSubmitting(id);
    api.post(`/assignments/${id}/submit`, { content: submitContent })
      .then(() => { setMessage(t('assignments.submitted')); setSubmitContent(''); fetchAssignments(); })
      .catch(err => setError(err.response?.data?.error || t('assignments.submitError')))
      .finally(() => setSubmitting(null));
  };

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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('assignments.title')}</h1>
      </div>

      {message && <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">{a.title}</h3>
                  <p className="text-sm text-purple-600/60 dark:text-purple-300/60 mt-1">{a.course_title}</p>
                  {a.description && <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">{a.description}</p>}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-purple-500 dark:text-purple-400">
                    {a.due_date && <span>{t('assignments.due')}: {a.due_date}</span>}
                    <span>{t('assignments.maxScore')}: {a.max_score}</span>
                    <span>{t('assignments.createdBy')}: {a.created_by_name}</span>
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
    </div>
  );
}
