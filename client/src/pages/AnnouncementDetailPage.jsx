import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const { t, formatDate } = useTranslation();
  const [ann, setAnn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/announcements/${id}`).then(r => setAnn(r.data.announcement)).catch(() => setError(t('announcements.loadDetailError'))).finally(() => setLoading(false)); }, [id]);
  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );
  if (error || !ann) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <p className="text-red-500 dark:text-red-400 text-lg mb-4">{error || t('announcements.notFound')}</p>
      <Link to="/announcements" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-semibold cursor-pointer">{t('announcements.backToAnnouncements')}</Link>
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-purple-500 dark:text-purple-400 mb-6">
        <Link to="/" className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer">{t('nav.home')}</Link>
        <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        <Link to="/announcements" className="hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer">{t('announcements.title')}</Link>
        <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
        <span className="text-purple-800 dark:text-purple-200 font-medium truncate max-w-[250px]">{ann.title}</span>
      </nav>
      <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm text-purple-500 dark:text-purple-400 mb-4">
          <span className="bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-full text-xs font-medium">{formatDate(ann.created_at)}</span>
          <span className="text-purple-600/60 dark:text-purple-300/60">{t('announcements.by')} {ann.author_name}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mb-6">{ann.title}</h1>
        <div className="prose max-w-none text-purple-800/80 dark:text-purple-200/80 leading-relaxed">
          {ann.content.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
        </div>
      </article>
    </div>
  );
}
