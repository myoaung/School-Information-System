import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { toast } from 'sonner';

const CATEGORIES = [
  {
    value: 'equipment',
    label: 'Equipment',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    icon: '💻',
  },
  {
    value: 'furniture',
    label: 'Furniture',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    icon: '🪑',
  },
  {
    value: 'lab_supplies',
    label: 'Lab Supplies',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
    icon: '🧪',
  },
  {
    value: 'books',
    label: 'Books',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    icon: '📚',
  },
  {
    value: 'stationery',
    label: 'Stationery',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
    icon: '✏️',
  },
  {
    value: 'other',
    label: 'Other',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: '📦',
  },
];

const CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'];

export default function InventoryPage() {
  const { isAdmin, isTeacher } = useAuth();
  const canManage = isAdmin || isTeacher;
  const [tab, setTab] = useState('catalog');
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'equipment',
    description: '',
    quantity: '1',
    unit: 'piece',
    location: '',
    condition_status: 'new',
    purchase_date: '',
    purchase_price: '',
    supplier: '',
  });
  const [issueForm, setIssueForm] = useState({
    user_id: '',
    quantity: '1',
    due_date: '',
    notes: '',
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: 'repair',
    description: '',
    cost: '',
    performed_by: '',
    maintenance_date: new Date().toISOString().split('T')[0],
    next_service_date: '',
    notes: '',
  });

  const fetchItems = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    api
      .get('/inventory', { params })
      .then((r) => setItems(r.data.items))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  };

  const fetchTransactions = () => {
    api
      .get('/inventory/transactions/list')
      .then((r) => setTransactions(r.data.transactions))
      .catch(() => {});
  };

  const fetchMaintenance = () => {
    api
      .get('/inventory/maintenance/list')
      .then((r) => setMaintenance(r.data.records))
      .catch(() => {});
  };

  const fetchStats = () => {
    api
      .get('/inventory/stats/summary')
      .then((r) => setStats(r.data.stats))
      .catch(() => {});
  };

  const fetchStudents = () => {
    api
      .get('/students')
      .then((r) => setStudents(r.data.students || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchItems();
    fetchStats();
    if (canManage) {
      fetchTransactions();
      fetchMaintenance();
      fetchStudents();
    }
  }, [categoryFilter]);

  useEffect(() => {
    if (tab === 'transactions') fetchTransactions();
    if (tab === 'maintenance') fetchMaintenance();
  }, [tab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const openCreateItem = () => {
    setEditItem(null);
    setItemForm({
      name: '',
      category: 'equipment',
      description: '',
      quantity: '1',
      unit: 'piece',
      location: '',
      condition_status: 'new',
      purchase_date: '',
      purchase_price: '',
      supplier: '',
    });
    setShowItemModal(true);
  };

  const openEditItem = (item) => {
    setEditItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      description: item.description || '',
      quantity: String(item.quantity),
      unit: item.unit || 'piece',
      location: item.location || '',
      condition_status: item.condition_status || 'new',
      purchase_date: item.purchase_date || '',
      purchase_price: item.purchase_price || '',
      supplier: item.supplier || '',
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/inventory/${editItem.id}`, itemForm);
        toast.success('Item updated');
      } else {
        await api.post('/inventory', itemForm);
        toast.success('Item added');
      }
      setShowItemModal(false);
      fetchItems();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      await api.delete(`/inventory/${deleteId}`);
      setDeleteId(null);
      fetchItems();
      fetchStats();
      toast.success('Item deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const openIssueModal = (item) => {
    setSelectedItem(item);
    setIssueForm({ user_id: '', quantity: '1', due_date: '', notes: '' });
    setShowIssueModal(true);
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/issue', {
        item_id: selectedItem.id,
        user_id: parseInt(issueForm.user_id),
        quantity: parseInt(issueForm.quantity),
        due_date: issueForm.due_date || undefined,
        notes: issueForm.notes || undefined,
      });
      setShowIssueModal(false);
      toast.success('Item issued');
      fetchItems();
      fetchTransactions();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to issue');
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (transactionId) => {
    try {
      await api.post(`/inventory/return/${transactionId}`);
      toast.success('Item returned');
      fetchItems();
      fetchTransactions();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to return');
    }
  };

  const openMaintenanceModal = (item) => {
    setSelectedItem(item);
    setMaintenanceForm({
      maintenance_type: 'repair',
      description: '',
      cost: '',
      performed_by: '',
      maintenance_date: new Date().toISOString().split('T')[0],
      next_service_date: '',
      notes: '',
    });
    setShowMaintenanceModal(true);
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/maintenance', {
        item_id: selectedItem.id,
        ...maintenanceForm,
      });
      setShowMaintenanceModal(false);
      toast.success('Maintenance record added');
      fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">
            Inventory
          </h1>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateItem}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-2"
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
            Add Item
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Items',
              value: stats.totalItems,
              color: 'text-amber-600 dark:text-amber-400',
            },
            { label: 'Issued Out', value: stats.issued, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Low Stock', value: stats.lowStock, color: 'text-red-600 dark:text-red-400' },
            {
              label: 'Overdue',
              value: stats.overdue,
              color: 'text-orange-600 dark:text-orange-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-purple-500 dark:text-purple-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'catalog', label: '📦 Catalog' },
          ...(canManage ? [{ key: 'transactions', label: '📋 Transactions' }] : []),
          ...(canManage ? [{ key: 'maintenance', label: '🔧 Maintenance' }] : []),
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
              tab === t.key
                ? 'bg-amber-600 text-white'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Catalog Tab */}
      {tab === 'catalog' && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="flex-1 px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none bg-white dark:bg-gray-800"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 cursor-pointer"
              >
                Search
              </button>
            </form>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Items Grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const cat = CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-xl">
                          {cat?.icon || '📦'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                            {item.name}
                          </h3>
                          <p className="text-xs text-purple-500">
                            {item.location || 'No location'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color}`}
                      >
                        {cat?.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800">
                        {item.condition_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span
                        className={`font-bold ${item.quantity <= 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                      {item.purchase_price && (
                        <span className="text-purple-500">
                          {item.purchase_price.toLocaleString()} MMK
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-purple-100 dark:border-purple-800">
                      {canManage && item.quantity > 0 && (
                        <button
                          onClick={() => openIssueModal(item)}
                          className="flex-1 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg cursor-pointer font-medium"
                        >
                          Issue
                        </button>
                      )}
                      <button
                        onClick={() => openMaintenanceModal(item)}
                        className="flex-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer font-medium"
                      >
                        Maintain
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditItem(item)}
                            className="py-1.5 px-2 text-xs text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="py-1.5 px-2 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            Del
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No items found</p>
            </div>
          )}
        </>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && canManage && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium">{t.item_name}</td>
                    <td className="px-4 py-3">{t.user_name}</td>
                    <td className="px-4 py-3">{t.quantity}</td>
                    <td className="px-4 py-3">{t.issue_date}</td>
                    <td className="px-4 py-3">{t.due_date || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.status === 'returned'
                            ? 'bg-green-100 text-green-700'
                            : t.status === 'overdue' ||
                                (t.due_date && new Date(t.due_date) < new Date())
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {t.status === 'issued' && t.due_date && new Date(t.due_date) < new Date()
                          ? 'overdue'
                          : t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'issued' && (
                        <button
                          onClick={() => handleReturn(t.id)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium cursor-pointer"
                        >
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {tab === 'maintenance' && canManage && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Performed By</th>
                  <th className="px-4 py-3 font-medium">Next Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {maintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3 font-medium">{m.item_name}</td>
                    <td className="px-4 py-3 capitalize">{m.maintenance_type}</td>
                    <td className="px-4 py-3">{m.maintenance_date}</td>
                    <td className="px-4 py-3">{m.cost ? `${m.cost.toLocaleString()} MMK` : '—'}</td>
                    <td className="px-4 py-3">{m.performed_by || '—'}</td>
                    <td className="px-4 py-3">{m.next_service_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Modal */}
      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editItem ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={handleSaveItem} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Category
              </label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="0"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Condition
              </label>
              <select
                value={itemForm.condition_status}
                onChange={(e) => setItemForm({ ...itemForm, condition_status: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={itemForm.location}
                onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Purchase Price (MMK)
              </label>
              <input
                type="number"
                min="0"
                value={itemForm.purchase_price}
                onChange={(e) => setItemForm({ ...itemForm, purchase_price: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowItemModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editItem ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Issue Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title={`Issue: ${selectedItem?.name}`}
      >
        <form onSubmit={handleIssue} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              User
            </label>
            <select
              required
              value={issueForm.user_id}
              onChange={(e) => setIssueForm({ ...issueForm, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="">Select user</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem?.quantity}
                value={issueForm.quantity}
                onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={issueForm.due_date}
                onChange={(e) => setIssueForm({ ...issueForm, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        title={`Maintenance: ${selectedItem?.name}`}
      >
        <form onSubmit={handleAddMaintenance} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Type
              </label>
              <select
                value={maintenanceForm.maintenance_type}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                <option value="repair">Repair</option>
                <option value="service">Service</option>
                <option value="inspection">Inspection</option>
                <option value="replacement">Replacement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Cost (MMK)
              </label>
              <input
                type="number"
                min="0"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={maintenanceForm.description}
              onChange={(e) =>
                setMaintenanceForm({ ...maintenanceForm, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={maintenanceForm.maintenance_date}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, maintenance_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Next Service
              </label>
              <input
                type="date"
                value={maintenanceForm.next_service_date}
                onChange={(e) =>
                  setMaintenanceForm({ ...maintenanceForm, next_service_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Performed By
            </label>
            <input
              type="text"
              value={maintenanceForm.performed_by}
              onChange={(e) =>
                setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })
              }
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowMaintenanceModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Item">
        <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
          Are you sure you want to delete this item?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteItem}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
