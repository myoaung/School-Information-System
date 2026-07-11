import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';

export default function QRScanPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setScanning(true);
    setResult(null);
    try {
      const res = await api.post('/attendance/scan', { token: token.trim() });
      setResult(res.data);
      toast.success('Attendance marked!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to scan QR code';
      toast.error(msg);
      setResult({ error: msg });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="3" height="3" />
              <rect x="18" y="18" width="3" height="3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-purple-900 dark:text-purple-100">Scan QR Code</h1>
          <p className="text-purple-500 dark:text-purple-400 text-sm mt-1">
            Enter the code shown by your teacher
          </p>
        </div>

        {/* Scan Form */}
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              QR Code Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter code..."
              className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 rounded-xl text-center text-lg font-mono tracking-wider bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !token.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Scanning...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Check In
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && !result.error && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="font-medium text-green-700 dark:text-green-300">Checked In!</span>
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
              <p>
                <span className="font-medium">Class:</span> {result.class}
              </p>
              {result.subject && (
                <p>
                  <span className="font-medium">Subject:</span> {result.subject}
                </p>
              )}
              <p>
                <span className="font-medium">Date:</span> {result.date}
              </p>
              <p>
                <span className="font-medium">Time:</span> {result.time}
              </p>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="font-medium text-red-700 dark:text-red-300">{result.error}</span>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-full mt-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}
