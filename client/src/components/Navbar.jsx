import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useFont } from '../context/FontContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const { fontSize, setFontSize } = useFont();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const toggleLanguage = () => setLocale(locale === 'mm' ? 'en' : 'mm');

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'bg-white/20 text-white'
        : 'text-purple-100 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <nav className="sticky top-3 left-3 right-3 z-50">
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20 rounded-2xl">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-1">
              {/* School SVG Icon */}
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
              </svg>
              <Link to="/" className="text-lg font-bold tracking-tight" onClick={closeMobileMenu}>
                {t('nav.schoolHub')}
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/announcements" className={navLinkClass('/announcements')}>
                {t('nav.announcements')}
              </Link>
              <Link to="/classes" className={navLinkClass('/classes')}>
                {t('nav.classes')}
              </Link>
              <Link to="/curriculum" className={navLinkClass('/curriculum')}>
                {t('nav.curriculum')}
              </Link>
              <Link to="/contact" className={navLinkClass('/contact')}>
                {t('nav.contact')}
              </Link>

              {isAuthenticated && (
                <>
                  <Link to="/courses" className={navLinkClass('/courses')}>
                    {t('courses.title')}
                  </Link>
                  <Link to="/assignments" className={navLinkClass('/assignments')}>
                    {t('assignments.title')}
                  </Link>
                  <Link to="/quizzes" className={navLinkClass('/quizzes')}>
                    {t('quizzes.title')}
                  </Link>
                  <Link to="/gradebook" className={navLinkClass('/gradebook')}>
                    {t('gradebook.title')}
                  </Link>
                  <Link to="/reports" className={navLinkClass('/reports')}>
                    Reports
                  </Link>
                </>
              )}

              <div className="w-px h-6 bg-white/20 mx-1" />

              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                    {t('nav.dashboard')}
                  </Link>
                  <span className="text-purple-200 text-xs px-2 py-1 bg-white/10 rounded-full">
                    {user.name} ({t(`common.role.${user.role}`)})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={navLinkClass('/login')}>
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}

              {/* Font Size Toggle */}
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden ml-1" role="group" aria-label={t('common.fontSize.label')}>
                {['sm', 'md', 'lg'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-2 py-1.5 text-xs font-bold transition-colors duration-200 cursor-pointer ${
                      fontSize === size ? 'bg-white/30 text-white' : 'text-purple-200 hover:bg-white/10'
                    }`}
                    style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '13px' : '16px' }}
                    title={size === 'sm' ? 'Small text' : size === 'md' ? 'Default text' : 'Large text'}
                  >
                    A
                  </button>
                ))}
              </div>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ml-1"
                title={locale === 'mm' ? 'Switch to English' : 'မြန်မာဘာသာသို့ပြောင်းပါ'}
              >
                <span className="text-sm">{locale === 'mm' ? '🇲🇲' : '🇬🇧'}</span>
                <span>{locale === 'mm' ? 'မြန်မာ' : 'EN'}</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-1">
              {/* Font Size Toggle (mobile) */}
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden" role="group" aria-label={t('common.fontSize.label')}>
                {['sm', 'md', 'lg'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-1.5 py-1.5 text-xs font-bold transition-colors duration-200 cursor-pointer ${
                      fontSize === size ? 'bg-white/30 text-white' : 'text-purple-200 hover:bg-white/10'
                    }`}
                    style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '13px' : '16px' }}
                  >
                    A
                  </button>
                ))}
              </div>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer"
                title={locale === 'mm' ? 'Switch to English' : 'မြန်မာဘာသာသို့ပြောင်းပါ'}
              >
                <span className="text-sm">{locale === 'mm' ? '🇲🇲' : '🇬🇧'}</span>
                <span>{locale === 'mm' ? 'မြန်မာ' : 'EN'}</span>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-3 pt-2 pb-3 space-y-1">
              <Link to="/announcements" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                {t('nav.announcements')}
              </Link>
              <Link to="/classes" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                {t('nav.classes')}
              </Link>
              <Link to="/curriculum" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                {t('nav.curriculum')}
              </Link>
              <Link to="/contact" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                {t('nav.contact')}
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/courses" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                    {t('courses.title')}
                  </Link>
                  <Link to="/assignments" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                    {t('assignments.title')}
                  </Link>
                  <Link to="/quizzes" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                    {t('quizzes.title')}
                  </Link>
                  <Link to="/gradebook" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                    {t('gradebook.title')}
                  </Link>
                  <Link to="/reports" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                    Reports
                  </Link>
                </>
              )}
              <div className="border-t border-white/10 my-1" />
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                    {t('nav.dashboard')}
                  </Link>
                  <div className="px-3 py-2 text-purple-200 text-xs">
                    {user.name} ({t(`common.role.${user.role}`)})
                  </div>
                  <button onClick={handleLogout} className="block w-full text-left hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 cursor-pointer min-h-[44px]">
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block hover:bg-white/10 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200" onClick={closeMobileMenu}>
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="block bg-white text-purple-700 hover:bg-purple-50 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200" onClick={closeMobileMenu}>
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
