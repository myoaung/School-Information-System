import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-purple-950 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
              </svg>
              <h3 className="text-xl font-bold text-purple-300">{t('nav.schoolHub')}</h3>
            </div>
            <p className="text-purple-300/60 text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-4 text-white">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2.5">
              <li><Link to="/announcements" className="text-purple-300/70 hover:text-white text-sm transition-colors duration-200 cursor-pointer">{t('nav.announcements')}</Link></li>
              <li><Link to="/classes" className="text-purple-300/70 hover:text-white text-sm transition-colors duration-200 cursor-pointer">{t('nav.classes')}</Link></li>
              <li><Link to="/curriculum" className="text-purple-300/70 hover:text-white text-sm transition-colors duration-200 cursor-pointer">{t('nav.curriculum')}</Link></li>
              <li><Link to="/contact" className="text-purple-300/70 hover:text-white text-sm transition-colors duration-200 cursor-pointer">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-4 text-white">{t('footer.contact')}</h3>
            <ul className="space-y-2.5 text-purple-300/70 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {t('footer.address')}
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                {t('footer.email')}
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                {t('footer.phone')}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-purple-800 mt-10 pt-8 text-center text-purple-400/50 text-sm">
          <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
