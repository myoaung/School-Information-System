import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function AcademicPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('years');

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/academic/years'),
      api.get('/academic/semesters'),
      api.get('/academic/holidays')
    ])
      .then(([yr, sem, hol]) => {
        setYears(yr.data.years);
        setSemesters(sem.data.semesters);
        setHolidays(hol.data.holidays);
      })
      .catch(() => setError(t('academic.loadError')))
      .finally(() => setLoading(false));
  }, []);

  const openForm = (type) => {
    setFormType(type);
    setFormData({});
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const endpoint = formType === 'year' ? '/academic/years'
      : formType === 'semester' ? '/academic/semesters'
      : '/academic/holidays';
    api.post(endpoint, formData)
      .then(() => {
        setShowForm(false);
        // Refresh data
        return Promise.all([
          api.get('/academic/years'),
          api.get('/academic/semesters'),
          api.get('/academic/holidays')
        ]);
      })
      .then(([yr, sem, hol]) => {
        setYears(yr.data.years);
        setSemesters(sem.data.semesters);
        setHolidays(hol.data.holidays);
      })
      .catch(() => setError(t('academic.createError')))
      .finally(() => setSaving(false));
  };

  const holidayTypeColors = {
    public: 'bg-blue-100 text-blue-700',
    school: 'bg-green-100 text-green-700',
    exam: 'bg-orange-100 text-orange-700',
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('academic.title')}</h1>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-purple-50 dark:bg-purple-950/40 p-1 rounded-xl w-fit">
        {['years', 'semesters', 'holidays'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
            }`}
          >
            {t(`academic.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Create button (admin) */}
      {isAdmin && (
        <div className="mb-6">
          <button
            onClick={() => openForm(activeTab === 'years' ? 'year' : activeTab === 'semesters' ? 'semester' : 'holiday')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            + {t(`academic.create${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`)}
          </button>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              {t(`academic.create${formType.charAt(0).toUpperCase() + formType.slice(1)}`)}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formType === 'year' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.name')}</label>
                    <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="2027-2028" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.startDate')}</label>
                      <input type="date" required value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.endDate')}</label>
                      <input type="date" required value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <input type="checkbox" checked={formData.is_current || false} onChange={e => setFormData({...formData, is_current: e.target.checked})}
                      className="rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                    {t('academic.form.isCurrent')}
                  </label>
                </>
              )}
              {formType === 'semester' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.academicYear')}</label>
                    <select required value={formData.academic_year_id || ''} onChange={e => setFormData({...formData, academic_year_id: e.target.value})}
                      className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                      <option value="">{t('academic.form.selectYear')}</option>
                      {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.name')}</label>
                    <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" placeholder="Semester 1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.startDate')}</label>
                      <input type="date" required value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.endDate')}</label>
                      <input type="date" required value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <input type="checkbox" checked={formData.is_current || false} onChange={e => setFormData({...formData, is_current: e.target.checked})}
                      className="rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                    {t('academic.form.isCurrent')}
                  </label>
                </>
              )}
              {formType === 'holiday' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.academicYear')}</label>
                    <select required value={formData.academic_year_id || ''} onChange={e => setFormData({...formData, academic_year_id: e.target.value})}
                      className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                      <option value="">{t('academic.form.selectYear')}</option>
                      {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.name')}</label>
                    <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.date')}</label>
                      <input type="date" required value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('academic.form.type')}</label>
                      <select value={formData.type || 'school'} onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                        <option value="public">{t('academic.holidayTypes.public')}</option>
                        <option value="school">{t('academic.holidayTypes.school')}</option>
                        <option value="exam">{t('academic.holidayTypes.exam')}</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50">
                  {saving ? t('academic.form.saving') : t('academic.form.save')}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-300 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  {t('academic.form.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academic Years Tab */}
      {activeTab === 'years' && (
        <div className="space-y-4">
          {years.length > 0 ? years.map(y => (
            <div key={y.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-900 dark:text-purple-100 text-lg">{y.name}</h3>
                <p className="text-sm text-purple-600 dark:text-purple-400">{y.start_date} — {y.end_date}</p>
              </div>
              {y.is_current ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{t('academic.current')}</span>
              ) : null}
            </div>
          )) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-600 dark:text-purple-400">{t('academic.noYears')}</p>
            </div>
          )}
        </div>
      )}

      {/* Semesters Tab */}
      {activeTab === 'semesters' && (
        <div className="space-y-4">
          {semesters.length > 0 ? semesters.map(s => (
            <div key={s.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-900 dark:text-purple-100">{s.name}</h3>
                <p className="text-sm text-purple-600 dark:text-purple-400">{s.year_name} · {s.start_date} — {s.end_date}</p>
              </div>
              {s.is_current ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{t('academic.current')}</span>
              ) : null}
            </div>
          )) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-600 dark:text-purple-400">{t('academic.noSemesters')}</p>
            </div>
          )}
        </div>
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          {holidays.length > 0 ? holidays.map(h => (
            <div key={h.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-900 dark:text-purple-100">{h.name}</h3>
                <p className="text-sm text-purple-600 dark:text-purple-400">{h.year_name} · {h.date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${holidayTypeColors[h.type] || 'bg-gray-100 text-gray-700'}`}>
                {t(`academic.holidayTypes.${h.type}`)}
              </span>
            </div>
          )) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-600 dark:text-purple-400">{t('academic.noHolidays')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
