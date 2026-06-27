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
      <p className="text-red-500 text-lg mb-4">{error || t('announcements.notFound')}</p>
      <Link to="/announcements" className="text-purple-600 hover:text-purple-800 font-semibold cursor-pointer">{t('announcements.backToAnnouncements')}</Link>
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/announcements" className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 mb-6 font-medium transition-colors cursor-pointer">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        {t('announcements.backToAnnouncements')}
      </Link>
      <article className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm text-purple-500 mb-4">
          <span className="bg-purple-50 px-2.5 py-1 rounded-full text-xs font-medium">{formatDate(ann.created_at)}</span>
          <span className="text-purple-600/60">{t('announcements.by')} {ann.author_name}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 mb-6">{ann.title}</h1>
        <div className="prose max-w-none text-purple-800/80 leading-relaxed">
          {ann.content.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
        </div>
      </article>
    </div>
  );
}
