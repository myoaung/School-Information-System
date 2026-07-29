import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

export default function UserManagementPage() {
  const { t } = useTranslation();
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
    } catch (err) {
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          {/* Help icon */}
          <div className="relative">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <div className="absolute left-0 top-8 z-10 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-600">
                <h4 className="font-semibold text-gray-900 mb-2">User Management</h4>
                <ul className="space-y-1 list-disc list-inside">
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
                  className="mt-2 text-purple-600 hover:underline"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Search
          </button>
        </form>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => handleRoleFilter('')}
            className={`px-3 py-1 rounded-full text-sm ${!roleFilter ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All
          </button>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => handleRoleFilter(r)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${roleFilter === r ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No users found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
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
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
