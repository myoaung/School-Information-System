import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const { isAdmin } = useAuth();
  const fileInputRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Help tooltip
  const [showHelp, setShowHelp] = useState(false);

  const roles = ['admin', 'teacher', 'student', 'parent', 'accountant', 'staff'];

  const fetchUsers = (q = '', role = '', p = 1) => {
    setLoading(true);
    const params = { page: p, limit };
    if (q) params.search = q;
    if (role) params.role = role;
    api
      .get('/users', { params })
      .then((r) => {
        setUsers(r.data.users);
        setTotal(r.data.total);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(search, roleFilter, page);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search, roleFilter, 1);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setPage(1);
    fetchUsers(search, role, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchUsers(search, roleFilter, newPage);
  };

  // Edit user
  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone || '' });
    setShowEditModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
        toast.success('User updated');
      }
      setShowEditModal(false);
      fetchUsers(search, roleFilter, page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      toast.success('User deleted');
      fetchUsers(search, roleFilter, page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  // Export CSV
  const handleExport = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Exported successfully');
    } catch {
      toast.error('Failed to export');
    }
  };

  // Import CSV
  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.post('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Imported ${res.data.imported} users`);
      setShowImportModal(false);
      setImportFile(null);
      fetchUsers(search, roleFilter, 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import');
    } finally {
      setImporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
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
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
              User Management
            </h1>
            {/* Help icon */}
            <div className="relative">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
                title="Help"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {showHelp && (
                <div className="absolute left-0 top-8 z-10 w-72 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-xl shadow-lg p-4 text-sm text-purple-700 dark:text-purple-300">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    User Management
                  </h4>
                  <ul className="space-y-1 list-disc list-inside text-purple-600 dark:text-purple-400">
                    <li>View, edit, and delete user accounts</li>
                    <li>Filter by role or search by name/email</li>
                    <li>
                      <strong>Import:</strong> Upload CSV with columns: name, email, password, role,
                      phone
                    </li>
                    <li>
                      <strong>Export:</strong> Download filtered users as CSV
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="mt-2 text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => handleRoleFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              !roleFilter
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'
            }`}
          >
            All
          </button>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => handleRoleFilter(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 text-purple-300 dark:text-purple-400 mx-auto mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <p className="text-purple-500 dark:text-purple-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">User Management</caption>
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th scope="col" className="px-6 py-3 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/30">
                    <td className="px-6 py-4 font-medium text-purple-900 dark:text-purple-100">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-purple-600 dark:text-purple-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-purple-600 dark:text-purple-400">
                      {user.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-purple-500 dark:text-purple-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-xs font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 text-xs font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-3 bg-purple-50/50 dark:bg-purple-950/20 border-t border-purple-100 dark:border-purple-900">
            <span className="text-sm text-purple-600 dark:text-purple-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-300 disabled:opacity-50 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-sm text-purple-700 dark:text-purple-300 disabled:opacity-50 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 cursor-pointer"
              required
            >
              {roles.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-purple-900 dark:text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
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

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
        }}
        title="Import Users"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">CSV Format:</p>
            <p className="font-mono text-xs">name, email, password, role, phone</p>
            <p className="mt-1 text-xs">
              Example: John Doe, john@test.com, Password123, teacher, 0912345678
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full text-sm text-purple-700 dark:text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 dark:file:bg-purple-900/50 dark:file:text-purple-300 hover:file:bg-purple-200 dark:hover:file:bg-purple-800/50 cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
}
