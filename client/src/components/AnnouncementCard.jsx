import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

export default function AnnouncementCard({ announcement }) {
  const { t, formatDateShort } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{formatDateShort(announcement.created_at)}</span>
          <span className="text-sm text-blue-600">{announcement.author_name}</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">
          <Link
            to={`/announcements/${announcement.id}`}
            className="text-gray-900 hover:text-blue-600"
          >
            {announcement.title}
          </Link>
        </h3>
        <p className="text-gray-600 line-clamp-3">
          {announcement.content}
        </p>
        <Link
          to={`/announcements/${announcement.id}`}
          className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          {t('announcements.readMore')}
        </Link>
      </div>
    </div>
  );
}
