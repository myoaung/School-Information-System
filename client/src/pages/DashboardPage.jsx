import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import { toast } from 'sonner';

const COLORS = {
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  green:
    'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  purple:
    'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  orange:
    'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
};

export default function DashboardPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);

  useEffect(() => {
    api
      .get('/reports/dashboard')
      .then((r) => setStats(r.data.dashboard))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));

    // Load at-risk students for admin/teacher
    if (isAdmin || isTeacher) {
      api
        .get('/ai/at-risk?minScore=30')
        .then((r) => setAtRiskStudents(r.data.students || []))
        .catch(() => toast.error('Failed to load risk alerts'));
      api
        .get('/ai/stats')
        .then((r) => setAnalyticsStats(r.data.stats))
        .catch(() => toast.error('Failed to load analytics'));
      // Load lifecycle summary
      api
        .get('/students/lifecycle/summary')
        .then((r) => setLifecycle(r.data))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
          {t('dashboard.welcome', { name: user.name })}
        </h1>
        <p className="text-purple-600/60 dark:text-purple-300/60 mt-1">
          {t(`common.role.${user.role}`)}
        </p>
      </div>

      {/* Stats Widgets */}
      {!loading && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-live="polite">
          {isAdmin || isTeacher ? (
            <>
              <StatCard
                label={t('dashboard.stats.students')}
                value={stats.totalStudents}
                color="blue"
              />
              <StatCard
                label={t('dashboard.stats.teachers')}
                value={stats.totalTeachers}
                color="green"
              />
              <StatCard
                label={t('dashboard.stats.attendanceRate')}
                value={`${stats.attendanceRate}%`}
                color="purple"
              />
              <StatCard
                label={t('dashboard.stats.pendingSubmissions')}
                value={stats.pendingSubmissions}
                color="orange"
              />
            </>
          ) : (
            <>
              <StatCard
                label={t('dashboard.stats.myAttendance')}
                value={`${stats.attendanceRate}%`}
                color="green"
              />
              <StatCard
                label={t('dashboard.stats.myGpa')}
                value={stats.overallGpa || '—'}
                color="purple"
              />
              <StatCard
                label={t('dashboard.stats.pendingAssignments')}
                value={stats.pendingAssignments}
                color="orange"
              />
              <StatCard
                label={t('dashboard.stats.upcomingQuizzes')}
                value={stats.upcomingQuizzes}
                color="blue"
              />
            </>
          )}
        </div>
      )}

      {/* Early Warning — At-Risk Students */}
      {(isAdmin || isTeacher) && atRiskStudents.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-950/40 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                Early Warning — At-Risk Students
              </h2>
            </div>
            {analyticsStats && (
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-full font-medium">
                  {analyticsStats.distribution.critical} Critical
                </span>
                <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                  {analyticsStats.distribution.high} High
                </span>
                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 rounded-full font-medium">
                  {analyticsStats.distribution.medium} Medium
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {atRiskStudents.slice(0, 5).map((student) => (
              <Link
                key={student.userId}
                to={`/students/${student.userId}`}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      student.riskLevel === 'critical'
                        ? 'bg-red-500'
                        : student.riskLevel === 'high'
                          ? 'bg-orange-500'
                          : 'bg-yellow-500'
                    }`}
                  >
                    {student.riskScore}
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900 dark:text-purple-100">
                      {student.name}
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-400">
                      {student.grade} • {student.studentCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.factors.slice(0, 2).map((f, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-full"
                    >
                      {f.type}
                    </span>
                  ))}
                  <svg
                    className="w-4 h-4 text-purple-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Student Lifecycle Summary (Admin only) */}
      {isAdmin && lifecycle && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950/40 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                Student Lifecycle
              </h2>
            </div>
            <Link
              to="/students"
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 font-medium"
            >
              Manage →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              {
                key: 'applicant',
                label: 'Applicant',
                color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
              },
              {
                key: 'approved',
                label: 'Approved',
                color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
              },
              {
                key: 'active',
                label: 'Active',
                color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
              },
              {
                key: 'suspended',
                label: 'Suspended',
                color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
              },
              {
                key: 'graduated',
                label: 'Graduated',
                color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
              },
              {
                key: 'transferred',
                label: 'Transferred',
                color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
              },
              {
                key: 'withdrawn',
                label: 'Withdrawn',
                color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
              },
              {
                key: 'archived',
                label: 'Archived',
                color: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
              },
            ].map(({ key, label, color }) => (
              <div key={key} className={`p-3 rounded-xl text-center ${color}`}>
                <p className="text-2xl font-bold">{lifecycle.summary[key] || 0}</p>
                <p className="text-xs font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Announcements */}
      {!loading && stats?.recentAnnouncements?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {t('dashboard.recentAnnouncements')}
            </h2>
            <Link
              to="/announcements"
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 font-medium"
            >
              {t('dashboard.viewAll')} →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentAnnouncements.map((a) => (
              <Link
                key={a.id}
                to={`/announcements/${a.id}`}
                className="block p-3 bg-purple-50 dark:bg-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900/70 rounded-xl transition-colors"
              >
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                  {a.title}
                </h3>
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                  {a.author} · {new Date(a.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {t('dashboard.yourProfile')}
              </h2>
              <p className="text-sm text-purple-600/60 dark:text-purple-300/60">{user.name}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('dashboard.name')}:
              </span>{' '}
              {user.name}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('dashboard.email')}:
              </span>{' '}
              {user.email}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('dashboard.role')}:
              </span>{' '}
              <span className="capitalize">{t(`common.role.${user.role}`)}</span>
            </p>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
            {t('dashboard.quickActions')}
          </h2>
          <div className="space-y-3">
            <Link
              to="/announcements"
              className="card-interactive bg-purple-50 dark:bg-purple-900/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 5L3 9v6l8 4V5z" />
                <path d="M15 7.5a4.5 4.5 0 010 9" />
              </svg>
              {t('dashboard.viewAnnouncements')}
            </Link>
            <Link
              to="/classes"
              className="card-interactive bg-purple-50 dark:bg-purple-900/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              {t('dashboard.viewClasses')}
            </Link>
            <Link
              to="/courses"
              className="card-interactive bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              {t('courses.title')}
            </Link>
            <Link
              to="/resources"
              className="card-interactive bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 text-teal-700 dark:text-teal-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              {t('resources.title')}
            </Link>
            <Link
              to="/reports"
              className="card-interactive bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              {t('reports.title')}
            </Link>
            <Link
              to="/messages"
              className="card-interactive bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-700 dark:text-sky-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Messages
            </Link>
            <Link
              to="/finance"
              className="card-interactive bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Finance
            </Link>
            <Link
              to="/certificates"
              className="card-interactive bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Certificates
            </Link>
          </div>
        </div>
        {/* Admin/Teacher Management */}
        {(isAdmin || isTeacher) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              {t('dashboard.management')}
            </h2>
            <div className="space-y-3">
              {isAdmin && (
                <Link
                  to="/academic"
                  className="card-interactive bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('academic.title')}
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin/announcements"
                  className="card-interactive bg-purple-400 hover:bg-purple-500 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('dashboard.manageAnnouncements')}
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin/chat-logs"
                  className="card-interactive bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('dashboard.chatLogs')}
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/students"
                  className="card-interactive bg-purple-300 hover:bg-purple-400 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('dashboard.manageStudents')}
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/teachers"
                  className="card-interactive bg-purple-300 hover:bg-purple-400 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('dashboard.manageTeachers')}
                </Link>
              )}
              {(isAdmin || isTeacher) && (
                <Link
                  to="/analytics"
                  className="card-interactive bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  📊 Predictive Analytics
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = memo(function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    green:
      'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    purple:
      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    orange:
      'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  };
  return (
    <div
      className={`rounded-2xl shadow-md p-4 text-center border ${colors[color] || 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'}`}
    >
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-xs md:text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
});
