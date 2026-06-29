import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ParentPortalPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/children')
      .then(r => { setChildren(r.data); if (r.data.length) setSelectedChild(r.data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    const id = selectedChild.id;
    api.get(`/parent/child/${id}/grades`).then(r => setGrades(r.data)).catch(() => {});
    api.get(`/parent/child/${id}/attendance?limit=10`).then(r => setAttendance(r.data)).catch(() => {});
    api.get(`/parent/child/${id}/assignments`).then(r => setAssignments(r.data)).catch(() => {});
    api.get(`/parent/child/${id}/timetable`).then(r => setTimetable(r.data)).catch(() => {});
  }, [selectedChild]);

  if (loading) return <LoadingSkeleton />;

  if (!children.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">No Children Linked</h2>
        <p className="text-purple-600/60 dark:text-purple-300/60">Please contact the school administrator to link your children to your account.</p>
      </div>
    );
  }

  const summary = attendance?.summary || [];
  const totalClasses = summary.reduce((s, r) => s + r.count, 0);
  const presentCount = summary.find(r => r.status === 'present')?.count || 0;
  const attendanceRate = totalClasses ? Math.round((presentCount / totalClasses) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Parent Portal</h1>
        <p className="text-purple-600/60 dark:text-purple-300/60 mt-1">Monitor your children's academic progress</p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {children.map(child => (
            <button key={child.id} onClick={() => setSelectedChild(child)}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer whitespace-nowrap ${
                selectedChild?.id === child.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30'
                  : 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-gray-700 border border-purple-200 dark:border-gray-700'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                selectedChild?.id === child.id ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
              }`}>{child.name.charAt(0)}</div>
              <div className="text-left">
                <div>{child.name}</div>
                <div className={`text-xs ${selectedChild?.id === child.id ? 'text-purple-200' : 'text-purple-500 dark:text-purple-400'}`}>
                  {child.grade_name} {child.section}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedChild && (
        <>
          {/* Child Info Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                {selectedChild.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedChild.name}</h2>
                <p className="text-purple-200">{selectedChild.student_id} • {selectedChild.grade_name} {selectedChild.section}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedChild.status === 'active' ? 'bg-green-400/20 text-green-200' : 'bg-yellow-400/20 text-yellow-200'
                }`}>{selectedChild.status}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Attendance" value={`${attendanceRate}%`} color="green" />
            <StatCard label="Courses" value={grades.length} color="blue" />
            <StatCard label="Pending Work" value={assignments.filter(a => a.submission_status !== 'graded').length} color="orange" />
            <StatCard label="Average GPA" value={grades.length ? (grades.reduce((s, g) => s + (g.gpa || 0), 0) / grades.length).toFixed(1) : '—'} color="purple" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-purple-100/50 dark:bg-gray-800/50 rounded-xl p-1 overflow-x-auto">
            {['overview', 'grades', 'attendance', 'assignments', 'timetable'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer capitalize whitespace-nowrap ${
                  activeTab === tab ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-purple-600 dark:text-purple-400 hover:text-purple-800'
                }`}>{tab}</button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Recent Grades</h3>
                {grades.length ? grades.slice(0, 5).map(g => (
                  <div key={g.course_id} className="flex justify-between py-2 border-b border-purple-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-purple-800 dark:text-purple-200">{g.course_title}</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{g.final_grade || '—'} ({g.gpa || '—'})</span>
                  </div>
                )) : <p className="text-sm text-purple-400">No grades yet</p>}
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Attendance Summary</h3>
                {summary.map(s => (
                  <div key={s.status} className="flex justify-between py-2 border-b border-purple-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm capitalize text-purple-800 dark:text-purple-200">{s.status}</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{s.count} days</span>
                  </div>
                ))}
                {!summary.length && <p className="text-sm text-purple-400">No attendance records</p>}
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-purple-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Course</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Assignment</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Quiz</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Exam</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">GPA</th>
                </tr></thead>
                <tbody>{grades.map(g => (
                  <tr key={g.course_id} className="border-t border-purple-50 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-purple-900 dark:text-purple-100">{g.course_title}</td>
                    <td className="px-4 py-3 text-sm text-center text-purple-700 dark:text-purple-300">{g.assignment_score || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center text-purple-700 dark:text-purple-300">{g.quiz_score || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center text-purple-700 dark:text-purple-300">{g.exam_score || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-purple-700 dark:text-purple-300">{g.final_grade || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-purple-600 dark:text-purple-400">{g.gpa || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
              {!grades.length && <p className="p-6 text-center text-sm text-purple-400">No grades recorded yet</p>}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-purple-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Class</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Status</th>
                </tr></thead>
                <tbody>{(attendance?.records || []).map((r, i) => (
                  <tr key={i} className="border-t border-purple-50 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm text-purple-900 dark:text-purple-100">{r.date}</td>
                    <td className="px-4 py-3 text-sm text-purple-700 dark:text-purple-300">{r.class_name}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}</tbody>
              </table>
              {!(attendance?.records?.length) && <p className="p-6 text-center text-sm text-purple-400">No attendance records</p>}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-3">
              {assignments.map(a => (
                <div key={a.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">{a.title}</h4>
                    <p className="text-xs text-purple-500 dark:text-purple-400">{a.course_title} • Due: {a.due_date || 'No due date'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.score != null && <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{a.score}/{a.max_score}</span>}
                    <StatusBadge status={a.submission_status || 'not submitted'} />
                  </div>
                </div>
              ))}
              {!assignments.length && <p className="text-center text-sm text-purple-400 py-8">No assignments</p>}
            </div>
          )}

          {activeTab === 'timetable' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead><tr className="bg-purple-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Day</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Room</th>
                </tr></thead>
                <tbody>{timetable.map(t => (
                  <tr key={t.id} className="border-t border-purple-50 dark:border-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-purple-900 dark:text-purple-100">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][t.day_of_week]}</td>
                    <td className="px-4 py-3 text-sm text-purple-700 dark:text-purple-300">{t.start_time} - {t.end_time}</td>
                    <td className="px-4 py-3 text-sm text-purple-700 dark:text-purple-300">{t.subject_name}</td>
                    <td className="px-4 py-3 text-sm text-purple-700 dark:text-purple-300">{t.teacher_name}</td>
                    <td className="px-4 py-3 text-sm text-purple-500 dark:text-purple-400">{t.room}</td>
                  </tr>
                ))}</tbody>
              </table>
              {!timetable.length && <p className="p-6 text-center text-sm text-purple-400">No timetable available</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  };
  return (
    <div className={`rounded-2xl shadow-md p-4 text-center ${colors[color] || colors.purple}`}>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-xs md:text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    present: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300',
    absent: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
    late: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
    leave: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    submitted: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    graded: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300',
    'not submitted': 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.submitted}`}>{status}</span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-purple-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-24 bg-purple-200 dark:bg-gray-700 rounded-2xl mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-8">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-purple-200 dark:bg-gray-700 rounded-2xl" />)}</div>
    </div>
  );
}
