import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

const AnnouncementCard = React.memo(function AnnouncementCard({ announcement }) {
  const { t, formatDateShort } = useTranslation();

  return (
    <Link
      to={`/announcements/${announcement.id}`}
      className="card-interactive bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden block cursor-pointer"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-full font-medium">
            {formatDateShort(announcement.created_at)}
          </span>
          <span className="text-xs text-purple-600/60 dark:text-purple-300/60">{announcement.author_name}</span>
        </div>
        <h3 className="text-lg font-bold mb-2 text-purple-900 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {announcement.title}
        </h3>
        <p className="text-purple-700/60 dark:text-purple-300/60 text-sm line-clamp-2 leading-relaxed">
          {announcement.content}
        </p>
        <div className="mt-4 flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold text-sm">
          {t('announcements.readMore')}
          <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </Link>
  );
});

export default AnnouncementCard;
