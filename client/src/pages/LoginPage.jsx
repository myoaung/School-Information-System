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

  const demoAccounts = [
    {
      email: 'admin@school.com',
      role: 'Admin',
      color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    },
    {
      email: 'accountant@school.com',
      role: 'Accountant',
      color: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
    },
    {
      email: 'hr@school.com',
      role: 'HR',
      color: 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300',
    },
    {
      email: 'teacher@school.com',
      role: 'Teacher',
      color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    },
    {
      email: 'student@school.com',
      role: 'Student',
      color: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300',
    },
    {
      email: 'parent@school.com',
      role: 'Parent',
      color: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
    },
  ];

  const fillDemo = (email) => {
    setEmail(email);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-purple-600 dark:text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">
            {t('login.title')}
          </h2>
          <p className="mt-2 text-sm text-purple-600/60 dark:text-purple-300/60">
            <Link
              to="/register"
              className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 transition-colors cursor-pointer"
            >
              {t('login.createNew')}
            </Link>
          </p>
        </div>

        <form
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-purple-100/50 p-8"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1.5"
              >
                {t('login.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl placeholder-purple-300 text-purple-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1.5"
              >
                {t('login.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 rounded-xl placeholder-purple-300 text-purple-900 dark:text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t('login.signingIn')}
                </span>
              ) : (
                t('login.signIn')
              )}
            </button>
          </div>
        </form>

        {/* Demo Accounts Info Box */}
        <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-purple-600 dark:text-purple-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100">
              {t('login.demoTitle')}
            </h3>
          </div>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => fillDemo(acc.email)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${acc.color}`}>
                    {acc.role}
                  </span>
                  <span className="text-sm font-mono text-purple-800 dark:text-purple-200">
                    {acc.email}
                  </span>
                </div>
                <span className="text-xs text-purple-400 dark:text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to fill →
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-purple-400 dark:text-purple-500 mt-3 text-center">
            {t('login.demoAccounts')}
          </p>
        </div>
      </div>
    </div>
  );
}
