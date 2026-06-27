import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useFont } from '../context/FontContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const { fontSize, setFontSize } = useFont();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setMoreMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleLanguage = () => setLocale(locale === 'mm' ? 'en' : 'mm');

  const isActive = (path) => location.pathname === path;
  const isActiveParent = (path) => location.pathname.startsWith(path + '/') || location.pathname === path;

  // Refined nav link with underline indicator
  const navLinkClass = (path) =>
    `relative px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive(path)
        ? 'text-white after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-white after:rounded-full'
        : 'text-purple-100 hover:text-white hover:bg-white/10'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 shadow-lg shadow-purple-900/20">
      {/* Top utility bar */}
      <div className="bg-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-end gap-1 py-1">
          {/* Font size */}
          <div className="flex items-center rounded-md overflow-hidden" role="group" aria-label={t('common.fontSize.label')}>
            {['sm', 'md', 'lg'].map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                  fontSize === size ? 'bg-white/20 text-white' : 'text-purple-300 hover:bg-white/10'
                }`}
                title={size === 'sm' ? 'Small text' : size === 'md' ? 'Default text' : 'Large text'}
              >
                A
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-white/15 mx-1.5" />
          {/* Dark mode */}
          <button
            onClick={toggleDarkMode}
            className="p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg className="w-3.5 h-3.5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="w-px h-4 bg-white/15 mx-1.5" />
          {/* Language */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/10 text-[11px] font-medium text-purple-200 transition-colors cursor-pointer"
            title={locale === 'mm' ? 'Switch to English' : 'မြန်မာဘာသာသို့ပြောင်းပါ'}
          >
            <span>{locale === 'mm' ? '🇲🇲' : '🇬🇧'}</span>
            <span>{locale === 'mm' ? 'မြန်မာ' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Main nav bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-12 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/" className="flex items-center gap-2 group" onClick={closeMobileMenu}>
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                </svg>
              </div>
              <span className="text-lg font-extrabold tracking-tight">{t('nav.schoolHub')}</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {/* Public links */}
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

            {isAuthenticated ? (
              <>
                <div className="w-px h-5 bg-white/20 mx-1.5" />

                {/* More menu dropdown */}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                      moreMenuOpen ? 'text-white bg-white/10' : 'text-purple-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t('nav.more')}
                    <svg className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden z-50 py-1">
                      <Link to="/dashboard" onClick={() => setMoreMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        {t('nav.dashboard')}
                      </Link>
                      <Link to="/courses" onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">{t('courses.title')}</Link>
                      <Link to="/assignments" onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">{t('assignments.title')}</Link>
                      <Link to="/quizzes" onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">{t('quizzes.title')}</Link>
                      <Link to="/gradebook" onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">{t('gradebook.title')}</Link>
                      <Link to="/resources" onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">{t('resources.title')}</Link>
                      <Link to="/reports" onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">{t('reports.title')}</Link>
                      {isAdmin && (
                        <Link to="/academic" onClick={() => setMoreMenuOpen(false)} className="block px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors border-t border-purple-100">{t('academic.title')}</Link>
                      )}
                    </div>
                  )}
                </div>

                {/* User dropdown */}
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 pl-3 pr-2 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 bg-purple-300 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                    <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-purple-100">
                        <p className="text-sm font-bold text-purple-900">{user.name}</p>
                        <p className="text-xs text-purple-500">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium capitalize">
                          {t(`common.role.${user.role}`)}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                          {t('nav.dashboard')}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-px h-5 bg-white/20 mx-1.5" />
                <Link to="/login" className={navLinkClass('/login')}>
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="ml-1 bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-all hover:scale-105"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              className="p-1.5 rounded-md hover:bg-white/10 text-purple-200 text-xs font-medium cursor-pointer"
            >
              {locale === 'mm' ? '🇲🇲' : '🇬🇧'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="md:hidden border-t border-white/10 bg-black/10 animate-in slide-in-from-top-2">
          <div className="max-h-[70vh] overflow-y-auto px-3 pt-2 pb-4 space-y-1">
            <Link to="/announcements" className="mobile-nav-link" onClick={closeMobileMenu}>
              {t('nav.announcements')}
            </Link>
            <Link to="/classes" className="mobile-nav-link" onClick={closeMobileMenu}>
              {t('nav.classes')}
            </Link>
            <Link to="/curriculum" className="mobile-nav-link" onClick={closeMobileMenu}>
              {t('nav.curriculum')}
            </Link>
            <Link to="/contact" className="mobile-nav-link" onClick={closeMobileMenu}>
              {t('nav.contact')}
            </Link>
            {isAuthenticated && (
              <>
                <div className="border-t border-white/10 my-1" />
                <Link to="/courses" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('courses.title')}
                </Link>
                <Link to="/assignments" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('assignments.title')}
                </Link>
                <Link to="/quizzes" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('quizzes.title')}
                </Link>
                <Link to="/gradebook" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('gradebook.title')}
                </Link>
                <Link to="/resources" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('resources.title')}
                </Link>
                <Link to="/reports" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('reports.title')}
                </Link>
              </>
            )}
            <div className="border-t border-white/10 my-1" />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('nav.dashboard')}
                </Link>
                {isAdmin && (
                  <Link to="/academic" className="mobile-nav-link" onClick={closeMobileMenu}>
                    {t('academic.title')}
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-7 h-7 bg-purple-300 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-purple-200">{user.name} ({t(`common.role.${user.role}`)})</span>
                </div>
                <button onClick={handleLogout} className="mobile-nav-link text-red-300 hover:bg-red-500/10 w-full text-left cursor-pointer">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link" onClick={closeMobileMenu}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="block bg-white text-purple-700 hover:bg-purple-50 px-3 py-3 rounded-lg text-sm font-bold text-center transition-colors mt-2" onClick={closeMobileMenu}>
                  {t('nav.register')}
                </Link>
              </>
            )}
            {/* Mobile utility controls */}
            <div className="border-t border-white/10 pt-3 mt-2 flex items-center justify-center gap-3">
              <div className="flex items-center bg-white/10 rounded-md overflow-hidden" role="group">
                {['sm', 'md', 'lg'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-3 py-1.5 text-xs font-bold cursor-pointer ${fontSize === size ? 'bg-white/25 text-white' : 'text-purple-300'}`}
                  >
                    A
                  </button>
                ))}
              </div>
              <button onClick={toggleDarkMode} className="p-1.5 rounded-md hover:bg-white/10 cursor-pointer" title="Toggle dark mode">
                {darkMode ? (
                  <svg className="w-4 h-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline style for mobile nav links (avoids Tailwind string bloat) */}
      <style>{`
        .mobile-nav-link {
          display: block;
          padding: 0.625rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          color: rgb(233 213 255);
          transition: all 150ms;
        }
        .mobile-nav-link:hover {
          background: rgba(255,255,255,0.08);
          color: white;
        }
      `}</style>
    </nav>
  );
}
