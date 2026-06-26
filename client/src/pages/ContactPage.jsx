import { useState } from 'react';
import api from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name:'', email:'', subject:'', message:'' });
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [loading, setLoading] = useState(false);
  const hc = (e) => setFormData({...formData,[e.target.name]:e.target.value});
  const hs = async (e) => { e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { await api.post('/contact', formData); setSuccess(t('contact.success')); setFormData({name:'',email:'',subject:'',message:''}); }
    catch (err) { setError(err.response?.data?.error || t('contact.error')); } finally { setLoading(false); }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-purple-900">{t('contact.title')}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-8">
          <h2 className="text-xl font-bold text-purple-900 mb-4">{t('contact.getInTouch')}</h2>
          <p className="text-purple-600/60 mb-8 leading-relaxed">{t('contact.description')}</p>
          <div className="space-y-4">
            {[
              {icon:'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z',sub:'M12 13a3 3 0 100-6 3 3 0 000 6z',l:t('contact.address'),v:t('footer.address')},
              {icon:'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',sub:'M22 6l-10 7L2 6',l:t('contact.email'),v:t('footer.email')},
              {icon:'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07',sub:'',l:t('contact.phone'),v:t('footer.phone')},
            ].map((o,i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={o.icon}/>{o.sub && <path d={o.sub}/>}</svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-900">{o.l}</p>
                  <p className="text-sm text-purple-600/70">{o.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={hs} className="bg-white rounded-2xl shadow-md shadow-purple-100/50 p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4 text-sm">{success}</div>}
          <div className="space-y-4">
            {[{id:'name',l:t('contact.name'),t:'text'},{id:'email',l:t('contact.email'),t:'email'},{id:'subject',l:t('contact.subject'),t:'text'}].map(f => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-semibold text-purple-900 mb-1.5">{f.l}</label>
                <input id={f.id} name={f.id} type={f.t} required className="w-full px-4 py-3 border border-purple-200 rounded-xl placeholder-purple-300 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm" value={formData[f.id]} onChange={hc} />
              </div>
            ))}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-purple-900 mb-1.5">{t('contact.message')}</label>
              <textarea id="message" name="message" rows="4" required className="w-full px-4 py-3 border border-purple-200 rounded-xl placeholder-purple-300 text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm" value={formData.message} onChange={hc} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer min-h-[44px]">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{t('contact.sending')}</span>
              ) : t('contact.sendMessage')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
