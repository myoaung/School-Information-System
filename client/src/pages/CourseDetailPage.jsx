import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { isAdmin, isTeacher } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('lessons');

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then(r => setCourse(r.data.course))
      .catch(() => setError(t('courses.loadError')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  if (error || !course) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">{error || t('courses.notFound')}</div>
    </div>
  );

  const tabs = [
    { key: 'lessons', label: t('courses.lessons'), count: course.lessons?.length || 0 },
    { key: 'resources', label: t('courses.resources'), count: course.resources?.length || 0 },
    { key: 'assignments', label: t('courses.assignments'), count: course.assignments?.length || 0 },
    { key: 'quizzes', label: t('courses.quizzes'), count: course.quizzes?.length || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/courses" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 text-sm font-medium mb-4 inline-block">← {t('courses.backToList')}</Link>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">{course.subject_name}</span>
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">{course.class_name}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-purple-900 dark:text-purple-100 mb-2">{course.title}</h1>
        {course.description && <p className="text-purple-600/60 dark:text-purple-300/60">{course.description}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-purple-50 dark:bg-purple-950/40 p-1 rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              tab === t.key ? 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
            }`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
        {tab === 'lessons' && (
          course.lessons?.length ? (
            <div className="space-y-4">
              {course.lessons.map((l, i) => (
                <div key={l.id} className="border border-purple-100 dark:border-purple-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg flex items-center justify-center text-sm font-bold">{i + 1}</span>
                    <div>
                      <h3 className="font-bold text-purple-900 dark:text-purple-100">{l.title}</h3>
                      {l.content && <p className="text-sm text-purple-600/60 dark:text-purple-300/60 mt-1">{l.content}</p>}
                      {l.duration_minutes && <span className="text-xs text-purple-400 dark:text-purple-400 mt-1 inline-block">{l.duration_minutes} min</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-purple-500 dark:text-purple-400 text-center py-8">{t('courses.noLessons')}</p>
        )}

        {tab === 'resources' && (
          course.resources?.length ? (
            <div className="space-y-3">
              {course.resources.map(r => (
                <div key={r.id} className="flex items-center gap-3 border border-purple-100 dark:border-purple-800 rounded-xl p-4">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium uppercase">{r.type}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-purple-900 dark:text-purple-100">{r.title}</h3>
                    {r.description && <p className="text-xs text-purple-500 dark:text-purple-400">{r.description}</p>}
                  </div>
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 text-sm font-medium">{t('courses.open')} →</a>}
                </div>
              ))}
            </div>
          ) : <p className="text-purple-500 dark:text-purple-400 text-center py-8">{t('courses.noResources')}</p>
        )}

        {tab === 'assignments' && (
          course.assignments?.length ? (
            <div className="space-y-3">
              {course.assignments.map(a => (
                <Link key={a.id} to={`/assignments`} className="block border border-purple-100 dark:border-purple-800 rounded-xl p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                  <h3 className="font-bold text-purple-900 dark:text-purple-100">{a.title}</h3>
                  {a.description && <p className="text-sm text-purple-600/60 dark:text-purple-300/60 mt-1">{a.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-purple-500 dark:text-purple-400">
                    {a.due_date && <span>{t('courses.due')}: {a.due_date}</span>}
                    <span>{t('courses.maxScore')}: {a.max_score}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : <p className="text-purple-500 dark:text-purple-400 text-center py-8">{t('courses.noAssignments')}</p>
        )}

        {tab === 'quizzes' && (
          course.quizzes?.length ? (
            <div className="space-y-3">
              {course.quizzes.map(q => (
                <Link key={q.id} to={`/quizzes`} className="block border border-purple-100 dark:border-purple-800 rounded-xl p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                  <h3 className="font-bold text-purple-900 dark:text-purple-100">{q.title}</h3>
                  {q.description && <p className="text-sm text-purple-600/60 dark:text-purple-300/60 mt-1">{q.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-purple-500 dark:text-purple-400">
                    {q.time_limit_minutes && <span>{q.time_limit_minutes} min</span>}
                    <span>{t('courses.maxScore')}: {q.max_score}</span>
                    {q.due_date && <span>{t('courses.due')}: {q.due_date}</span>}
                  </div>
                </Link>
              ))}
            </div>
          ) : <p className="text-purple-500 dark:text-purple-400 text-center py-8">{t('courses.noQuizzes')}</p>
        )}
      </div>
    </div>
  );
}
