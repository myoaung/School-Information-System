import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">{t('login.title')}</h2>
          <p className="mt-2 text-sm text-purple-600/60 dark:text-purple-300/60">
            <Link to="/register" className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 transition-colors cursor-pointer">
              {t('login.createNew')}
            </Link>
          </p>
        </div>

        <form className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-purple-100/50 p-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1.5">
                {t('login.email')}
              </label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl placeholder-purple-300 text-purple-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                placeholder={t('login.email')}
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1.5">
                {t('login.password')}
              </label>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl placeholder-purple-300 text-purple-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                placeholder={t('login.password')}
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t('login.signingIn')}
                </span>
              ) : t('login.signIn')}
            </button>
          </div>
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-center">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">{t('login.demoTitle')}</p>
            <p className="text-xs text-purple-500 dark:text-purple-400 font-mono">{t('login.demoAccounts')}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
