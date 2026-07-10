import { useState, useEffect, Fragment } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../services/api';

const WORKLOAD_COLORS = {
  light: {
    bg: 'bg-green-100 dark:bg-green-950/40',
    text: 'text-green-700 dark:text-green-300',
    label: 'Light',
  },
  normal: {
    bg: 'bg-yellow-100 dark:bg-yellow-950/40',
    text: 'text-yellow-700 dark:text-yellow-300',
    label: 'Normal',
  },
  heavy: {
    bg: 'bg-red-100 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    label: 'Heavy',
  },
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherWorkloadPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    api
      .get('/teachers/workload')
      .then((r) => setTeachers(r.data.teachers))
      .catch(() => {
        toast.error(t('teacherWorkload.loadError'));
        setError(t('teacherWorkload.loadError'));
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleExpand = async (teacher) => {
    if (expandedId === teacher.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(teacher.id);
    setDetailLoading(true);
    try {
      const r = await api.get(`/teachers/workload/${teacher.id}`);
      setDetail(r.data);
    } catch {
      toast.error(t('teacherWorkload.detailError'));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {t('common.error')}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Summary stats
  const totalTeachers = teachers.length;
  const heavyCount = teachers.filter((t) => t.workload_level === 'heavy').length;
  const normalCount = teachers.filter((t) => t.workload_level === 'normal').length;
  const lightCount = teachers.filter((t) => t.workload_level === 'light').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
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
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
          {t('teacherWorkload.title')}
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-4">
          <p className="text-sm text-purple-500 dark:text-purple-400">
            {t('teacherWorkload.totalTeachers')}
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalTeachers}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-4">
          <p className="text-sm text-red-500 dark:text-red-400">
            {t('teacherWorkload.heavyWorkload')}
          </p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{heavyCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-4">
          <p className="text-sm text-yellow-500 dark:text-yellow-400">
            {t('teacherWorkload.normalWorkload')}
          </p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{normalCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-4">
          <p className="text-sm text-green-500 dark:text-green-400">
            {t('teacherWorkload.lightWorkload')}
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{lightCount}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Teachers Table */}
      {teachers.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t('teacherWorkload.title')}</caption>
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t('teacherWorkload.name')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-center">
                    {t('teacherWorkload.periodsPerWeek')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-center">
                    {t('teacherWorkload.classes')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-center">
                    {t('teacherWorkload.subjects')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-center">
                    {t('teacherWorkload.totalHours')}
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-center">
                    {t('teacherWorkload.workloadLevel')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {teachers.map((tc) => {
                  const wl = WORKLOAD_COLORS[tc.workload_level];
                  return (
                    <Fragment key={tc.id}>
                      <tr
                        onClick={() => handleExpand(tc)}
                        className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30 cursor-pointer transition-colors"
                        aria-expanded={expandedId === tc.id}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <svg
                              className={`w-4 h-4 text-purple-400 transition-transform ${expandedId === tc.id ? 'rotate-90' : ''}`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                            <div>
                              <p className="font-medium text-purple-900 dark:text-purple-100">
                                {tc.name}
                              </p>
                              <p className="text-xs text-purple-500 dark:text-purple-400">
                                {tc.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-purple-900 dark:text-purple-100">
                          {tc.periods_per_week}
                        </td>
                        <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400">
                          {tc.classes_count}
                        </td>
                        <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400">
                          {tc.subjects_count}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-purple-900 dark:text-purple-100">
                          {tc.total_hours}h
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${wl.bg} ${wl.text}`}
                          >
                            {t(`teacherWorkload.level.${tc.workload_level}`)}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedId === tc.id && (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-4 bg-purple-50/30 dark:bg-purple-950/20"
                          >
                            {detailLoading ? (
                              <div className="flex justify-center py-6">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                              </div>
                            ) : detail ? (
                              <div className="space-y-4">
                                {/* Summary */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-purple-500">
                                      {t('teacherWorkload.totalPeriods')}
                                    </p>
                                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                      {detail.summary.total_periods}
                                    </p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-purple-500">
                                      {t('teacherWorkload.totalHours')}
                                    </p>
                                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                      {detail.summary.total_hours}h
                                    </p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-purple-500">
                                      {t('teacherWorkload.classes')}
                                    </p>
                                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                      {detail.summary.classes_count}
                                    </p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-purple-500">
                                      {t('teacherWorkload.subjects')}
                                    </p>
                                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                      {detail.summary.subjects_count}
                                    </p>
                                  </div>
                                </div>

                                {/* Daily Schedule */}
                                <div className="space-y-3">
                                  {DAYS.map((day) => {
                                    const slots = detail.schedule[day] || [];
                                    if (slots.length === 0) return null;
                                    return (
                                      <div key={day}>
                                        <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                                          {day}
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                          {slots.map((slot, i) => (
                                            <div
                                              key={i}
                                              className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-1.5 text-xs"
                                            >
                                              <span className="font-medium text-purple-900 dark:text-purple-100">
                                                {slot.start_time}-{slot.end_time}
                                              </span>
                                              <span className="mx-1.5 text-purple-300">|</span>
                                              <span className="text-purple-600 dark:text-purple-400">
                                                {slot.subject_name}
                                              </span>
                                              <span className="mx-1.5 text-purple-300">|</span>
                                              <span className="text-purple-500 dark:text-purple-400">
                                                {slot.class_name}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <p className="text-center text-purple-400 py-4">
                                {t('teacherWorkload.noSchedule')}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg
            className="w-12 h-12 text-purple-300 dark:text-purple-300 mx-auto mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <p className="text-purple-500 dark:text-purple-400">{t('teacherWorkload.noTeachers')}</p>
        </div>
      )}
    </div>
  );
}
