import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLocale(locale === 'mm' ? 'en' : 'mm');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold" onClick={closeMobileMenu}>
              {t('nav.schoolHub')}
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/announcements" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              {t('nav.announcements')}
            </Link>
            <Link to="/classes" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              {t('nav.classes')}
            </Link>
            <Link to="/curriculum" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              {t('nav.curriculum')}
            </Link>
            <Link to="/contact" className="hover:bg-blue-700 px-3 py-2 rounded-md">
              {t('nav.contact')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded-md">
                  {t('nav.dashboard')}
                </Link>
                <span className="text-blue-200 text-sm">
                  {user.name} ({t(`common.role.${user.role}`)})
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:bg-blue-700 px-3 py-2 rounded-md">
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md font-medium"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-2 py-1.5 rounded-md text-sm"
              title={locale === 'mm' ? 'Switch to English' : 'မြန်မာဘာသာသို့ပြောင်းပါ'}
            >
              <span className="text-base">{locale === 'mm' ? '🇲🇲' : '🇬🇧'}</span>
              <span>{locale === 'mm' ? 'မြန်မာ' : 'EN'}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 px-2 py-1.5 rounded-md text-sm"
              title={locale === 'mm' ? 'Switch to English' : 'မြန်မာဘာသာသို့ပြောင်းပါ'}
            >
              <span className="text-base">{locale === 'mm' ? '🇲🇲' : '🇬🇧'}</span>
              <span>{locale === 'mm' ? 'မြန်မာ' : 'EN'}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/announcements"
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMobileMenu}
            >
              {t('nav.announcements')}
            </Link>
            <Link
              to="/classes"
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMobileMenu}
            >
              {t('nav.classes')}
            </Link>
            <Link
              to="/curriculum"
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMobileMenu}
            >
              {t('nav.curriculum')}
            </Link>
            <Link
              to="/contact"
              className="block hover:bg-blue-700 px-3 py-2 rounded-md"
              onClick={closeMobileMenu}
            >
              {t('nav.contact')}
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block hover:bg-blue-700 px-3 py-2 rounded-md"
                  onClick={closeMobileMenu}
                >
                  {t('nav.dashboard')}
                </Link>
                <div className="px-3 py-2 text-blue-200 text-sm">
                  {user.name} ({t(`common.role.${user.role}`)})
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left hover:bg-blue-700 px-3 py-2 rounded-md"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block hover:bg-blue-700 px-3 py-2 rounded-md"
                  onClick={closeMobileMenu}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="block bg-white text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium"
                  onClick={closeMobileMenu}
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
