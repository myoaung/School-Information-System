import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  draft: {
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    label: 'Draft',
    icon: '📝',
  },
  incomplete: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    label: 'Incomplete',
    icon: '⚠️',
  },
  ready: {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    label: 'Ready',
    icon: '✅',
  },
  active: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    label: 'Active',
    icon: '🟢',
  },
};

export default function ClassDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [classData, setClassData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [assigningSubject, setAssigningSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const fetchClassData = async () => {
    try {
      const [classRes, subjectsRes] = await Promise.all([
        api.get(`/classes/${id}`),
        api.get(`/class-subjects/${id}`),
      ]);
      setClassData(classRes.data.class);
      setStudents(classRes.data.class?.students || []);
      setAssignments(subjectsRes.data.assignments || []);
      setReadiness(subjectsRes.data.readiness);
    } catch (err) {
      toast.error('Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
    if (isAdmin) {
      api
        .get('/teachers')
        .then((r) => setTeachers(r.data.teachers || []))
        .catch(() => {});
    }
  }, [id]);

  const handleApplyCurriculum = async () => {
    try {
      await api.post(`/class-subjects/${id}/apply-curriculum`, {
        academic_year_id: classData.academic_year_id,
      });
      toast.success('Curriculum applied');
      fetchClassData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply curriculum');
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !assigningSubject) return;
    try {
      await api.post(`/class-subjects/${id}/assign`, {
        subject_id: assigningSubject,
        teacher_id: parseInt(selectedTeacher),
      });
      toast.success('Teacher assigned');
      setAssigningSubject(null);
      setSelectedTeacher('');
      fetchClassData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign teacher');
    }
  };

  const handleRemoveTeacher = async (subjectId) => {
    try {
      await api.delete(`/class-subjects/${id}/assign/${subjectId}`);
      toast.success('Teacher removed');
      fetchClassData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove teacher');
    }
  };

  const handleActivate = async () => {
    try {
      await api.post(`/class-subjects/${id}/activate`);
      toast.success('Class activated!');
      fetchClassData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to activate class');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-purple-500">Class not found</p>
        <Link to="/classes" className="text-purple-600 hover:underline mt-4 inline-block">
          ← Back to Classes
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[classData.status] || STATUS_CONFIG.draft;
  const teacherProgress =
    readiness?.total_subjects > 0
      ? Math.round((readiness.assigned_teachers / readiness.total_subjects) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/classes"
          className="text-sm text-purple-600 hover:text-purple-800 mb-2 inline-flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Classes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
                {classData.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.color}`}>
                {status.icon} {status.label}
              </span>
            </div>
            <p className="text-purple-600 dark:text-purple-400 mt-1">
              {classData.grade_name && `${classData.grade_name} `}
              {classData.section && `• Section ${classData.section}`}
              {classData.year_name && ` • ${classData.year_name}`}
            </p>
          </div>
          {isAdmin && classData.status === 'ready' && (
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 cursor-pointer"
            >
              🚀 Activate Class
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {['overview', 'curriculum', 'students', 'timetable'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Class Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-500">Grade</span>
                <span className="font-medium">{classData.grade_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-500">Section</span>
                <span className="font-medium">{classData.section}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-500">Room</span>
                <span className="font-medium">{classData.room || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-500">Capacity</span>
                <span className="font-medium">
                  {classData.student_count || 0}/{classData.capacity}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Readiness</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-purple-500">Teachers Assigned</span>
                <span className="font-medium">
                  {readiness?.assigned_teachers || 0}/{readiness?.total_subjects || 0}
                </span>
              </div>
              <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${teacherProgress === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${teacherProgress}%` }}
                />
              </div>
            </div>
            {readiness?.missing?.length > 0 && (
              <div className="text-sm">
                <p className="text-amber-600 font-medium mb-2">Missing Teachers:</p>
                {readiness.missing.map((m) => (
                  <div key={m.subject_id} className="text-gray-600 dark:text-gray-400">
                    • {m.subject_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {isAdmin && classData.status === 'draft' && (
                <button
                  onClick={handleApplyCurriculum}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 cursor-pointer"
                >
                  📚 Apply Curriculum
                </button>
              )}
              <Link
                to={`/attendance?class_id=${id}`}
                className="block w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm text-center hover:bg-blue-200"
              >
                📋 Take Attendance
              </Link>
              <Link
                to={`/timetable?class_id=${id}`}
                className="block w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm text-center hover:bg-green-200"
              >
                🕐 View Timetable
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum & Teachers Tab */}
      {activeTab === 'curriculum' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {assignments.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Required</th>
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isAdmin && <th className="px-4 py-3 font-medium">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {a.subject_name}
                    </td>
                    <td className="px-4 py-3 text-purple-600">{a.category || '—'}</td>
                    <td className="px-4 py-3">
                      {a.is_required ? (
                        <span className="text-amber-600 font-medium">Required</span>
                      ) : (
                        <span className="text-gray-400">Optional</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.teacher_name || <span className="text-red-500">Not assigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      {a.teacher_id ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Assigned
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Needs teacher
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {assigningSubject === a.subject_id ? (
                          <div className="flex gap-2">
                            <select
                              value={selectedTeacher}
                              onChange={(e) => setSelectedTeacher(e.target.value)}
                              className="px-2 py-1 border rounded text-xs"
                            >
                              <option value="">Select teacher</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={handleAssignTeacher}
                              className="text-xs text-green-600 hover:text-green-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setAssigningSubject(null)}
                              className="text-xs text-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAssigningSubject(a.subject_id)}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              {a.teacher_id ? 'Change' : 'Assign'}
                            </button>
                            {a.teacher_id && (
                              <button
                                onClick={() => handleRemoveTeacher(a.subject_id)}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-purple-500 mb-4">No curriculum applied yet</p>
              {isAdmin && classData.status === 'draft' && (
                <button
                  onClick={handleApplyCurriculum}
                  className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 cursor-pointer"
                >
                  📚 Apply Curriculum
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {students.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-purple-600">{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-purple-500">No students enrolled yet</p>
            </div>
          )}
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 text-center">
          <p className="text-purple-500 mb-4">Timetable management coming soon</p>
          <Link
            to={`/timetable?class_id=${id}`}
            className="text-purple-600 hover:underline text-sm"
          >
            View full timetable →
          </Link>
        </div>
      )}
    </div>
  );
}
