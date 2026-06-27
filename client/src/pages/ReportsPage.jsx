import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function ReportsPage() {
  const { t } = useTranslation();
  const { isAdmin, isTeacher, user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [teacherReport, setTeacherReport] = useState(null);
  const [teacherList, setTeacherList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isAdmin || isTeacher) {
      fetchOverview();
      fetchTeacherList();
    } else {
      fetchStudentReport(user.id);
    }
  }, []);

  const fetchOverview = () => {
    setLoading(true);
    api.get('/reports/overview')
      .then(r => {
        setOverview(r.data.overview);
        setActiveTab('overview');
      })
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  };

  const fetchTeacherList = () => {
    api.get('/teachers').then(r => setTeacherList(r.data.teachers)).catch(() => {});
  };

  const fetchStudentReport = (studentId) => {
    setLoading(true);
    api.get(`/reports/student/${studentId}`)
      .then(r => {
        setStudentReport(r.data.report);
        setActiveTab('student');
      })
      .catch(() => setError('Failed to load student report'))
      .finally(() => setLoading(false));
  };

  const fetchTeacherReport = (teacherId) => {
    setLoading(true);
    api.get(`/reports/teacher/${teacherId}`)
      .then(r => {
        setTeacherReport(r.data.report);
        setActiveTab('teacher');
      })
      .catch(() => setError('Failed to load teacher report'))
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Reports</h1>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {/* Tabs for admin/teacher */}
      {(isAdmin || isTeacher) && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTab === 'overview' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/30'}`}
          >
            School Overview
          </button>
          <button
            onClick={() => setActiveTab('teacher')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${activeTab === 'teacher' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/30'}`}
          >
            Teacher Reports
          </button>
        </div>
      )}

      {/* Overview Report (Admin/Teacher) */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Students" value={overview.totalStudents} color="blue" />
            <StatCard label="Teachers" value={overview.totalTeachers} color="green" />
            <StatCard label="Classes" value={overview.totalClasses} color="purple" />
            <StatCard label="Courses" value={overview.totalCourses} color="orange" />
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Average GPA</h3>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{overview.avgGpa || '—'}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Attendance Rate</h3>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{overview.attendanceRate}%</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Quiz Avg Score</h3>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{overview.quizAttempts?.avg_score || '—'}</p>
            </div>
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Assignment Submissions</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{overview.submissions?.total || 0}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overview.submissions?.graded || 0}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Graded</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{overview.submissions?.pending || 0}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Pending</p>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          {overview.gradeDistribution?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Grade Distribution</h3>
              <div className="flex gap-4 flex-wrap">
                {overview.gradeDistribution.map(g => (
                  <div key={g.grade} className="text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-1">
                      <span className="text-xl font-bold text-purple-900 dark:text-purple-100">{g.grade}</span>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">{g.count} students</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Students */}
          {overview.topStudents?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Top Students by GPA</h3>
              <div className="space-y-3">
                {overview.topStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center text-sm font-bold text-purple-800 dark:text-purple-200">
                        {i + 1}
                      </span>
                      <span className="font-medium text-purple-900 dark:text-purple-100">{s.name}</span>
                    </div>
                    <span className="font-bold text-purple-700 dark:text-purple-300">{s.avg_gpa}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Student Report */}
      {activeTab === 'student' && studentReport && (
        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Student Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Name</p>
                <p className="font-medium text-purple-900 dark:text-purple-100">{studentReport.student.name}</p>
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Student ID</p>
                <p className="font-medium text-purple-900 dark:text-purple-100">{studentReport.student.studentId}</p>
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Grade</p>
                <p className="font-medium text-purple-900 dark:text-purple-100">{studentReport.student.grade}</p>
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">Section</p>
                <p className="font-medium text-purple-900 dark:text-purple-100">{studentReport.student.section}</p>
              </div>
            </div>
          </div>

          {/* Overall GPA */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">Overall GPA</h3>
            <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">{studentReport.overallGpa || '—'}</p>
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{studentReport.attendance?.total || 0}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{studentReport.attendance?.present || 0}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{studentReport.attendance?.absent || 0}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{studentReport.attendance?.late || 0}</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Late</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-purple-600 dark:text-purple-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{studentReport.attendance?.rate || 0}%</p>
            </div>
          </div>

          {/* Grades */}
          {studentReport.grades?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Course Grades</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    <th className="text-left px-4 py-3 font-semibold">Subject</th>
                    <th className="text-left px-4 py-3 font-semibold">Course</th>
                    <th className="text-center px-4 py-3 font-semibold">Assignment</th>
                    <th className="text-center px-4 py-3 font-semibold">Quiz</th>
                    <th className="text-center px-4 py-3 font-semibold">Exam</th>
                    <th className="text-center px-4 py-3 font-semibold">Grade</th>
                    <th className="text-center px-4 py-3 font-semibold">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.grades.map(g => (
                    <tr key={g.id} className="border-t border-purple-100 dark:border-purple-800">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-full text-xs font-medium">{g.subject_code}</span>
                      </td>
                      <td className="px-4 py-3 text-purple-800 dark:text-purple-200">{g.course_title}</td>
                      <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{g.assignment_score || '—'}</td>
                      <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{g.quiz_score || '—'}</td>
                      <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{g.exam_score || '—'}</td>
                      <td className="px-4 py-3 text-center font-bold text-purple-900 dark:text-purple-100">{g.final_grade || '—'}</td>
                      <td className="px-4 py-3 text-center font-bold text-purple-900 dark:text-purple-100">{g.gpa || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assignments */}
          {studentReport.assignments?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Assignment Submissions</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    <th className="text-left px-4 py-3 font-semibold">Assignment</th>
                    <th className="text-left px-4 py-3 font-semibold">Course</th>
                    <th className="text-center px-4 py-3 font-semibold">Score</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.assignments.map((a, i) => (
                    <tr key={i} className="border-t border-purple-100 dark:border-purple-800">
                      <td className="px-4 py-3 text-purple-800 dark:text-purple-200">{a.assignment_title}</td>
                      <td className="px-4 py-3 text-purple-800 dark:text-purple-200">{a.course_title}</td>
                      <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">
                        {a.score !== null ? `${a.score}/${a.max_score}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === 'graded' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                          a.status === 'submitted' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quizzes */}
          {studentReport.quizzes?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Quiz Attempts</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    <th className="text-left px-4 py-3 font-semibold">Quiz</th>
                    <th className="text-left px-4 py-3 font-semibold">Course</th>
                    <th className="text-center px-4 py-3 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.quizzes.map((q, i) => (
                    <tr key={i} className="border-t border-purple-100 dark:border-purple-800">
                      <td className="px-4 py-3 text-purple-800 dark:text-purple-200">{q.quiz_title}</td>
                      <td className="px-4 py-3 text-purple-800 dark:text-purple-200">{q.course_title}</td>
                      <td className="px-4 py-3 text-center font-bold text-purple-900 dark:text-purple-100">
                        {q.score !== null ? `${q.score}/${q.max_score}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Teacher Report */}
      {activeTab === 'teacher' && (
        <div className="space-y-6">
          {/* Teacher selector (admin only) */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">Select Teacher</h3>
              <div className="flex flex-wrap gap-2">
                {teacherList.map(t => (
                  <button
                    key={t.id}
                    onClick={() => fetchTeacherReport(t.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                      teacherReport?.teacher?.name === t.name
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-900/30'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
                {isTeacher && !teacherReport && (
                  <button
                    onClick={() => fetchTeacherReport(user.id)}
                    className="px-4 py-2 rounded-xl text-sm font-medium cursor-pointer bg-purple-600 text-white"
                  >
                    View My Report
                  </button>
                )}
              </div>
            </div>
          )}
          {isTeacher && !isAdmin && !teacherReport && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 text-center">
              <button
                onClick={() => fetchTeacherReport(user.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                View My Report
              </button>
            </div>
          )}

          {/* Teacher Report Content */}
          {teacherReport && (
            <>
              {/* Teacher Info */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">Teacher Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Name</p>
                    <p className="font-medium text-purple-900 dark:text-purple-100">{teacherReport.teacher.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Teacher ID</p>
                    <p className="font-medium text-purple-900 dark:text-purple-100">{teacherReport.teacher.teacherId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Specialization</p>
                    <p className="font-medium text-purple-900 dark:text-purple-100">{teacherReport.teacher.specialization || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Qualification</p>
                    <p className="font-medium text-purple-900 dark:text-purple-100">{teacherReport.teacher.qualification || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Classes" value={teacherReport.classes.length} color="blue" />
                <StatCard label="Courses" value={teacherReport.courses.length} color="green" />
                <StatCard label="Students" value={teacherReport.totalStudents} color="purple" />
                <StatCard label="Subjects" value={[...new Set(teacherReport.courses.map(c => c.subject_code))].length} color="orange" />
              </div>

              {/* Course Stats */}
              {teacherReport.courseStats?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/40">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Course Performance</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                        <th className="text-left px-4 py-3 font-semibold">Subject</th>
                        <th className="text-left px-4 py-3 font-semibold">Course</th>
                        <th className="text-center px-4 py-3 font-semibold">Students</th>
                        <th className="text-center px-4 py-3 font-semibold">Avg GPA</th>
                        <th className="text-center px-4 py-3 font-semibold">Avg Assignment</th>
                        <th className="text-center px-4 py-3 font-semibold">Avg Quiz</th>
                        <th className="text-center px-4 py-3 font-semibold">Avg Exam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherReport.courseStats.map((cs, i) => (
                        <tr key={i} className="border-t border-purple-100 dark:border-purple-800">
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-full text-xs font-medium">{cs.subject_code}</span>
                          </td>
                          <td className="px-4 py-3 text-purple-800 dark:text-purple-200">{cs.course_title}</td>
                          <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{cs.graded_students || 0}</td>
                          <td className="px-4 py-3 text-center font-bold text-purple-900 dark:text-purple-100">{cs.avg_gpa || '—'}</td>
                          <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{cs.avg_assignment || '—'}</td>
                          <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{cs.avg_quiz || '—'}</td>
                          <td className="px-4 py-3 text-center text-purple-700 dark:text-purple-300">{cs.avg_exam || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const textColors = {
    blue: 'text-blue-800 dark:text-blue-300',
    green: 'text-green-800 dark:text-green-300',
    purple: 'text-purple-800 dark:text-purple-200',
    orange: 'text-orange-800 dark:text-orange-300',
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 text-center">
      <p className={`text-3xl font-bold ${textColors[color] || 'text-purple-900 dark:text-purple-100'}`}>{value}</p>
      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">{label}</p>
    </div>
  );
}
