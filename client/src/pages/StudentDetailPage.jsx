import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function StudentDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/students/${id}`)
      .then(r => setStudent(r.data.student))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  if (!student) return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-center">
      <p className="text-purple-500">{t('students.notFound')}</p>
      <Link to="/students" className="text-purple-600 hover:underline mt-4 inline-block">← {t('students.backToList')}</Link>
    </div>
  );

  const attendanceMap = {};
  (student.attendance || []).forEach(a => { attendanceMap[a.status] = a.count; });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/students" className="text-purple-600 hover:underline text-sm mb-4 inline-block">← {t('students.backToList')}</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-purple-900">{student.name}</h1>
              <p className="text-sm text-purple-500">{student.student_id || 'No ID'}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-purple-600">{t('students.email')}:</span> {student.email}</p>
            <p><span className="font-medium text-purple-600">{t('students.grade')}:</span> {student.grade_name || '—'}</p>
            <p><span className="font-medium text-purple-600">{t('students.section')}:</span> {student.section || '—'}</p>
            <p><span className="font-medium text-purple-600">{t('students.gender')}:</span> {student.gender || '—'}</p>
            <p><span className="font-medium text-purple-600">{t('students.dob')}:</span> {student.date_of_birth || '—'}</p>
            <p><span className="font-medium text-purple-600">{t('students.phone')}:</span> {student.phone || '—'}</p>
            <p><span className="font-medium text-purple-600">{t('students.address')}:</span> {student.address || '—'}</p>
            <p>
              <span className="font-medium text-purple-600">{t('students.status')}: </span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                student.status === 'active' ? 'bg-green-100 text-green-700' :
                student.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>{student.status}</span>
            </p>
          </div>
        </div>

        {/* Parent Info + Attendance */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4">{t('students.parentInfo')}</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-purple-600">{t('students.parentName')}:</span> {student.parent_name || '—'}</p>
              <p><span className="font-medium text-purple-600">{t('students.parentPhone')}:</span> {student.parent_phone || '—'}</p>
              <p><span className="font-medium text-purple-600">{t('students.parentEmail')}:</span> {student.parent_email || '—'}</p>
              <p><span className="font-medium text-purple-600">{t('students.emergencyContact')}:</span> {student.emergency_contact || '—'}</p>
              <p><span className="font-medium text-purple-600">{t('students.emergencyPhone')}:</span> {student.emergency_phone || '—'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4">{t('students.attendanceSummary')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {['present', 'absent', 'late', 'leave'].map(status => (
                <div key={status} className="text-center p-3 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-900">{attendanceMap[status] || 0}</p>
                  <p className="text-xs text-purple-500">{t(`attendance.${status}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollments */}
        <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6">
          <h2 className="text-lg font-bold text-purple-900 mb-4">{t('students.enrollments')}</h2>
          {student.enrollments?.length > 0 ? (
            <div className="space-y-3">
              {student.enrollments.map(c => (
                <div key={c.id} className="p-3 bg-purple-50 rounded-xl">
                  <p className="font-medium text-purple-900">{c.name}</p>
                  <p className="text-xs text-purple-500">{c.schedule || 'TBA'} | {c.room || 'TBA'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-400 text-sm">{t('students.noEnrollments')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
