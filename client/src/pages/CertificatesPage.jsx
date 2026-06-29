import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CertificatesPage() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ student_id: '', type: 'completion', data: { description: '', academic_year: '2026-2027', grade: '', gpa: '' } });

  useEffect(() => {
    api.get('/certificates').then(r => setCertificates(r.data)).catch(() => {}).finally(() => setLoading(false));
    if (isAdmin || isTeacher) {
      api.get('/students').then(r => setStudents(r.data.students || [])).catch(() => {});
    }
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/certificates/generate', form);
      setShowGenerate(false);
      setForm({ student_id: '', type: 'completion', data: { description: '', academic_year: '2026-2027', grade: '', gpa: '' } });
      const r = await api.get('/certificates');
      setCertificates(r.data);
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const viewCertificate = (id) => {
    window.open(`/api/certificates/${id}/html`, '_blank');
  };

  const typeIcons = {
    completion: '🎓',
    achievement: '🏆',
    transcript: '📄',
    graduation: '🎉'
  };

  const typeColors = {
    completion: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    achievement: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
    transcript: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    graduation: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Certificates</h1>
          <p className="text-purple-600/60 dark:text-purple-300/60 mt-1">{isAdmin || isTeacher ? 'Generate and manage certificates' : 'View your certificates'}</p>
        </div>
        {(isAdmin || isTeacher) && (
          <button onClick={() => setShowGenerate(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 cursor-pointer">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Generate
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-purple-200 dark:bg-gray-700 rounded-2xl" />)}
        </div>
      ) : certificates.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`px-6 py-4 ${typeColors[cert.type] || typeColors.completion}`}>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{typeIcons[cert.type] || '📄'}</span>
                  <span className="text-xs font-medium uppercase tracking-wide">{cert.type}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-1">{cert.student_name}</h3>
                <p className="text-xs text-purple-500 dark:text-purple-400 mb-3">{cert.student_code}</p>
                <div className="space-y-1 text-sm text-purple-700 dark:text-purple-300 mb-4">
                  <p><span className="text-purple-500 dark:text-purple-400">Serial:</span> {cert.serial_number}</p>
                  <p><span className="text-purple-500 dark:text-purple-400">Issued:</span> {new Date(cert.issued_at).toLocaleDateString()}</p>
                  <p><span className="text-purple-500 dark:text-purple-400">By:</span> {cert.issued_by_name || 'System'}</p>
                </div>
                <button onClick={() => viewCertificate(cert.id)}
                  className="w-full bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-900/70 text-purple-700 dark:text-purple-300 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  View Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-12 text-center">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">No Certificates Yet</h3>
          <p className="text-sm text-purple-500 dark:text-purple-400">
            {isAdmin || isTeacher ? 'Generate your first certificate using the button above.' : 'No certificates have been issued to you yet.'}
          </p>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Generate Certificate</h3>
              <button onClick={() => setShowGenerate(false)} className="p-1 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Student</label>
                <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} required
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Select student...</option>
                  {students.map(s => <option key={s.user_id || s.id} value={s.user_id || s.id}>{s.name} ({s.student_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Certificate Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="completion">Completion</option>
                  <option value="achievement">Achievement</option>
                  <option value="transcript">Transcript</option>
                  <option value="graduation">Graduation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Description</label>
                <textarea value={form.data.description} onChange={e => setForm({...form, data: {...form.data, description: e.target.value}})} rows={3}
                  className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" placeholder="Certificate description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Grade</label>
                  <input type="text" value={form.data.grade} onChange={e => setForm({...form, data: {...form.data, grade: e.target.value}})}
                    className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="e.g. A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">GPA</label>
                  <input type="text" value={form.data.gpa} onChange={e => setForm({...form, data: {...form.data, gpa: e.target.value}})}
                    className="w-full px-3 py-2 bg-purple-50 dark:bg-gray-700 border border-purple-200 dark:border-gray-600 rounded-lg text-sm text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="e.g. 3.8" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg cursor-pointer">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
