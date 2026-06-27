import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function CurriculumPage() {
  const { t } = useTranslation();
  const [curriculum, setCurriculum] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState(null);

  useEffect(() => { api.get('/curriculum').then(r => { setCurriculum(r.data.curriculum||[]); setLevels(r.data.levels||[]); }).catch(() => setError(t('curriculum.loadError'))).finally(() => setLoading(false)); }, []);

  const filtered = selectedLevel === 'all' ? curriculum : curriculum.filter(g => g.level_code === selectedLevel);
  const gradeData = selectedGrade ? curriculum.find(g => g.code === selectedGrade) : null;
  const grouped = {};
  if (gradeData?.subjects) gradeData.subjects.forEach(s => { if(!grouped[s.category]) grouped[s.category]=[]; grouped[s.category].push(s); });

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('curriculum.title')}</h1>
      </div>
      <p className="text-purple-600/60 dark:text-purple-300/60 mb-8 ml-14">{t('curriculum.subtitle')}</p>
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
      <div className="flex flex-wrap gap-2 mb-8">
        {[{k:'all',l:t('curriculum.allLevels')},{k:'KG',l:t('curriculum.kg')},{k:'PRI',l:t('curriculum.primary')},{k:'LS',l:t('curriculum.lowerSecondary')},{k:'US',l:t('curriculum.upperSecondary')}].map(lv => (
          <button key={lv.k} onClick={() => {setSelectedLevel(lv.k); setSelectedGrade(null);}}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${selectedLevel===lv.k ? 'bg-purple-600 text-white shadow-md' : 'bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-sm'}`}>
            {lv.l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(grade => (
          <div key={grade.code} onClick={() => setSelectedGrade(selectedGrade===grade.code?null:grade.code)}
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedGrade===grade.code?'ring-2 ring-purple-500':''}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">{grade.name}</h2>
                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium">{grade.level_name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grade.subjects.map(s => <span key={s.code} className="inline-block bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-1 rounded-lg font-medium" title={s.name}>{s.code}</span>)}
              </div>
              <p className="text-xs text-purple-400 dark:text-purple-400 mt-3 font-medium">{grade.subjects.length} {t('curriculum.subjects')}</p>
            </div>
            {selectedGrade===grade.code && (
              <div className="border-t border-purple-100 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-6">
                <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-3">{t('curriculum.subjectsByCategory')}</h3>
                <div className="space-y-3">
                  {Object.entries(grouped).map(([cat,subs]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase mb-1">{cat}</p>
                      <ul className="space-y-1">
                        {subs.map(s => (
                          <li key={s.code} className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
                            <span className="inline-block w-10 text-center bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-mono px-1 py-0.5">{s.code}</span>
                            <span>{s.name}</span>
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
      {filtered.length===0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl"><p className="text-purple-500 dark:text-purple-400">{t('curriculum.noData')}</p></div>
      )}
    </div>
  );
}
