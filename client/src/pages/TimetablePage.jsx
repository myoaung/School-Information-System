import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function TimetablePage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(false);

  const dayNames = [
    t('timetable.monday'), t('timetable.tuesday'), t('timetable.wednesday'),
    t('timetable.thursday'), t('timetable.friday'), t('timetable.saturday'), t('timetable.sunday')
  ];

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get('/timetable', { params: { class_id: selectedClass } })
      .then(r => setTimetable(r.data.timetable))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedClass]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900">{t('timetable.title')}</h1>
      </div>

      {/* Class selector */}
      <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
        <div className="max-w-sm">
          <label className="block text-sm font-medium text-purple-700 mb-1">{t('timetable.selectClass')}</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2 border border-purple-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">{t('timetable.selectClassPlaceholder')}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Timetable Grid */}
      {selectedClass && (
        loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 min-w-[700px]">
                {/* Day headers */}
                {[0, 1, 2, 3, 4].map(day => (
                  <div key={day} className="bg-purple-50 px-3 py-3 text-center">
                    <h3 className="font-bold text-purple-700 text-sm">{dayNames[day]}</h3>
                  </div>
                ))}

                {/* Day columns */}
                {[0, 1, 2, 3, 4].map(day => (
                  <div key={day} className="border-r border-purple-100 last:border-r-0 min-h-[200px] p-2">
                    {(timetable[day] || []).length > 0 ? (
                      <div className="space-y-2">
                        {timetable[day].map(entry => (
                          <div key={entry.id} className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                            <p className="font-bold text-purple-900 text-sm">{entry.subject_name}</p>
                            <p className="text-xs text-purple-500 mt-1">
                              {entry.start_time} - {entry.end_time}
                            </p>
                            <p className="text-xs text-purple-500">{entry.teacher_name}</p>
                            {entry.room && <p className="text-xs text-purple-400">📍 {entry.room}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-purple-300 text-xs">—</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {!selectedClass && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p className="text-purple-500">{t('timetable.selectClassPrompt')}</p>
        </div>
      )}
    </div>
  );
}
