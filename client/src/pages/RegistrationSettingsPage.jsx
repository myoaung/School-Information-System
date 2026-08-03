import { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

export default function RegistrationSettingsPage() {
  const { t } = useTranslation();
  const [periods, setPeriods] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    grade_id: '',
    start_date: '',
    end_date: '',
    max_seats: 50,
    status: 'open',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [periodsRes, gradesRes] = await Promise.all([
        api.get('/registration/periods'),
        api.get('/curriculum'),
      ]);
      setPeriods(periodsRes.data.periods || []);
      setGrades(gradesRes.data.grades || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditPeriod(null);
    setForm({ grade_id: '', start_date: '', end_date: '', max_seats: 50, status: 'open' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPeriod(p);
    setForm({
      grade_id: p.grade_id,
      start_date: p.start_date?.slice(0, 16) || '',
      end_date: p.end_date?.slice(0, 16) || '',
      max_seats: p.max_seats,
      status: p.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/registration/periods', form);
      setShowModal(false);
      fetchData();
      toast.success(editPeriod ? 'Period updated' : 'Period created');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/registration/periods/${deleteId}`);
      setDeleteId(null);
      fetchData();
      toast.success('Period deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600 dark:text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
              Registration Settings
            </h1>
            <p className="text-sm text-purple-500 dark:text-purple-400">
              Manage registration periods and seat limits per grade
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Period
        </button>
      </div>

      {periods.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Start Date</th>
                  <th className="px-4 py-3 font-medium">End Date</th>
                  <th className="px-4 py-3 font-medium">Seats</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                    <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                      {p.grade_name || `Grade ${p.grade_id}`}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {new Date(p.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">
                      {new Date(p.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${p.current_seats >= p.max_seats ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {p.current_seats}/{p.max_seats}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'open'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50">
          <svg
            className="w-12 h-12 text-purple-300 mx-auto mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-purple-500 dark:text-purple-400">No registration periods configured</p>
          <p className="text-sm text-purple-400 mt-1">
            Create a period to open registration for a grade
          </p>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editPeriod ? 'Edit Period' : 'New Registration Period'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Grade
            </label>
            <select
              value={form.grade_id}
              onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
            >
              <option value="">Select grade</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                required
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Max Seats
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.max_seats}
                onChange={(e) => setForm({ ...form, max_seats: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Period"
        message="Are you sure you want to delete this registration period?"
      />
    </div>
  );
}
