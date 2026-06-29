import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (formData.password !== formData.confirmPassword) { setError(t('register.passwordsDontMatch')); return; }
    if (formData.password.length < 8) { setError(t('register.passwordTooShort')); return; }
    setLoading(true);
    try { await register(formData.email, formData.password, formData.name, formData.role, formData.phone); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.error || t('register.error')); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">{t('register.title')}</h2>
          <p className="mt-2 text-sm text-purple-600/60 dark:text-purple-300/60">
            <Link to="/login" className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 transition-colors cursor-pointer">{t('register.signInExisting')}</Link>
          </p>
        </div>
        <form className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-purple-100/50 p-8" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
          <div className="space-y-3">
            {[
              { id: 'name', type: 'text', label: t('register.fullName'), ph: t('register.fullName'), ac: 'name' },
              { id: 'email', type: 'email', label: t('register.email'), ph: t('register.email'), ac: 'email' },
              { id: 'phone', type: 'tel', label: t('register.phone'), ph: t('register.phonePlaceholder'), ac: 'tel' },
              { id: 'password', type: 'password', label: t('register.password'), ph: t('register.password'), ac: 'new-password' },
              { id: 'confirmPassword', type: 'password', label: t('register.confirmPassword'), ph: t('register.confirmPassword'), ac: 'new-password' },
            ].map(field => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1.5">{field.label}</label>
                <input
                  id={field.id} name={field.id} type={field.type} autoComplete={field.ac}
                  required={field.id !== 'phone'}
                  className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl placeholder-purple-300 text-purple-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  placeholder={field.ph} value={formData[field.id]} onChange={handleChange}
                />
              </div>
            ))}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1.5">{t('register.role')}</label>
              <select
                id="role" name="role" required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm bg-white dark:bg-gray-800 cursor-pointer"
                value={formData.role} onChange={handleChange}
              >
                <option value="student">{t('register.student')}</option>
                <option value="parent">{t('register.parent')}</option>
              </select>
              <p className="text-xs text-purple-400 dark:text-purple-500 mt-1">{t('register.roleNote')}</p>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t('register.creatingAccount')}
                </span>
              ) : t('register.createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
