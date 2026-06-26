import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function CurriculumPage() {
  const { t } = useTranslation();
  const [curriculum, setCurriculum] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState(null);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const res = await api.get('/curriculum');
      setCurriculum(res.data.curriculum || []);
      setLevels(res.data.levels || []);
      setSubjects(res.data.subjects || []);
    } catch (err) {
      setError(t('curriculum.loadError'));
      console.error('Error fetching curriculum:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCurriculum = selectedLevel === 'all'
    ? curriculum
    : curriculum.filter(g => g.level_code === selectedLevel);

  const selectedGradeData = selectedGrade
    ? curriculum.find(g => g.code === selectedGrade)
    : null;

  const groupedSubjects = {};
  if (selectedGradeData?.subjects) {
    selectedGradeData.subjects.forEach(s => {
      if (!groupedSubjects[s.category]) groupedSubjects[s.category] = [];
      groupedSubjects[s.category].push(s);
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">{t('curriculum.title')}</h1>
      <p className="text-gray-600 mb-8">{t('curriculum.subtitle')}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Level filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => { setSelectedLevel('all'); setSelectedGrade(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedLevel === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('curriculum.allLevels')}
        </button>
        <button
          onClick={() => { setSelectedLevel('KG'); setSelectedGrade(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedLevel === 'KG' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('curriculum.kg')}
        </button>
        <button
          onClick={() => { setSelectedLevel('PRI'); setSelectedGrade(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedLevel === 'PRI' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('curriculum.primary')}
        </button>
        <button
          onClick={() => { setSelectedLevel('LS'); setSelectedGrade(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedLevel === 'LS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('curriculum.lowerSecondary')}
        </button>
        <button
          onClick={() => { setSelectedLevel('US'); setSelectedGrade(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedLevel === 'US' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('curriculum.upperSecondary')}
        </button>
      </div>

      {/* Grade cards with subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCurriculum.map(grade => (
          <div
            key={grade.code}
            onClick={() => setSelectedGrade(selectedGrade === grade.code ? null : grade.code)}
            className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
              selectedGrade === grade.code ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold">{grade.name}</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {grade.level_name}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grade.subjects.map(subject => (
                  <span
                    key={subject.code}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    title={subject.name}
                  >
                    {subject.code}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {grade.subjects.length} {t('curriculum.subjects')}
              </p>
            </div>

            {/* Expanded detail */}
            {selectedGrade === grade.code && (
              <div className="border-t border-gray-100 bg-gray-50 p-6">
                <h3 className="text-sm font-semibold mb-3">{t('curriculum.subjectsByCategory')}</h3>
                <div className="space-y-3">
                  {Object.entries(groupedSubjects).map(([category, catSubjects]) => (
                    <div key={category}>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">{category}</p>
                      <ul className="space-y-1">
                        {catSubjects.map(s => (
                          <li key={s.code} className="flex items-center gap-2 text-sm">
                            <span className="inline-block w-10 text-center bg-white border border-gray-200 rounded text-xs font-mono px-1 py-0.5">
                              {s.code}
                            </span>
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

      {filteredCurriculum.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-lg">{t('curriculum.noData')}</p>
        </div>
      )}
    </div>
  );
}
