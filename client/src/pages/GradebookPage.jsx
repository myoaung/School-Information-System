import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function GradebookPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher, user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ assignment_score: '', quiz_score: '', exam_score: '', final_grade: '', gpa: '' });
  const [message, setMessage] = useState('');
  const [gradeError, setGradeError] = useState(null);

  const fetchGrades = () => {
    setLoading(true);
    const url = user.role === 'student' ? `/gradebook/student/${user.id}` : '/gradebook';
    api.get(url)
      .then(r => setGrades(r.data.grades))
      .catch(() => setError(t('gradebook.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGrades(); }, []);

  const handleSave = (studentId, courseId) => {
    setGradeError(null);
    api.post('/gradebook', {
      student_id: studentId,
      course_id: courseId,
      assignment_score: Number(form.assignment_score) || 0,
      quiz_score: Number(form.quiz_score) || 0,
      exam_score: Number(form.exam_score) || 0,
      final_grade: form.final_grade || null,
      gpa: Number(form.gpa) || null,
    })
      .then(() => { setMessage(t('gradebook.saved')); setEditing(null); fetchGrades(); })
      .catch(() => { setError(t('gradebook.saveError')); setGradeError(t('gradebook.saveError')); });
  };

  const startEdit = (g) => {
    setEditing(`${g.student_id}-${g.course_id}`);
    setForm({
      assignment_score: g.assignment_score || '',
      quiz_score: g.quiz_score || '',
      exam_score: g.exam_score || '',
      final_grade: g.final_grade || '',
      gpa: g.gpa || '',
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('gradebook.title')}</h1>
      </div>

      {message && <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-300 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
      {gradeError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">{gradeError}</p>
          <button onClick={() => { setGradeError(null); if (editing) { const [sid, cid] = editing.split('-'); handleSave(Number(sid), Number(cid)); } }} className="text-red-600 dark:text-red-400 text-sm underline mt-1 hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {grades.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('gradebook.title')}</caption>
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                  {(isAdmin || isTeacher) && <th scope="col" className="text-left px-4 py-3 font-semibold">{t('gradebook.student')}</th>}
                  <th scope="col" className="text-left px-4 py-3 font-semibold">{t('gradebook.course')}</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold">{t('gradebook.subject')}</th>
                  <th scope="col" className="text-center px-4 py-3 font-semibold">{t('gradebook.assignmentScore')}</th>
                  <th scope="col" className="text-center px-4 py-3 font-semibold">{t('gradebook.quizScore')}</th>
                  <th scope="col" className="text-center px-4 py-3 font-semibold">{t('gradebook.examScore')}</th>
                  <th scope="col" className="text-center px-4 py-3 font-semibold">{t('gradebook.finalGrade')}</th>
                  <th scope="col" className="text-center px-4 py-3 font-semibold">{t('gradebook.gpa')}</th>
                  {(isAdmin || isTeacher) && <th scope="col" className="text-center px-4 py-3 font-semibold">{t('assignments.grade')}</th>}
                </tr>
              </thead>
              <tbody>
                {grades.map(g => {
                  const editKey = `${g.student_id}-${g.course_id}`;
                  const isEditing = editing === editKey;
                  return (
                    <tr key={g.id} className="border-t border-purple-100 dark:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-950/20">
                      {(isAdmin || isTeacher) && <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">{g.student_name}</td>}
                      <td className="px-4 py-3 text-purple-800 dark:text-purple-200">{g.course_title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">{g.subject_code}</span>
                      </td>
                      {isEditing ? (
                        <>
                          <td className="px-2 py-3 text-center">
                            <input type="number" value={form.assignment_score} onChange={e => setForm({...form, assignment_score: e.target.value})}
                              aria-label={t('gradebook.assignmentScore')}
                              className="w-16 px-2 py-1 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-lg text-sm text-center" />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <input type="number" value={form.quiz_score} onChange={e => setForm({...form, quiz_score: e.target.value})}
                              aria-label={t('gradebook.quizScore')}
                              className="w-16 px-2 py-1 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-lg text-sm text-center" />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <input type="number" value={form.exam_score} onChange={e => setForm({...form, exam_score: e.target.value})}
                              aria-label={t('gradebook.examScore')}
                              className="w-16 px-2 py-1 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-lg text-sm text-center" />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <input type="text" value={form.final_grade} onChange={e => setForm({...form, final_grade: e.target.value})}
                              aria-label={t('gradebook.finalGrade')}
                              className="w-16 px-2 py-1 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-lg text-sm text-center" placeholder="A" />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <input type="number" step="0.01" value={form.gpa} onChange={e => setForm({...form, gpa: e.target.value})}
                              aria-label={t('gradebook.gpa')}
                              className="w-16 px-2 py-1 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-lg text-sm text-center" placeholder="4.0" />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => handleSave(g.student_id, g.course_id)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 cursor-pointer">{t('gradebook.save')}</button>
                              <button onClick={() => setEditing(null)}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer">✕</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{g.assignment_score || '—'}</td>
                          <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{g.quiz_score || '—'}</td>
                          <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{g.exam_score || '—'}</td>
                          <td className="px-4 py-3 text-center font-bold text-purple-900 dark:text-purple-100">{g.final_grade || '—'}</td>
                          <td className="px-4 py-3 text-center font-bold text-purple-900 dark:text-purple-100">{g.gpa || '—'}</td>
                          {(isAdmin || isTeacher) && (
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => startEdit(g)}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 text-xs font-medium cursor-pointer">{t('assignments.grade')}</button>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('gradebook.noGrades')}</p>
        </div>
      )}
    </div>
  );
}
