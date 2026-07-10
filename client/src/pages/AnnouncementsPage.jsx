import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import { toast } from 'sonner';

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const { user, isAdmin, isTeacher } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', grade_id: '', class_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterGrade) params.set('grade_id', filterGrade);
    if (filterClass) params.set('class_id', filterClass);
    api.get(`/announcements?${params}`)
      .then(r => setAnnouncements(r.data.announcements))
      .catch(() => setError(t('announcements.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
    // Load grades and classes for filters
    api.get('/curriculum').then(r => {
      const allGrades = [];
      r.data.levels?.forEach(l => l.grades?.forEach(g => allGrades.push(g)));
      setGrades(allGrades);
    }).catch(() => toast.error('Failed to load grades'));
    api.get('/classes').then(r => setClasses(r.data.classes || r.data || [])).catch(() => toast.error('Failed to load classes'));
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [filterGrade, filterClass]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/announcements', {
        title: form.title,
        content: form.content,
        grade_id: form.grade_id || null,
        class_id: form.class_id || null,
      });
      setShowForm(false);
      setForm({ title: '', content: '', grade_id: '', class_id: '' });
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const isNew = (dateStr) => {
    const created = new Date(dateStr);
    const now = new Date();
    return (now - created) < 24 * 60 * 60 * 1000;
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-purple-500 dark:text-purple-400 mb-6">
        <Link to="/" className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer">{t('nav.home')}</Link>
        <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        <span className="text-purple-800 dark:text-purple-200 font-medium">{t('announcements.title')}</span>
      </nav>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L3 9v6l8 4V5z"/><path d="M15 7.5a4.5 4.5 0 010 9"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('announcements.title')}</h1>
        </div>
        {(isAdmin || isTeacher) && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 cursor-pointer">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            {t('announcements.create')}
          </button>
        )}
      </div>

      {/* Create Announcement Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 mb-6">
          <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">{t('announcements.createNew')}</h3>
          <div className="space-y-3">
            <input type="text" placeholder={t('announcements.titlePlaceholder')} value={form.title}
              onChange={e => setForm({...form, title: e.target.value})} required
              className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            <textarea placeholder={t('announcements.contentPlaceholder')} value={form.content} rows={4}
              onChange={e => setForm({...form, content: e.target.value})} required
              className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.grade_id} onChange={e => setForm({...form, grade_id: e.target.value})}
                className="px-3 py-2 border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm text-purple-900 dark:text-purple-100 cursor-pointer">
                <option value="">{t('announcements.allGrades')}</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})}
                className="px-3 py-2 border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm text-purple-900 dark:text-purple-100 cursor-pointer">
                <option value="">{t('announcements.allClasses')}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">{t('common.cancel')}</button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
                {submitting ? t('announcements.publishing') : t('announcements.publish')}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="px-3 py-2 border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm text-purple-900 dark:text-purple-100 cursor-pointer">
          <option value="">{t('announcements.allGrades')}</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="px-3 py-2 border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm text-purple-900 dark:text-purple-100 cursor-pointer">
          <option value="">{t('announcements.allClasses')}</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filterGrade || filterClass) && (
          <button onClick={() => { setFilterGrade(''); setFilterClass(''); }}
            className="px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer">
            {t('announcements.clearFilters')}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 hover:shadow-lg transition-shadow relative">
              {isNew(a.created_at) && (
                <span className="absolute top-4 right-4 px-2 py-0.5 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">
                  {t('announcements.new')}
                </span>
              )}
              <div className="flex items-center gap-2 text-xs text-purple-500 dark:text-purple-400 mb-3">
                <span>{new Date(a.created_at).toLocaleDateString()}</span>
                {a.author_name && <><span>•</span><span>{a.author_name}</span></>}
              </div>
              {(a.grade_name || a.class_name) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {a.grade_name && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs rounded-full">{a.grade_name}</span>}
                  {a.class_name && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs rounded-full">{a.class_name}</span>}
                </div>
              )}
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">{a.title}</h2>
              <p className="text-sm text-purple-600/70 dark:text-purple-300/70 mb-4 line-clamp-3">{a.content}</p>
              <Link to={`/announcements/${a.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 transition-colors">
                {t('announcements.readMore')}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18"/></svg>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 dark:text-purple-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5L3 9v6l8 4V5z"/><path d="M19 9v6"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('announcements.noAnnouncements')}</p>
        </div>
      )}
    </div>
  );
}
