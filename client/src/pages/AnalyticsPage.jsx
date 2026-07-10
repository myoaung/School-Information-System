import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AnalyticsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [stats, setStats] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ minScore: 30 });

  useEffect(() => {
    Promise.all([
      api.get('/ai/stats').then((r) => setStats(r.data.stats)),
      api
        .get(`/ai/at-risk?minScore=${filter.minScore}`)
        .then((r) => setAtRisk(r.data.students || [])),
      api.get('/ai/alerts').then((r) => setAlerts(r.data.alerts || [])),
    ])
      .catch(() => toast.error('Failed to load analytics data'))
      .finally(() => setLoading(false));
  }, [filter.minScore]);

  if (!isAdmin && !isTeacher) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">Access Denied</h2>
        <p className="text-purple-500 mt-2">
          Analytics are available for teachers and administrators.
        </p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  const riskColors = { critical: 'red', high: 'orange', medium: 'yellow', low: 'green' };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
          Predictive Analytics
        </h1>
        <p className="text-purple-600/60 dark:text-purple-300/60 mt-1">
          AI-powered student risk assessment and early warning system
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Students" value={stats.totalStudents} color="blue" />
          <StatCard label="At Risk" value={stats.atRiskCount} color="red" />
          <StatCard
            label="Average Risk Score"
            value={stats.avgRiskScore?.toFixed(1) || '—'}
            color="purple"
          />
          <StatCard
            label="Risk Rate"
            value={`${stats.riskPercentage?.toFixed(1) || 0}%`}
            color="orange"
          />
        </div>
      )}

      {/* Risk Distribution */}
      {stats?.distribution && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 mb-8">
          <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-4">Risk Distribution</h3>
          <div className="grid grid-cols-4 gap-4">
            {['critical', 'high', 'medium', 'low'].map((level) => {
              const count = stats.distribution[level] || 0;
              const total = stats.totalStudents || 1;
              const pct = ((count / total) * 100).toFixed(1);
              return (
                <div key={level} className="text-center">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-2 ${
                      level === 'critical'
                        ? 'bg-red-500'
                        : level === 'high'
                          ? 'bg-orange-500'
                          : level === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                    }`}
                  >
                    {count}
                  </div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100 capitalize">
                    {level}
                  </p>
                  <p className="text-xs text-purple-500">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-950/40 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <h3 className="font-bold text-purple-900 dark:text-purple-100">
              Active Alerts ({alerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border-l-4 ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-500'
                    : alert.severity === 'high'
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500'
                      : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      {alert.studentName}
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-400">{alert.message}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        : alert.severity === 'high'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* At-Risk Students Filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">At-Risk Students</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-purple-600 dark:text-purple-400">Min Risk Score:</label>
          <select
            value={filter.minScore}
            onChange={(e) => setFilter({ ...filter, minScore: parseInt(e.target.value) })}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-lg text-sm text-purple-900 dark:text-purple-100 cursor-pointer"
          >
            <option value={20}>20+</option>
            <option value={30}>30+</option>
            <option value={50}>50+</option>
            <option value={70}>70+</option>
          </select>
        </div>
      </div>

      {/* At-Risk Students List */}
      <div className="space-y-3">
        {atRisk.map((student) => (
          <div
            key={student.userId}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
                    student.riskLevel === 'critical'
                      ? 'bg-red-500'
                      : student.riskLevel === 'high'
                        ? 'bg-orange-500'
                        : student.riskLevel === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                  }`}
                >
                  {student.riskScore}
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 dark:text-purple-100">{student.name}</h3>
                  <p className="text-sm text-purple-500 dark:text-purple-400">
                    {student.grade} • {student.studentCode} •
                    <span
                      className={`ml-1 capitalize font-medium ${
                        student.riskLevel === 'critical'
                          ? 'text-red-600 dark:text-red-400'
                          : student.riskLevel === 'high'
                            ? 'text-orange-600 dark:text-orange-400'
                            : student.riskLevel === 'medium'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {student.riskLevel}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex gap-2">
                  {student.factors?.map((f, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full"
                    >
                      {f.type}: {f.value}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/students/${student.userId}`}
                  className="bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
        {!atRisk.length && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
              No At-Risk Students
            </h3>
            <p className="text-sm text-purple-500 mt-1">
              All students are performing well above the risk threshold.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = memo(function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    red: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
    purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  };
  return (
    <div className={`rounded-2xl shadow-md p-4 text-center ${colors[color] || colors.purple}`}>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-xs md:text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-64 bg-purple-200 dark:bg-gray-700 rounded mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-purple-200 dark:bg-gray-700 rounded-2xl" />
        ))}
      </div>
      <div className="h-48 bg-purple-200 dark:bg-gray-700 rounded-2xl mb-8" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-purple-200 dark:bg-gray-700 rounded-2xl mb-3" />
      ))}
    </div>
  );
}
