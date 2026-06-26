import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import AnnouncementCard from '../components/AnnouncementCard';
import { useTranslation } from '../context/LanguageContext';

/* SVG Icons — no emojis per UI/UX guidelines */
const MegaphoneIcon = () => (
  <svg className="w-10 h-10 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5L3 9v6l8 4V5z"/>
    <path d="M15 7.5a4.5 4.5 0 010 9"/>
    <path d="M19 5.5a8.5 8.5 0 010 13"/>
  </svg>
);

const BookIcon = () => (
  <svg className="w-10 h-10 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="14" y2="10"/>
  </svg>
);

const UsersIcon = () => (
  <svg className="w-10 h-10 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const ArrowRight = () => (
  <svg className="w-4 h-4 ml-1 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function HomePage() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then(res => setAnnouncements(res.data.announcements.slice(0, 3)))
      .catch(err => console.error('Error fetching announcements:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-600 text-white pt-6 pb-24">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-5 left-10 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-purple-100 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {t('home.hero.getStarted')}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-lg md:text-xl mb-10 text-purple-100 max-w-2xl mx-auto leading-relaxed">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/announcements"
              className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L3 9v6l8 4V5z"/>
                  <path d="M15 7.5a4.5 4.5 0 010 9"/>
                </svg>
                {t('home.hero.viewAnnouncements')}
              </span>
            </Link>
            <Link
              to="/register"
              className="border-2 border-white/60 hover:border-white text-white hover:bg-white/10 px-8 py-3.5 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              {t('home.hero.getStarted')}
            </Link>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="#FAF5FF" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40c240-30 480-30 720 0s480 30 720 0v20H0z"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-purple-900">
            {t('home.features.title')}
          </h2>
          <p className="text-center text-purple-600/70 mb-12 max-w-md mx-auto">
            {t('home.hero.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {icon: <MegaphoneIcon />, title: t('home.features.stayInformed.title'), desc: t('home.features.stayInformed.desc')},
              {icon: <BookIcon />, title: t('home.features.classInfo.title'), desc: t('home.features.classInfo.desc')},
              {icon: <UsersIcon />, title: t('home.features.connect.title'), desc: t('home.features.connect.desc')},
            ].map((feature, i) => (
              <div key={i} className="card-interactive bg-white rounded-2xl shadow-md shadow-purple-100/50 p-8 cursor-pointer">
                <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-purple-900">{feature.title}</h3>
                <p className="text-purple-700/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Announcements */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-purple-900 mb-2">
                {t('home.recent.title')}
              </h2>
              <p className="text-purple-600/60">{t('home.hero.subtitle')}</p>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton rounded-2xl h-48" />
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map(announcement => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-purple-50/50 rounded-2xl">
              <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L3 9v6l8 4V5z"/>
                <path d="M15 7.5a4.5 4.5 0 010 9"/>
              </svg>
              <p className="text-purple-500">{t('home.recent.noAnnouncements')}</p>
            </div>
          )}
          <div className="text-center mt-10">
            <Link
              to="/announcements"
              className="inline-flex items-center text-purple-600 hover:text-purple-800 font-semibold transition-colors duration-200 cursor-pointer"
            >
              {t('home.recent.viewAll')}
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
