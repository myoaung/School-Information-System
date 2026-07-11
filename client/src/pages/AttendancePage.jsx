import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

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
  const [saveError, setSaveError] = useState(null);
  const [qrSession, setQrSession] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  useEffect(() => {
    api
      .get('/classes')
      .then((r) => setClasses(r.data.classes))
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  // Countdown timer for QR expiry
  useEffect(() => {
    if (qrSession && !qrSession.is_expired) {
      countdownRef.current = setInterval(() => {
        const now = new Date();
        const expires = new Date(qrSession.qr_expires_at);
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownRef.current);
          setQrSession((prev) => (prev ? { ...prev, is_expired: true } : null));
        }
      }, 1000);
      return () => clearInterval(countdownRef.current);
    }
  }, [qrSession?.id]);

  const generateQR = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    setQrLoading(true);
    try {
      const res = await api.post('/attendance/sessions', {
        class_id: parseInt(selectedClass),
        date,
      });
      setQrSession(res.data.session);
      toast.success('QR code generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate QR');
    } finally {
      setQrLoading(false);
    }
  };

  const deactivateQR = async () => {
    if (!qrSession) return;
    try {
      await api.post(`/attendance/sessions/${qrSession.id}/deactivate`);
      setQrSession((prev) => (prev ? { ...prev, is_active: 0 } : null));
      toast.success('QR code deactivated');
    } catch (err) {
      toast.error('Failed to deactivate');
    }
  };

  const refreshQRCount = async () => {
    if (!qrSession) return;
    try {
      const res = await api.get(`/attendance/sessions/${qrSession.id}`);
      setQrSession(res.data.session);
    } catch {}
  };

  useEffect(() => {
    if (!selectedClass || !date) return;
    setLoading(true);
    api
      .get('/attendance', { params: { class_id: selectedClass, date } })
      .then((r) =>
        setAttendance(r.data.attendance.map((a) => ({ ...a, status: a.status || 'present' })))
      )
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [selectedClass, date]);

  const handleStatusChange = (userId, status) => {
    setAttendance((prev) => prev.map((a) => (a.user_id === userId ? { ...a, status } : a)));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await api.post('/attendance', {
        class_id: parseInt(selectedClass),
        date,
        records: attendance.map((a) => ({ user_id: a.user_id, status: a.status })),
      });
      setMessage(t('attendance.saved'));
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage(t('attendance.saveError'));
      setSaveError(t('attendance.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const statusColors = {
    present:
      'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
    absent:
      'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    late: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    leave:
      'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
          {t('attendance.title')}
        </h1>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              {t('attendance.selectClass')}
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800"
            >
              <option value="">{t('attendance.selectClassPlaceholder')}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              {t('attendance.date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800"
            />
          </div>
          {(isAdmin || isTeacher) && (
            <div className="flex items-end">
              <button
                onClick={generateQR}
                disabled={qrLoading || !selectedClass}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
                {qrLoading ? 'Generating...' : 'Generate QR'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Panel */}
      {qrSession && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
              📱 QR Attendance Code
            </h2>
            <div className="flex gap-2">
              <button
                onClick={refreshQRCount}
                className="px-3 py-1.5 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                Refresh
              </button>
              {qrSession.is_active === 1 && (
                <button
                  onClick={deactivateQR}
                  className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                >
                  Stop Scanning
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* QR Code Display */}
            <div
              className={`p-6 rounded-2xl border-2 ${qrSession.is_expired || qrSession.is_active === 0 ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40' : 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'}`}
            >
              <div className="w-48 h-48 flex items-center justify-center">
                {qrSession.is_expired || qrSession.is_active === 0 ? (
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-red-400 mx-auto mb-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                      {qrSession.is_active === 0 ? 'Deactivated' : 'Expired'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-4xl font-mono font-bold text-indigo-700 dark:text-indigo-300 tracking-widest">
                      {qrSession.qr_code.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2">
                      Students enter this code at /scan
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Session Info */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">Class:</span>
                  <span className="ml-2">{qrSession.class_name || '—'}</span>
                </div>
                <div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">Subject:</span>
                  <span className="ml-2">{qrSession.subject_name || '—'}</span>
                </div>
                <div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">Date:</span>
                  <span className="ml-2">{qrSession.date}</span>
                </div>
                <div>
                  <span className="font-medium text-purple-600 dark:text-purple-400">Room:</span>
                  <span className="ml-2">{qrSession.room || '—'}</span>
                </div>
              </div>

              {/* Check-in Count */}
              <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Checked In
                  </span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {qrSession.checked_in_count || 0} / {qrSession.total_students || 0}
                  </span>
                </div>
                <div className="mt-2 w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                  <div
                    className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${qrSession.total_students ? ((qrSession.checked_in_count || 0) / qrSession.total_students) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Countdown */}
              {!qrSession.is_expired && qrSession.is_active === 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-500 dark:text-purple-400">Expires in:</span>
                  <span
                    className={`font-mono font-bold ${countdown < 60 ? 'text-red-600 dark:text-red-400' : 'text-purple-900 dark:text-purple-100'}`}
                  >
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Link to scan page */}
              <p className="text-xs text-purple-400 dark:text-purple-500">
                Students can scan at:{' '}
                <span className="font-mono">{window.location.origin}/scan</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`px-4 py-3 rounded-xl mb-6 text-sm ${message.includes('Error') ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'}`}
        >
          {message}
        </div>
      )}

      {/* Attendance List */}
      {selectedClass &&
        (loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : attendance.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">{t('attendance.title')}</caption>
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                    <th scope="col" className="px-4 py-3 font-medium">
                      {t('attendance.student')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {t('attendance.studentId')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {t('attendance.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                  {attendance.map((a) => (
                    <tr
                      key={a.user_id}
                      className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30"
                    >
                      <td className="px-4 py-3 text-purple-900 dark:text-purple-100 font-medium">
                        {a.name}
                      </td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                        {a.student_id || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {['present', 'absent', 'late', 'leave'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(a.user_id, status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                a.status === status
                                  ? statusColors[status]
                                  : 'bg-white text-purple-400 border-purple-200 hover:bg-purple-50 dark:bg-gray-800 dark:border-purple-800 dark:hover:bg-purple-900/30'
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
            {saveError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-3">
                <p className="text-red-700 dark:text-red-300 text-sm">{saveError}</p>
                <button
                  onClick={() => {
                    setSaveError(null);
                    handleSave();
                  }}
                  className="text-red-600 dark:text-red-400 text-sm underline mt-1 hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
            <p className="text-purple-500 dark:text-purple-400">{t('attendance.noStudents')}</p>
          </div>
        ))}
    </div>
  );
}
