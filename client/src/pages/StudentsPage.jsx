import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function StudentsPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchStudents = (q = '') => {
    setLoading(true);
    api.get('/students', { params: { search: q } })
      .then(r => setStudents(r.data.students))
      .catch(() => setError(t('students.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(search);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900">{t('students.title')}</h1>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('students.searchPlaceholder')}
            className="px-4 py-2 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white"
          />
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer">
            {t('students.search')}
          </button>
        </form>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {students.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 text-purple-700 text-left">
                  <th className="px-4 py-3 font-medium">{t('students.studentId')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.email')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.grade')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.section')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('students.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium text-purple-900">{s.student_id || '—'}</td>
                    <td className="px-4 py-3 text-purple-900">{s.name}</td>
                    <td className="px-4 py-3 text-purple-600">{s.email}</td>
                    <td className="px-4 py-3 text-purple-600">{s.grade_name || '—'}</td>
                    <td className="px-4 py-3 text-purple-600">{s.section || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'active' ? 'bg-green-100 text-green-700' :
                        s.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                        s.status === 'graduated' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/students/${s.id}`} className="text-purple-600 hover:text-purple-800 font-medium text-xs">
                        {t('students.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p className="text-purple-500">{t('students.noStudents')}</p>
        </div>
      )}
    </div>
  );
}
