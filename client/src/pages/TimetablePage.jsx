import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function TimetablePage() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ subject_id: '', teacher_id: '', day_of_week: 0, start_time: '08:00', end_time: '09:00', room: '' });
  const [saving, setSaving] = useState(false);

  const dayNames = [
    t('timetable.monday'), t('timetable.tuesday'), t('timetable.wednesday'),
    t('timetable.thursday'), t('timetable.friday'), t('timetable.saturday'), t('timetable.sunday')
  ];

  const fetchTimetable = () => {
    if (!selectedClass) return;
    setLoading(true);
    setSuggestions(null);
    setShowSuggestions(false);
    api.get('/timetable', { params: { class_id: selectedClass } })
      .then(r => setTimetable(r.data.timetable))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes)).catch(() => {});
    api.get('/curriculum').then(r => {
      const all = [];
      r.data.levels?.forEach(l => l.grades?.forEach(g => {}));
      setSubjects(r.data.subjects || []);
    }).catch(() => {});
    if (isAdmin) {
      api.get('/teachers').then(r => setTeachers(r.data.teachers)).catch(() => {});
    }
  }, []);

  useEffect(() => { fetchTimetable(); }, [selectedClass]);

  const generateSchedule = async () => {
    if (!selectedClass) return;
    setGenerating(true);
    try {
      const genRes = await api.post('/ai/generate', { class_id: parseInt(selectedClass), respect_existing: false });
      const schedule = genRes.data.schedule;
      if (schedule.proposed && schedule.proposed.length > 0) {
        await api.post('/ai/apply', { class_id: parseInt(selectedClass), entries: schedule.proposed, clear_existing: true });
        fetchTimetable();
        alert(`Generated ${schedule.new_periods} periods`);
      } else {
        alert('No schedule could be generated.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const loadSuggestions = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.get(`/ai/suggestions/${selectedClass}`);
      setSuggestions(res.data.suggestions);
      setShowSuggestions(true);
    } catch { alert('Failed to load suggestions'); }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/timetable', { class_id: parseInt(selectedClass), ...form });
      setShowModal(false);
      fetchTimetable();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    try {
      await api.delete(`/timetable/${deleteId}`);
      setDeleteId(null);
      fetchTimetable();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">{t('timetable.title')}</h1>
        </div>
        {isAdmin && selectedClass && (
          <button onClick={() => { setForm({ subject_id: '', teacher_id: '', day_of_week: 0, start_time: '08:00', end_time: '09:00', room: '' }); setShowModal(true); }}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add Entry
          </button>
        )}
      </div>

      {/* Class selector + AI Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('timetable.selectClass')}</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800">
              <option value="">{t('timetable.selectClassPlaceholder')}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {isAdmin && selectedClass && (
            <div className="flex gap-2">
              <button onClick={generateSchedule} disabled={generating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
                {generating ? <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> Generating...</> : <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Auto-Generate</>}
              </button>
              <button onClick={loadSuggestions}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-all flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                AI Tips
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && suggestions && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100">🤖 AI Schedule Suggestions</h2>
            <button onClick={() => setShowSuggestions(false)} className="text-purple-400 hover:text-purple-600 cursor-pointer">✕</button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-purple-800 dark:text-purple-200"
               dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(suggestions) }} />
        </div>
      )}

      {/* Timetable Grid */}
      {selectedClass && (
        loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div></div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 min-w-[700px]">
                {[0, 1, 2, 3, 4].map(day => (
                  <div key={day} className="bg-purple-50 dark:bg-purple-950/40 px-3 py-3 text-center">
                    <h3 className="font-bold text-purple-700 dark:text-purple-300 text-sm">{dayNames[day]}</h3>
                  </div>
                ))}
                {[0, 1, 2, 3, 4].map(day => (
                  <div key={day} className="border-r border-purple-100 dark:border-purple-800 last:border-r-0 min-h-[200px] p-2">
                    {(timetable[day] || []).length > 0 ? (
                      <div className="space-y-2">
                        {timetable[day].map(entry => (
                          <div key={entry.id} className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 relative group">
                            {isAdmin && (
                              <button onClick={() => setDeleteId(entry.id)}
                                className="absolute top-1 right-1 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            )}
                            <p className="font-bold text-purple-900 dark:text-purple-100 text-sm">{entry.subject_name}</p>
                            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">{entry.start_time} - {entry.end_time}</p>
                            <p className="text-xs text-purple-500 dark:text-purple-400">{entry.teacher_name}</p>
                            {entry.room && <p className="text-xs text-purple-400 dark:text-purple-400">📍 {entry.room}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full"><p className="text-purple-300 dark:text-purple-300 text-xs">—</p></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {!selectedClass && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p className="text-purple-500 dark:text-purple-400">{t('timetable.selectClassPrompt')}</p>
        </div>
      )}

      {/* Add Entry Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Timetable Entry">
        <form onSubmit={handleAddEntry} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Subject</label>
            <select required value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Teacher</label>
            <select value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
              <option value="">Select teacher</option>
              {teachers.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Day</label>
            <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer">
              {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Start</label>
              <input type="time" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">End</label>
              <input type="time" required value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Room</label>
              <input type="text" value={form.room} onChange={e => setForm({...form, room: e.target.value})} placeholder="Room 101"
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer">
              {saving ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDeleteEntry}
        title="Delete Entry" message="Remove this timetable entry?" />
    </div>
  );
}
