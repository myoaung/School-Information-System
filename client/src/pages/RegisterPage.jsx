import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordsDontMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.name, formData.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('register.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register.signInExisting')}
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">{t('register.fullName')}</label>
              <input
                id="name" name="name" type="text" autoComplete="name" required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('register.fullName')}
                value={formData.name} onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">{t('register.email')}</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('register.email')}
                value={formData.email} onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('register.password')}</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password" required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('register.password')}
                value={formData.password} onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">{t('register.confirmPassword')}</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('register.confirmPassword')}
                value={formData.confirmPassword} onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">{t('register.role')}</label>
              <select
                id="role" name="role" required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={formData.role} onChange={handleChange}
              >
                <option value="student">{t('register.student')}</option>
                <option value="teacher">{t('register.teacher')}</option>
                <option value="admin">{t('register.admin')}</option>
              </select>
            </div>
          </div>
          <div>
            <button
              type="submit" disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('register.creatingAccount') : t('register.createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
