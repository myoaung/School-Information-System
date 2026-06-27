import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function AttendancePage() {
  const { t } = useTranslation();
  const { user, isAdmin, isTeacher } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass || !date) return;
    setLoading(true);
    api.get('/attendance', { params: { class_id: selectedClass, date } })
      .then(r => setAttendance(r.data.attendance.map(a => ({ ...a, status: a.status || 'present' }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedClass, date]);

  const handleStatusChange = (userId, status) => {
    setAttendance(prev => prev.map(a => a.user_id === userId ? { ...a, status } : a));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/attendance', {
        class_id: parseInt(selectedClass),
        date,
        records: attendance.map(a => ({ user_id: a.user_id, status: a.status })),
      });
      setMessage(t('attendance.saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage(t('attendance.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const statusColors = {
    present: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    absent: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    late: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    leave: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('attendance.title')}</h1>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('attendance.selectClass')}</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800"
            >
              <option value="">{t('attendance.selectClassPlaceholder')}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('attendance.date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl mb-6 text-sm ${message.includes('Error') ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'}`}>
          {message}
        </div>
      )}

      {/* Attendance List */}
      {selectedClass && (
        loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : attendance.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th className="px-4 py-3 font-medium">{t('attendance.student')}</th>
                    <th className="px-4 py-3 font-medium">{t('attendance.studentId')}</th>
                    <th className="px-4 py-3 font-medium">{t('attendance.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {attendance.map(a => (
                    <tr key={a.user_id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                      <td className="px-4 py-3 text-purple-900 dark:text-purple-100 font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{a.student_id || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {['present', 'absent', 'late', 'leave'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(a.user_id, status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                a.status === status ? statusColors[status] : 'bg-white text-purple-400 border-purple-200 hover:bg-purple-50 dark:bg-gray-800 dark:border-purple-800 dark:hover:bg-purple-900/30'
                              }`}
                            >
                              {t(`attendance.${status}`)}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(isAdmin || isTeacher) && (
              <div className="p-4 border-t border-purple-100 dark:border-purple-800 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {saving ? t('attendance.saving') : t('attendance.save')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
            <p className="text-purple-500 dark:text-purple-400">{t('attendance.noStudents')}</p>
          </div>
        )
      )}
    </div>
  );
}
