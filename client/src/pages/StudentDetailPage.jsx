import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { toast } from 'sonner';

const VALID_TRANSITIONS = {
  applicant: ['approved', 'withdrawn'],
  approved: ['active', 'withdrawn'],
  active: ['suspended', 'graduated', 'transferred', 'withdrawn'],
  suspended: ['active', 'withdrawn'],
  graduated: ['archived'],
  transferred: ['archived'],
  withdrawn: ['archived'],
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  suspended: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
  graduated: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  applicant: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  approved: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  transferred: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  withdrawn: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  archived: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    api
      .get(`/students/${id}`)
      .then((r) => setStudent(r.data.student))
      .catch(() => toast.error('Failed to load student data'))
      .finally(() => setLoading(false));
    // Load existing reports
    api
      .get(`/ai/report/${id}`)
      .then((r) => setReports(r.data.reports || []))
      .catch(() => toast.error('Failed to load reports'));
    // Load status history
    api
      .get(`/students/${id}/status-history`)
      .then((r) => setStatusHistory(r.data.history || []))
      .catch(() => {});
  }, [id]);

  const generateReport = async () => {
    setActionError(null);
    setGenerating(true);
    try {
      const res = await api.post(`/ai/report/${id}`);
      setReports((prev) => [res.data.report, ...prev]);
      setSelectedReport(res.data.report);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const approveReport = async (reportId) => {
    setActionError(null);
    try {
      await api.put(`/ai/report/${reportId}/approve`);
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'approved' } : r)));
      if (selectedReport?.id === reportId)
        setSelectedReport((prev) => ({ ...prev, status: 'approved' }));
    } catch (err) {
      setActionError('Failed to approve report');
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;
    setChangingStatus(true);
    try {
      await api.post(`/students/${id}/status`, {
        status: newStatus,
        reason: statusReason || undefined,
      });
      setStudent((prev) => ({ ...prev, status: newStatus }));
      setShowStatusModal(false);
      setNewStatus('');
      setStatusReason('');
      toast.success(`Status changed to ${newStatus}`);
      // Refresh history
      const res = await api.get(`/students/${id}/status-history`);
      setStatusHistory(res.data.history || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change status');
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );

  if (!student)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-purple-500 dark:text-purple-400">{t('students.notFound')}</p>
        <Link
          to="/students"
          className="text-purple-600 dark:text-purple-400 hover:underline mt-4 inline-block"
        >
          ← {t('students.backToList')}
        </Link>
      </div>
    );

  const attendanceMap = {};
  (student.attendance || []).forEach((a) => {
    attendanceMap[a.status] = a.count;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/students"
        className="text-purple-600 dark:text-purple-400 hover:underline text-sm mb-4 inline-block"
      >
        ← {t('students.backToList')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-purple-600 dark:text-purple-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {student.name}
              </h1>
              <p className="text-sm text-purple-500 dark:text-purple-400">
                {student.student_id || 'No ID'}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.email')}:
              </span>{' '}
              {student.email}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.grade')}:
              </span>{' '}
              {student.grade_name || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.section')}:
              </span>{' '}
              {student.section || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.gender')}:
              </span>{' '}
              {student.gender || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.dob')}:
              </span>{' '}
              {student.date_of_birth || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.phone')}:
              </span>{' '}
              {student.phone || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.address')}:
              </span>{' '}
              {student.address || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">Blood Type:</span>{' '}
              {student.blood_type || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">Allergies:</span>{' '}
              {student.allergies || '—'}
            </p>
            <p>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {t('students.status')}:{' '}
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  STATUS_COLORS[student.status] || STATUS_COLORS.active
                }`}
              >
                {student.status}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="ml-2 text-xs text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Change
                </button>
              )}
            </p>
          </div>
        </div>

        {/* AI Report Generation */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              🤖 AI Report Card
            </h2>
            <button
              onClick={generateReport}
              disabled={generating}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>

            {actionError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-red-700 dark:text-red-300 text-sm">{actionError}</p>
                <button
                  onClick={() => {
                    setActionError(null);
                    generateReport();
                  }}
                  className="text-red-600 dark:text-red-400 text-sm underline mt-1 hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {reports.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-purple-500 dark:text-purple-400 uppercase">
                  Previous Reports
                </p>
                {reports.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg"
                  >
                    <button
                      onClick={() => setSelectedReport(r)}
                      className="text-sm text-left hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      <span className="font-medium">#{r.id}</span>
                      <span className="text-purple-500 dark:text-purple-400 ml-2">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </button>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'approved'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                          : r.status === 'sent'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Viewer */}
          {selectedReport && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  Report #{selectedReport.id}
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-purple-400 hover:text-purple-600"
                >
                  ✕
                </button>
              </div>

              {/* Stats Summary */}
              {selectedReport.data && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {selectedReport.data.gpa}
                    </p>
                    <p className="text-xs text-purple-500">GPA</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {selectedReport.data.attendanceRate}%
                    </p>
                    <p className="text-xs text-purple-500">Attendance</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {selectedReport.data.avgAssignmentScore}%
                    </p>
                    <p className="text-xs text-purple-500">Assignments</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {selectedReport.data.avgQuizScore}%
                    </p>
                    <p className="text-xs text-purple-500">Quizzes</p>
                  </div>
                </div>
              )}

              {/* Narrative */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-purple-800 dark:text-purple-200"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedReport.narrative) }}
              />

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-purple-100 dark:border-purple-800">
                {selectedReport.status === 'draft' && (
                  <button
                    onClick={() => approveReport(selectedReport.id)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    ✓ Approve
                  </button>
                )}
                <a
                  href={`/api/ai/report/${selectedReport.id}/html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 text-center"
                >
                  🖨️ Print / PDF
                </a>
                <span
                  className={`self-center text-xs px-2 py-0.5 rounded-full font-medium ${
                    selectedReport.source === 'ai'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {selectedReport.source === 'ai' ? 'AI' : 'Template'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Parent Info + Attendance */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              {t('students.parentInfo')}
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {t('students.parentName')}:
                </span>{' '}
                {student.parent_name || '—'}
              </p>
              <p>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {t('students.parentPhone')}:
                </span>{' '}
                {student.parent_phone || '—'}
              </p>
              <p>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {t('students.parentEmail')}:
                </span>{' '}
                {student.parent_email || '—'}
              </p>
              <p>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {t('students.emergencyContact')}:
                </span>{' '}
                {student.emergency_contact || '—'}
              </p>
              <p>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {t('students.emergencyPhone')}:
                </span>{' '}
                {student.emergency_phone || '—'}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              {t('students.attendanceSummary')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {['present', 'absent', 'late', 'leave'].map((status) => (
                <div
                  key={status}
                  className="text-center p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl"
                >
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {attendanceMap[status] || 0}
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    {t(`attendance.${status}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollments */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
            {t('students.enrollments')}
          </h2>
          {student.enrollments?.length > 0 ? (
            <div className="space-y-3">
              {student.enrollments.map((c) => (
                <div key={c.id} className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
                  <p className="font-medium text-purple-900 dark:text-purple-100">{c.name}</p>
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    {c.schedule || 'TBA'} | {c.room || 'TBA'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-400 dark:text-purple-400 text-sm">
              {t('students.noEnrollments')}
            </p>
          )}
        </div>

        {/* Status History Timeline */}
        {statusHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 lg:col-span-3">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              📋 Status History
            </h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200 dark:bg-purple-800"></div>
              <div className="space-y-4">
                {statusHistory.map((h, i) => (
                  <div key={h.id} className="relative pl-10">
                    <div
                      className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                        i === 0 ? 'bg-green-500' : 'bg-purple-400'
                      }`}
                    ></div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        {h.from_status && (
                          <>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[h.from_status] || 'bg-gray-100 text-gray-700'}`}
                            >
                              {h.from_status}
                            </span>
                            <span className="text-purple-400">→</span>
                          </>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[h.to_status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {h.to_status}
                        </span>
                      </div>
                      {h.reason && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          Reason: {h.reason}
                        </p>
                      )}
                      <p className="text-xs text-purple-400 dark:text-purple-500 mt-1">
                        {h.changed_by_name && `${h.changed_by_name} • `}
                        {new Date(h.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status Change Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
                Change Student Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Current Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[student.status] || STATUS_COLORS.active}`}
                  >
                    {student.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
                  >
                    <option value="">Select status...</option>
                    {(VALID_TRANSITIONS[student.status] || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {['graduated', 'transferred', 'withdrawn', 'archived'].includes(newStatus) && (
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                      Reason (required)
                    </label>
                    <textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      rows={3}
                      placeholder="Enter reason for this status change..."
                      className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setNewStatus('');
                      setStatusReason('');
                    }}
                    className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusChange}
                    disabled={
                      !newStatus ||
                      changingStatus ||
                      (['graduated', 'transferred', 'withdrawn', 'archived'].includes(newStatus) &&
                        !statusReason)
                    }
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {changingStatus ? 'Saving...' : 'Change Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
