import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function QuizzesPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher, user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/quizzes')
      .then(r => setQuizzes(r.data.quizzes))
      .catch(() => setError(t('quizzes.loadError')))
      .finally(() => setLoading(false));
  }, []);

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
        <button onClick={() => setActiveQuiz(null)} className="text-purple-600 hover:text-purple-800 text-sm font-medium mb-4 cursor-pointer">← {t('quizzes.backToList')}</button>

        <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
          <h1 className="text-2xl font-extrabold text-purple-900 mb-2">{activeQuiz.title}</h1>
          {activeQuiz.description && <p className="text-purple-600/60">{activeQuiz.description}</p>}
          <div className="flex gap-4 mt-3 text-xs text-purple-500">
            {activeQuiz.time_limit_minutes && <span>{t('quizzes.timeLimit')}: {activeQuiz.time_limit_minutes} min</span>}
            <span>{t('quizzes.maxScore')}: {activeQuiz.max_score}</span>
          </div>
        </div>

        {result ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-green-800 mb-2">{t('quizzes.completed')}</h2>
            <p className="text-3xl font-extrabold text-green-700">{result.score} / {result.max_score}</p>
            <button onClick={() => setActiveQuiz(null)} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 cursor-pointer">{t('quizzes.backToList')}</button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeQuiz.questions?.map((q, i) => (
              <div key={q.id} className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
                <p className="font-bold text-purple-900 mb-3">{i + 1}. {q.question_text}</p>
                {q.question_type === 'mcq' && (
                  <div className="space-y-2">
                    {JSON.parse(q.options).map(opt => (
                      <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-purple-100 hover:bg-purple-50 cursor-pointer">
                        <input type="radio" name={`q_${q.id}`} value={opt} onChange={() => handleAnswer(q.id, opt)}
                          className="text-purple-600" checked={answers[q.id] === opt} />
                        <span className="text-sm text-purple-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.question_type === 'true_false' && (
                  <div className="flex gap-3">
                    {JSON.parse(q.options).map(opt => (
                      <label key={opt} className="flex items-center gap-2 p-3 rounded-xl border border-purple-100 hover:bg-purple-50 cursor-pointer">
                        <input type="radio" name={`q_${q.id}`} value={opt} onChange={() => handleAnswer(q.id, opt)}
                          className="text-purple-600" checked={answers[q.id] === opt} />
                        <span className="text-sm text-purple-800">{opt}</span>
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900">{t('quizzes.title')}</h1>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {quizzes.length > 0 ? (
        <div className="space-y-4">
          {quizzes.map(q => (
            <div key={q.id} className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-purple-900">{q.title}</h3>
                <p className="text-sm text-purple-600/60">{q.course_title}</p>
                {q.description && <p className="text-sm text-purple-700 mt-1">{q.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-purple-500">
                  {q.time_limit_minutes && <span>{q.time_limit_minutes} min</span>}
                  <span>{t('quizzes.maxScore')}: {q.max_score}</span>
                  {q.due_date && <span>{t('quizzes.due')}: {q.due_date}</span>}
                </div>
              </div>
              <button onClick={() => startQuiz(q.id)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap">
                {t('quizzes.startQuiz')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-purple-500">{t('quizzes.noQuizzes')}</p>
        </div>
      )}
    </div>
  );
}
