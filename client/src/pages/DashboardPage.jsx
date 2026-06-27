import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-purple-900">{t('dashboard.welcome', { name: user.name })}</h1>
        <p className="text-purple-600/60 mt-1">{t(`common.role.${user.role}`)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-900">{t('dashboard.yourProfile')}</h2>
              <p className="text-sm text-purple-600/60">{user.name}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-purple-800">
            <p><span className="font-medium text-purple-600">{t('dashboard.name')}:</span> {user.name}</p>
            <p><span className="font-medium text-purple-600">{t('dashboard.email')}:</span> {user.email}</p>
            <p><span className="font-medium text-purple-600">{t('dashboard.role')}:</span> <span className="capitalize">{t(`common.role.${user.role}`)}</span></p>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-4">{t('dashboard.quickActions')}</h2>
          <div className="space-y-3">
            <Link to="/announcements" className="card-interactive bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L3 9v6l8 4V5z"/><path d="M15 7.5a4.5 4.5 0 010 9"/></svg>
              {t('dashboard.viewAnnouncements')}
            </Link>
            <Link to="/classes" className="card-interactive bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              {t('dashboard.viewClasses')}
            </Link>
            <Link to="/curriculum" className="card-interactive bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              {t('nav.curriculum')}
            </Link>
            <Link to="/timetable" className="card-interactive bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {t('dashboard.timetable')}
            </Link>
            <Link to="/attendance" className="card-interactive bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              {t('dashboard.attendance')}
            </Link>
            <Link to="/courses" className="card-interactive bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              {t('courses.title')}
            </Link>
            <Link to="/assignments" className="card-interactive bg-amber-50 hover:bg-amber-100 text-amber-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {t('assignments.title')}
            </Link>
            <Link to="/quizzes" className="card-interactive bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {t('quizzes.title')}
            </Link>
            <Link to="/gradebook" className="card-interactive bg-rose-50 hover:bg-rose-100 text-rose-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
              {t('gradebook.title')}
            </Link>
            <Link to="/reports" className="card-interactive bg-teal-50 hover:bg-teal-100 text-teal-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              Reports
            </Link>
          </div>
        </div>
        {/* Admin/Teacher Management */}
        {(isAdmin || isTeacher) && (
          <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4">{t('dashboard.management')}</h2>
            <div className="space-y-3">
              {isAdmin && (
                <Link to="/admin/announcements" className="card-interactive bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {t('dashboard.manageAnnouncements')}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/classes" className="card-interactive bg-purple-400 hover:bg-purple-500 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {t('dashboard.manageClasses')}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/chat-logs" className="card-interactive bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {t('dashboard.chatLogs')}
                </Link>
              )}
              {isAdmin && (
                <Link to="/students" className="card-interactive bg-purple-300 hover:bg-purple-400 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {t('dashboard.manageStudents')}
                </Link>
              )}
              {isAdmin && (
                <Link to="/teachers" className="card-interactive bg-purple-300 hover:bg-purple-400 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer">
                  {t('dashboard.manageTeachers')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
