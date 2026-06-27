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
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-800 via-purple-600 to-fuchsia-700 text-white pt-14 pb-36">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, white 1px, transparent 0)',
            backgroundSize: '50px 50px',
          }} />
        </div>
        {/* Ambient glows */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-fuchsia-400/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-amber-400/10 rounded-full blur-[80px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-purple-100 mb-6 border border-white/10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                </span>
                {'✨'} Myanmar Basic Education Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                {t('home.hero.title')}
              </h1>

              <p className="text-lg md:text-xl mb-10 text-purple-100/90 max-w-lg lg:max-w-none mx-auto lg:mx-0 leading-relaxed">
                {t('home.hero.subtitle')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/announcements"
                  className="group bg-white text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-xl shadow-purple-900/25 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 5L3 9v6l8 4V5z"/>
                      <path d="M15 7.5a4.5 4.5 0 010 9"/>
                    </svg>
                    {t('home.hero.viewAnnouncements')}
                  </span>
                </Link>
                <Link
                  to="/register"
                  className="border-2 border-white/50 hover:border-white text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                >
                  {t('home.hero.getStarted')}
                </Link>
              </div>
            </div>

            {/* Right: Decorative illustration */}
            <div className="hidden lg:flex justify-center relative">
              {/* Central layered card stack */}
              <div className="relative w-72 h-72 lg:w-80 lg:h-80">
                <div className="absolute inset-0 bg-white/5 rounded-[2rem] rotate-6 backdrop-blur-sm border border-white/10 shadow-lg" />
                <div className="absolute inset-3 bg-white/8 rounded-[1.75rem] -rotate-3 backdrop-blur-sm border border-white/15 shadow-lg" />
                <div className="absolute inset-6 bg-white/10 rounded-[1.5rem] rotate-2 backdrop-blur-sm border border-white/15 shadow-xl flex flex-col items-center justify-center">
                  <svg className="w-28 h-28 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                  </svg>
                  <span className="text-white/50 text-sm font-medium mt-2">SchoolHub</span>
                </div>
              </div>

              {/* Floating badge: Online */}
              <div className="absolute -top-2 -left-2 bg-white/15 backdrop-blur-lg rounded-xl px-3.5 py-2.5 border border-white/20 shadow-lg animate-bounce" style={{animationDuration: '3.5s'}}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-400/15 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <span className="text-sm font-semibold text-white">100% Online</span>
                </div>
              </div>

              {/* Floating badge: Multi-Role */}
              <div className="absolute -bottom-0 -right-2 bg-white/15 backdrop-blur-lg rounded-xl px-3.5 py-2.5 border border-white/20 shadow-lg animate-bounce" style={{animationDuration: '4.5s', animationDelay: '0.8s'}}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-400/15 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  </div>
                  <span className="text-sm font-semibold text-white">Multi-Role</span>
                </div>
              </div>

              {/* Floating badge: Bilingual */}
              <div className="absolute top-1/3 -right-6 bg-white/15 backdrop-blur-lg rounded-xl px-3.5 py-2.5 border border-white/20 shadow-lg animate-bounce" style={{animationDuration: '4s', animationDelay: '1.6s'}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🇲🇲</span>
                  <span className="text-sm font-semibold text-white">EN / မြန်မာ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 max-w-2xl lg:max-w-none mx-auto">
            {[
              { value: '22+', label: 'Database Tables' },
              { value: '21', label: 'Feature Pages' },
              { value: '3', label: 'User Roles' },
              { value: 'EN/MM', label: 'Bilingual' },
            ].map((stat, i) => (
              <div key={i} className="group bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-sm rounded-2xl px-5 py-4 text-center border border-white/[0.08] hover:border-white/20 transition-all cursor-default">
                <p className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
                <p className="text-[11px] lg:text-xs text-purple-200/70 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 leading-[0]">
          <svg viewBox="0 0 1440 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 lg:h-20 text-[var(--color-bg)]">
            <path d="M0 40c240-40 480-40 720 0s480 40 720 0v40H0z"/>
          </svg>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="py-24 bg-purple-50/50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-purple-900 dark:text-purple-100">
              {t('home.features.title')}
            </h2>
            <p className="text-purple-600/60 dark:text-purple-300/60 max-w-lg mx-auto text-lg">
              Everything you need to manage and participate in your school community
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <MegaphoneIcon />, title: t('home.features.stayInformed.title'), desc: t('home.features.stayInformed.desc') },
              { icon: <BookIcon />, title: t('home.features.classInfo.title'), desc: t('home.features.classInfo.desc') },
              { icon: <UsersIcon />, title: t('home.features.connect.title'), desc: t('home.features.connect.desc') },
            ].map((feature, i) => (
              <div key={i} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md shadow-purple-100/50 p-8 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/50 group-hover:bg-purple-100 rounded-xl flex items-center justify-center mb-5 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-purple-900 dark:text-purple-100">{feature.title}</h3>
                <p className="text-purple-700/60 dark:text-purple-300/60 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ RECENT ANNOUNCEMENTS ============ */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-purple-900 dark:text-purple-100 mb-2">
                {t('home.recent.title')}
              </h2>
              <p className="text-purple-600/60 dark:text-purple-300/60 text-lg">Latest updates from your school</p>
            </div>
            <Link
              to="/announcements"
              className="hidden sm:inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 font-semibold transition-colors text-sm"
            >
              {t('home.recent.viewAll')}
              <ArrowRight />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton rounded-2xl h-52" />
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
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
          <div className="text-center mt-10 sm:hidden">
            <Link
              to="/announcements"
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 font-semibold transition-colors"
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
