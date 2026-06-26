import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('nav.schoolHub')}</h3>
            <p className="text-gray-400 text-sm">
              {t('footer.tagline')}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/announcements" className="text-gray-400 hover:text-white text-sm">
                  {t('nav.announcements')}
                </Link>
              </li>
              <li>
                <Link to="/classes" className="text-gray-400 hover:text-white text-sm">
                  {t('nav.classes')}
                </Link>
              </li>
              <li>
                <Link to="/curriculum" className="text-gray-400 hover:text-white text-sm">
                  {t('nav.curriculum')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white text-sm">
                  {t('footer.contactUs')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>{t('footer.address')}</li>
              <li>{t('footer.cityState')}</li>
              <li>{t('footer.email')}</li>
              <li>{t('footer.phone')}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
