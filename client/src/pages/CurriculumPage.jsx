import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function CurriculumPage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [curriculum, setCurriculum] = useState([]);
  const [levels, setLevels] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');

  // Admin modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [toast, setToast] = useState('');

  // Add form state
  const [addForm, setAddForm] = useState({
    grade_id: '',
    subject_id: '',
    academic_year_id: '',
    weekly_periods: 1,
    is_required: 1,
  });
  // Edit form state
  const [editForm, setEditForm] = useState({ weekly_periods: 1, is_required: 1 });
  // Copy form state
  const [copyForm, setCopyForm] = useState({ from_year_id: '', to_year_id: '' });

  const fetchCurriculum = () => {
    setLoading(true);
    const params = {};
    if (selectedYear) params.academic_year_id = selectedYear;
    api
      .get('/curriculum', { params })
      .then((r) => {
        setCurriculum(r.data.curriculum || []);
        setLevels(r.data.levels || []);
        setGrades(r.data.grades || []);
        setSubjects(r.data.subjects || []);
      })
      .catch(() => setError(t('curriculum.loadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCurriculum();
  }, [selectedYear]);

  useEffect(() => {
    if (isAdmin) {
      api
        .get('/academic/years')
        .then((r) => setAcademicYears(r.data.years || []))
        .catch(() => {});
    }
  }, [isAdmin]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const filtered =
    selectedLevel === 'all' ? curriculum : curriculum.filter((g) => g.level_code === selectedLevel);
  const gradeData = selectedGrade ? curriculum.find((g) => g.code === selectedGrade) : null;
  const grouped = {};
  if (gradeData?.subjects)
    gradeData.subjects.forEach((s) => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });

  // ── Admin Actions ──

  const handleAddEntry = async () => {
    try {
      await api.post('/curriculum', addForm);
      setShowAddModal(false);
      setAddForm({
        grade_id: '',
        subject_id: '',
        academic_year_id: '',
        weekly_periods: 1,
        is_required: 1,
      });
      showToast(t('curriculum.createSuccess'));
      fetchCurriculum();
    } catch (err) {
      setError(err.response?.data?.error || t('curriculum.loadError'));
    }
  };

  const handleEditEntry = async () => {
    try {
      await api.put(`/curriculum/${editingEntry.gs_id}`, editForm);
      setShowEditModal(false);
      setEditingEntry(null);
      showToast(t('curriculum.updateSuccess'));
      fetchCurriculum();
    } catch (err) {
      setError(err.response?.data?.error || t('curriculum.loadError'));
    }
  };

  const handleDeleteEntry = async (gsId) => {
    if (!window.confirm(t('curriculum.confirmDelete'))) return;
    try {
      await api.delete(`/curriculum/${gsId}`);
      showToast(t('curriculum.deleteSuccess'));
      fetchCurriculum();
    } catch (err) {
      setError(err.response?.data?.error || t('curriculum.loadError'));
    }
  };

  const handleCopy = async () => {
    try {
      await api.post('/curriculum/copy', copyForm);
      setShowCopyModal(false);
      setCopyForm({ from_year_id: '', to_year_id: '' });
      showToast(t('curriculum.copiedSuccess'));
      fetchCurriculum();
    } catch (err) {
      setError(err.response?.data?.error || t('curriculum.loadError'));
    }
  };

  const openEditModal = (subject) => {
    setEditingEntry(subject);
    setEditForm({
      weekly_periods: subject.weekly_periods || 1,
      is_required: subject.is_required ?? 1,
    });
    setShowEditModal(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-purple-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-pulse">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
          {t('curriculum.title')}
        </h1>
      </div>
      <p className="text-purple-600/60 dark:text-purple-300/60 mb-8 ml-14">
        {t('curriculum.subtitle')}
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Academic year selector */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm focus:ring-2 focus:ring-purple-500 min-h-[44px]"
        >
          <option value="">{t('curriculum.allYears')}</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
              {y.is_current ? ' (Current)' : ''}
            </option>
          ))}
        </select>

        <div className="flex-1"></div>

        {/* Admin buttons */}
        {isAdmin && (
          <>
            <button
              onClick={() => setShowCopyModal(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-700 shadow-sm transition-all duration-200 min-h-[44px] cursor-pointer"
            >
              {t('curriculum.copyFromPreviousYear')}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-all duration-200 min-h-[44px] cursor-pointer"
            >
              + {t('curriculum.addEntry')}
            </button>
          </>
        )}
      </div>

      {/* Level filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { k: 'all', l: t('curriculum.allLevels') },
          { k: 'KG', l: t('curriculum.kg') },
          { k: 'PRI', l: t('curriculum.primary') },
          { k: 'LS', l: t('curriculum.lowerSecondary') },
          { k: 'US', l: t('curriculum.upperSecondary') },
        ].map((lv) => (
          <button
            key={lv.k}
            onClick={() => {
              setSelectedLevel(lv.k);
              setSelectedGrade(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${selectedLevel === lv.k ? 'bg-purple-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-sm'}`}
          >
            {lv.l}
          </button>
        ))}
      </div>

      {/* Grade cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((grade) => (
          <div
            key={grade.code}
            onClick={() => setSelectedGrade(selectedGrade === grade.code ? null : grade.code)}
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedGrade === grade.code ? 'ring-2 ring-purple-500' : ''}`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {grade.name}
                </h2>
                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium">
                  {grade.level_name}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grade.subjects.map((s) => (
                  <span
                    key={`${s.code}-${s.gs_id || ''}`}
                    className="inline-block bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-1 rounded-lg font-medium"
                    title={s.name}
                  >
                    {s.code}
                  </span>
                ))}
              </div>
              <p className="text-xs text-purple-400 dark:text-purple-400 mt-3 font-medium">
                {grade.subjects.length} {t('curriculum.subjects')}
              </p>
            </div>
            {selectedGrade === grade.code && (
              <div className="border-t border-purple-100 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-6">
                <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-3">
                  {t('curriculum.subjectsByCategory')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(grouped).map(([cat, subs]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase mb-1">
                        {cat}
                      </p>
                      <ul className="space-y-1">
                        {subs.map((s) => (
                          <li
                            key={s.code}
                            className="flex items-center justify-between gap-2 text-sm text-purple-800 dark:text-purple-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-10 text-center bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-mono px-1 py-0.5">
                                {s.code}
                              </span>
                              <span>{s.name}</span>
                              {s.weekly_periods && (
                                <span className="text-xs text-purple-400">
                                  ({s.weekly_periods}p)
                                </span>
                              )}
                              {s.is_required === 0 && (
                                <span className="text-xs text-amber-500">
                                  {t('curriculum.optional')}
                                </span>
                              )}
                            </div>
                            {isAdmin && s.gs_id && (
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => openEditModal(s)}
                                  className="p-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 text-purple-500 dark:text-purple-400 text-xs cursor-pointer"
                                  title={t('curriculum.editEntry')}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(s.gs_id)}
                                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 text-xs cursor-pointer"
                                  title={t('curriculum.deleteEntry')}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl">
          <p className="text-purple-500 dark:text-purple-400">{t('curriculum.noData')}</p>
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              {t('curriculum.addEntry')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {t('curriculum.grade')}
                </label>
                <select
                  value={addForm.grade_id}
                  onChange={(e) => setAddForm({ ...addForm, grade_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('curriculum.grade')}...</option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {t('curriculum.subject')}
                </label>
                <select
                  value={addForm.subject_id}
                  onChange={(e) => setAddForm({ ...addForm, subject_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('curriculum.subject')}...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {t('curriculum.academicYear')}
                </label>
                <select
                  value={addForm.academic_year_id}
                  onChange={(e) => setAddForm({ ...addForm, academic_year_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('curriculum.allYears')}</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    {t('curriculum.weeklyPeriods')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.weekly_periods}
                    onChange={(e) =>
                      setAddForm({ ...addForm, weekly_periods: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    {t('curriculum.required')}
                  </label>
                  <select
                    value={addForm.is_required}
                    onChange={(e) =>
                      setAddForm({ ...addForm, is_required: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={1}>{t('curriculum.required')}</option>
                    <option value={0}>{t('curriculum.optional')}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddEntry}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-all cursor-pointer"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && editingEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              {t('curriculum.editEntry')}
            </h2>
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
              {editingEntry.name} ({editingEntry.code})
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {t('curriculum.weeklyPeriods')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.weekly_periods}
                  onChange={(e) =>
                    setEditForm({ ...editForm, weekly_periods: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {t('curriculum.required')}
                </label>
                <select
                  value={editForm.is_required}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_required: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value={1}>{t('curriculum.required')}</option>
                  <option value={0}>{t('curriculum.optional')}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleEditEntry}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-all cursor-pointer"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Copy Modal ── */}
      {showCopyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCopyModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4">
              {t('curriculum.copyCurriculum')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {t('curriculum.sourceYear')}
                </label>
                <select
                  value={copyForm.from_year_id}
                  onChange={(e) => setCopyForm({ ...copyForm, from_year_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('curriculum.sourceYear')}...</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  {t('curriculum.targetYear')}
                </label>
                <select
                  value={copyForm.to_year_id}
                  onChange={(e) => setCopyForm({ ...copyForm, to_year_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('curriculum.targetYear')}...</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-all cursor-pointer"
              >
                {t('curriculum.copyCurriculum')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
