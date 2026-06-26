import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const { t, formatDate } = useTranslation();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const res = await api.get(`/announcements/${id}`);
      setAnnouncement(res.data.announcement);
    } catch (err) {
      setError(t('announcements.loadDetailError'));
      console.error('Error fetching announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">{error || t('announcements.notFound')}</p>
          <Link to="/announcements" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            {t('announcements.backToAnnouncements')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/announcements" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        {t('announcements.backToAnnouncements')}
      </Link>
      <article className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-4">{announcement.title}</h1>
        <div className="flex items-center text-gray-500 mb-6">
          <span>{t('announcements.by')} {announcement.author_name}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(announcement.created_at)}</span>
        </div>
        <div className="prose max-w-none">
          {announcement.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
