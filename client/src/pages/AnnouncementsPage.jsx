import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AnnouncementCard from '../components/AnnouncementCard';
import { useTranslation } from '../context/LanguageContext';

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/announcements').then(r => setAnnouncements(r.data.announcements)).catch(() => setError(t('announcements.loadError'))).finally(() => setLoading(false)); }, []);
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
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L3 9v6l8 4V5z"/><path d="M15 7.5a4.5 4.5 0 010 9"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('announcements.title')}</h1>
      </div>
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
      {announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map(a => <AnnouncementCard key={a.id} announcement={a} />)}
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
