import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('dashboard.welcome', { name: user.name })}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.yourProfile')}</h2>
          <div className="space-y-2">
            <p><span className="font-medium">{t('dashboard.name')}:</span> {user.name}</p>
            <p><span className="font-medium">{t('dashboard.email')}:</span> {user.email}</p>
            <p><span className="font-medium">{t('dashboard.role')}:</span> <span className="capitalize">{t(`common.role.${user.role}`)}</span></p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.quickActions')}</h2>
          <div className="space-y-3">
            <Link to="/announcements" className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              {t('dashboard.viewAnnouncements')}
            </Link>
            <Link to="/classes" className="block w-full text-center bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
              {t('dashboard.viewClasses')}
            </Link>
          </div>
        </div>

        {/* Admin/Teacher Actions */}
        {(isAdmin || isTeacher) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('dashboard.management')}</h2>
            <div className="space-y-3">
              {isAdmin && (
                <Link to="/admin/announcements" className="block w-full text-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
                  {t('dashboard.manageAnnouncements')}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/classes" className="block w-full text-center bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">
                  {t('dashboard.manageClasses')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
