import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';

const CATEGORIES = [
  {
    value: 'fiction',
    label: 'Fiction',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  {
    value: 'non-fiction',
    label: 'Non-Fiction',
    color: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  },
  {
    value: 'textbook',
    label: 'Textbook',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
  {
    value: 'reference',
    label: 'Reference',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  },
  {
    value: 'other',
    label: 'Other',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
];

export default function LibraryPage() {
  const { isAdmin, isTeacher, user } = useAuth();
  const canManage = isAdmin || isTeacher;
  const [tab, setTab] = useState('catalog'); // catalog, borrows, my-borrows
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'other',
    total_copies: '1',
    description: '',
  });
  const [borrowForm, setBorrowForm] = useState({ user_id: '', due_date: '', notes: '' });
  const [students, setStudents] = useState([]);

  const fetchBooks = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    api
      .get('/library/books', { params })
      .then((r) => setBooks(r.data.books))
      .catch(() => toast.error('Failed to load books'))
      .finally(() => setLoading(false));
  };

  const fetchBorrows = () => {
    api
      .get('/library/borrows')
      .then((r) => setBorrows(r.data.borrows))
      .catch(() => {});
  };

  const fetchMyBorrows = () => {
    api
      .get('/library/borrows/my')
      .then((r) => setMyBorrows(r.data.borrows))
      .catch(() => {});
  };

  const fetchStats = () => {
    api
      .get('/library/stats')
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
    fetchBooks();
    if (canManage) {
      fetchBorrows();
      fetchStats();
      fetchStudents();
    }
    fetchMyBorrows();
  }, [categoryFilter]);

  useEffect(() => {
    if (tab === 'borrows') fetchBorrows();
    if (tab === 'my-borrows') fetchMyBorrows();
  }, [tab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const openCreateBook = () => {
    setEditBook(null);
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      category: 'other',
      total_copies: '1',
      description: '',
    });
    setShowBookModal(true);
  };

  const openEditBook = (book) => {
    setEditBook(book);
    setBookForm({
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || '',
      category: book.category || 'other',
      total_copies: String(book.total_copies),
      description: book.description || '',
    });
    setShowBookModal(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editBook) {
        await api.put(`/library/books/${editBook.id}`, bookForm);
        toast.success('Book updated');
      } else {
        await api.post('/library/books', bookForm);
        toast.success('Book added');
      }
      setShowBookModal(false);
      fetchBooks();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    try {
      await api.delete(`/library/books/${deleteId}`);
      setDeleteId(null);
      fetchBooks();
      fetchStats();
      toast.success('Book deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const openBorrowModal = (book) => {
    setSelectedBook(book);
    setBorrowForm({ user_id: '', due_date: '', notes: '' });
    setShowBorrowModal(true);
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/library/borrow', {
        book_id: selectedBook.id,
        user_id: parseInt(borrowForm.user_id),
        due_date: borrowForm.due_date || undefined,
        notes: borrowForm.notes || undefined,
      });
      setShowBorrowModal(false);
      toast.success('Book borrowed');
      fetchBooks();
      fetchBorrows();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to borrow');
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (borrowId) => {
    try {
      const res = await api.post(`/library/return/${borrowId}`);
      toast.success(res.data.fineAmount || 'Book returned');
      fetchBorrows();
      fetchBooks();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to return');
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
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-purple-900 dark:text-purple-100">Library</h1>
        </div>
        {canManage && (
          <button
            onClick={openCreateBook}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-2"
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
            Add Book
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Books',
              value: stats.totalBooks,
              color: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Active Borrows',
              value: stats.activeBorrows,
              color: 'text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Overdue',
              value: stats.overdueBorrows,
              color: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'Fines Collected',
              value: `${stats.totalFines} MMK`,
              color: 'text-amber-600 dark:text-amber-400',
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
          { key: 'catalog', label: '📚 Catalog' },
          ...(canManage ? [{ key: 'borrows', label: '📋 All Borrows' }] : []),
          { key: 'my-borrows', label: '📖 My Borrows' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
              tab === t.key
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200'
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
                placeholder="Search books..."
                className="flex-1 px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white dark:bg-gray-800"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 cursor-pointer"
              >
                Search
              </button>
            </form>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${!categoryFilter ? 'bg-emerald-600 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'}`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${categoryFilter === cat.value ? 'bg-emerald-600 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Books Grid */}
          {books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => {
                const cat = CATEGORIES.find((c) => c.value === book.category);
                return (
                  <div
                    key={book.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-purple-100/50 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-xl">
                          📖
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-sm line-clamp-1">
                            {book.title}
                          </h3>
                          <p className="text-xs text-purple-500 dark:text-purple-400">
                            {book.author || 'Unknown author'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color || 'bg-gray-100 text-gray-700'}`}
                      >
                        {cat?.label || book.category}
                      </span>
                      {book.isbn && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-800">
                          ISBN: {book.isbn}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs mb-3">
                      <span
                        className={`font-medium ${book.available_copies > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {book.available_copies}/{book.total_copies} available
                      </span>
                    </div>

                    {book.description && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-3 line-clamp-2">
                        {book.description}
                      </p>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-purple-100 dark:border-purple-800">
                      {canManage && book.available_copies > 0 && (
                        <button
                          onClick={() => openBorrowModal(book)}
                          className="flex-1 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer font-medium"
                        >
                          Borrow
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button
                            onClick={() => openEditBook(book)}
                            className="py-1.5 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(book.id)}
                            className="py-1.5 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer"
                          >
                            Delete
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
              <p className="text-purple-500 dark:text-purple-400">No books found</p>
            </div>
          )}
        </>
      )}

      {/* Borrows Tab */}
      {tab === 'borrows' && canManage && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-left">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Book</th>
                  <th className="px-4 py-3 font-medium">Borrowed</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Fine</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-purple-900">
                {borrows.map((b) => (
                  <tr key={b.id} className="hover:bg-purple-50/50">
                    <td className="px-4 py-3">{b.borrower_name}</td>
                    <td className="px-4 py-3">{b.book_title}</td>
                    <td className="px-4 py-3">{b.borrow_date}</td>
                    <td className="px-4 py-3">{b.due_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          b.status === 'returned'
                            ? 'bg-green-100 text-green-700'
                            : b.status === 'overdue' || new Date(b.due_date) < new Date()
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {b.status === 'borrowed' && new Date(b.due_date) < new Date()
                          ? 'overdue'
                          : b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{b.fine > 0 ? `${b.fine} MMK` : '—'}</td>
                    <td className="px-4 py-3">
                      {b.status === 'borrowed' && (
                        <button
                          onClick={() => handleReturn(b.id)}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer"
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

      {/* My Borrows Tab */}
      {tab === 'my-borrows' && (
        <div className="space-y-3">
          {myBorrows.length > 0 ? (
            myBorrows.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">{b.book_title}</p>
                  <p className="text-xs text-purple-500">Due: {b.due_date}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    b.status === 'returned'
                      ? 'bg-green-100 text-green-700'
                      : new Date(b.due_date) < new Date()
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {b.status === 'borrowed' && new Date(b.due_date) < new Date()
                    ? 'overdue'
                    : b.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <p className="text-purple-500">No borrows yet</p>
            </div>
          )}
        </div>
      )}

      {/* Book Modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title={editBook ? 'Edit Book' : 'Add Book'}
      >
        <form onSubmit={handleSaveBook} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Author
              </label>
              <input
                type="text"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Category
              </label>
              <select
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                Copies
              </label>
              <input
                type="number"
                min="1"
                value={bookForm.total_copies}
                onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value })}
                className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Description
            </label>
            <textarea
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBookModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : editBook ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Borrow Modal */}
      <Modal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        title={`Borrow: ${selectedBook?.title}`}
      >
        <form onSubmit={handleBorrow} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Student
            </label>
            <select
              required
              value={borrowForm.user_id}
              onChange={(e) => setBorrowForm({ ...borrowForm, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 cursor-pointer"
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.student_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={borrowForm.due_date}
              onChange={(e) => setBorrowForm({ ...borrowForm, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-purple-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-purple-400 mt-1">Default: 14 days from today</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBorrowModal(false)}
              className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Borrow'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBook}
        title="Delete Book"
        message="Are you sure you want to delete this book?"
      />
    </div>
  );
}
