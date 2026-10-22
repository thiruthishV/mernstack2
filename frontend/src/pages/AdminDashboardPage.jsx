import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  ShieldAlert,
  Coins,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Banknote,
  Eye,
  UserCheck,
  UserX,
  ShieldCheck,
  User,
  Power,
  XCircle,
  HelpCircle,
  BookmarkCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookAPI, borrowAPI, reservationAPI, authAPI } from '../api/client';
import { AddEditBookModal } from '../components/AddEditBookModal';
import PayFineModal from '../components/PayFineModal';
import EditUserModal from '../components/EditUserModal';
import UserDetailsModal from '../components/UserDetailsModal';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'borrows' | 'queue' | 'users'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab contents
  const [books, setBooks] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);

  // Modals & form state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [fineModalRecord, setFineModalRecord] = useState(null);
  const [fineModalMode, setFineModalMode] = useState('pay');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [borrowFilter, setBorrowFilter] = useState('all');
  const [reservationFilter, setReservationFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryPerPage = 15;

  // Current logged in admin
  const { user: currentAdmin } = useAuth();

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all' | 'active' | 'deactivated'
  const [editingUser, setEditingUser] = useState(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUserIdForDetails, setSelectedUserIdForDetails] = useState(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, booksRes, borrowsRes, reservationsRes, usersRes] = await Promise.all([
        borrowAPI.getAdminStats(),
        bookAPI.getBooks({}),
        borrowAPI.getAllBorrows(borrowFilter !== 'all' ? borrowFilter : undefined),
        reservationAPI.getAllReservations(
          reservationFilter !== 'all' ? reservationFilter : undefined
        ),
        authAPI.getAllUsers(),
      ]);

      setStats(statsRes.data || null);
      setBooks(Array.isArray(booksRes.data) ? booksRes.data : []);
      setBorrows(Array.isArray(borrowsRes.data) ? borrowsRes.data : []);
      setReservations(Array.isArray(reservationsRes.data) ? reservationsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setFeedback({ type: 'error', text: 'Error loading admin data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, [borrowFilter, reservationFilter]);

  // Book save handler (Add or Edit)
  const handleSaveBook = async (formData) => {
    setActionLoading(true);
    try {
      if (editingBook) {
        await bookAPI.updateBook(editingBook._id, formData);
        setFeedback({ type: 'success', text: `Updated "${formData.title}" successfully.` });
      } else {
        await bookAPI.createBook(formData);
        setFeedback({ type: 'success', text: `Added "${formData.title}" to catalog.` });
      }
      setIsBookModalOpen(false);
      setEditingBook(null);
      loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save book.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Book
  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await bookAPI.deleteBook(bookId);
      setFeedback({ type: 'success', text: `Removed "${title}".` });
      loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete book.',
      });
    }
  };

  // Mark borrow returned by admin
  const handleAdminReturn = async (borrowId) => {
    try {
      const res = await borrowAPI.returnBook(borrowId);
      setFeedback({
        type: 'success',
        text: res.data.reservationQueueNotified
          ? `Returned! Copy allocated to reserved member ${res.data.notifiedUser}!`
          : 'Book marked as returned successfully.',
      });
      loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to return book.',
      });
    }
  };

  // Mark fine paid
  const handlePayFine = async (borrowId) => {
    try {
      await borrowAPI.payFine(borrowId);
      setFeedback({ type: 'success', text: 'Fine marked as settled.' });
      loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to settle fine.',
      });
    }
  };

  // User Management Handlers
  const handleUpdateUser = async (userId, formData) => {
    setUserActionLoading(true);
    try {
      await authAPI.updateUser(userId, formData);
      setFeedback({ type: 'success', text: `Member "${formData.name}" updated successfully.` });
      setIsEditUserOpen(false);
      setEditingUser(null);
      loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update member details.',
      });
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userToToggle) => {
    try {
      const res = await authAPI.toggleUserStatus(userToToggle._id);
      setFeedback({ type: 'success', text: res.data.message });
      loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to toggle account status.',
      });
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    try {
      const res = await authAPI.deleteUser(userToDelete._id);
      setFeedback({ type: 'success', text: res.data.message });
      setDeleteConfirmUser(null);
      loadAllAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete member.',
      });
      setDeleteConfirmUser(null);
    }
  };

  const openUserDetails = (userId) => {
    setSelectedUserIdForDetails(userId);
    setIsUserDetailsOpen(true);
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setIsEditUserOpen(true);
  };

  const filteredUsers = users.filter((u) => {
    const s = userSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.membershipId?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s);

    const matchesStatus =
      userStatusFilter === 'all' ||
      (userStatusFilter === 'active' && u.isActive !== false) ||
      (userStatusFilter === 'deactivated' && u.isActive === false);

    return matchesSearch && matchesStatus;
  });

  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.isActive !== false).length;
  const deactivatedUsersCount = users.filter((u) => u.isActive === false).length;

  if (loading && !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Administrative Management
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Library Control Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage inventory catalog, issue/return circulation, queue reservations, and fines.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBook(null);
            setIsBookModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Book
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="uppercase text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* High-level Metric Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Unique Titles
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {stats.totalBooks}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Available Copies
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {stats.availableCopies}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {stats.totalCopies}</span>
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Borrows
            </span>
            <span className="text-2xl font-extrabold text-teal-600 mt-1 block">
              {stats.activeBorrows}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Overdue Items
            </span>
            <span
              className={`text-2xl font-extrabold mt-1 block ${
                stats.overdueBorrows > 0 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {stats.overdueBorrows}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              In Waitlist Queue
            </span>
            <span className="text-2xl font-extrabold text-amber-500 mt-1 block">
              {stats.pendingReservations + stats.allocatedReservations}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Fines
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              ₹{stats.totalFines}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Book Inventory ({books.length})
        </button>

        <button
          onClick={() => setActiveTab('borrows')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'borrows'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Circulation & Borrows ({borrows.length})
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Waitlist Queue ({reservations.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Registered Members ({users.length})
        </button>
      </div>

      {/* Tab 1: Book Inventory Table */}
      {activeTab === 'inventory' && (() => {
        const filteredBooks = books.filter(
          (b) =>
            b.title?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
            b.author?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
            b.category?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
            b.isbn?.toLowerCase().includes(inventorySearch.toLowerCase())
        );
        const totalInvPages = Math.ceil(filteredBooks.length / inventoryPerPage);
        const paginatedBooks = filteredBooks.slice(
          (inventoryPage - 1) * inventoryPerPage,
          inventoryPage * inventoryPerPage
        );

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => {
                    setInventorySearch(e.target.value);
                    setInventoryPage(1);
                  }}
                  placeholder="Filter by title, author, category, ISBN..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
                Total matching: <strong>{filteredBooks.length}</strong> of {books.length} books
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Title & Author</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">ISBN</th>
                      <th className="py-3.5 px-4">Rack Location</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedBooks.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{b.title}</div>
                          <div className="text-[11px] text-slate-400">by {b.author}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-600">
                            {b.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{b.isbn}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {b.shelfLocation}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold ${
                              b.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {b.availableCopies}
                          </span>{' '}
                          / {b.totalCopies}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingBook(b);
                              setIsBookModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit Book"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(b._id, b.title)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Delete Book"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalInvPages > 1 && (
                <div className="flex items-center justify-between p-3.5 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Page {inventoryPage} of {totalInvPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                      disabled={inventoryPage === 1}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setInventoryPage((p) => Math.min(totalInvPages, p + 1))
                      }
                      disabled={inventoryPage === totalInvPages}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Tab 2: Circulation & Borrows */}
      {activeTab === 'borrows' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Filter:</span>
            {['all', 'borrowed', 'returned'].map((status) => (
              <button
                key={status}
                onClick={() => setBorrowFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                  borrowFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Borrower</th>
                    <th className="py-3.5 px-4">Book Title</th>
                    <th className="py-3.5 px-4">Borrowed On</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status & Fine</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {borrows.map((borrow) => {
                    const isOverdue = borrow.isOverdue;
                    return (
                      <tr key={borrow._id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{borrow.user?.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {borrow.user?.membershipId} ({borrow.user?.email})
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {borrow.book?.title}
                        </td>
                        <td className="py-3.5 px-4">
                          {new Date(borrow.borrowDate).toLocaleDateString()}
                        </td>
                        <td
                          className={`py-3.5 px-4 font-semibold ${
                            isOverdue ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {new Date(borrow.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {borrow.status === 'borrowed' ? (
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  isOverdue
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {isOverdue ? 'OVERDUE' : 'ACTIVE'}
                              </span>
                              {borrow.calculatedFine > 0 && (
                                <span className="block text-[11px] font-bold text-rose-600 mt-1">
                                  Fine: ₹{borrow.calculatedFine}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600">
                                RETURNED
                              </span>
                              {borrow.fineAmount > 0 ? (
                                borrow.finePaid ? (
                                  <span className="block text-[11px] font-bold text-emerald-600 mt-1">
                                    Fine: ₹{borrow.fineAmount} (Paid)
                                  </span>
                                ) : (
                                  <span className="block text-[11px] font-bold text-rose-600 mt-1">
                                    Fine: ₹{borrow.fineAmount} (Unpaid)
                                  </span>
                                )
                              ) : (
                                <span className="block text-[11px] text-slate-400 mt-1">No Fine</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {borrow.status === 'borrowed' && (
                            <button
                              onClick={() => handleAdminReturn(borrow._id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] shadow-sm"
                            >
                              Return
                            </button>
                          )}
                          {borrow.fineAmount > 0 && !borrow.finePaid && (
                            <button
                              onClick={() => {
                                setFineModalRecord(borrow);
                                setFineModalMode('pay');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] shadow-sm inline-flex items-center gap-1"
                            >
                              <Banknote className="w-3 h-3" /> Settle Fine
                            </button>
                          )}
                          {borrow.fineAmount > 0 && borrow.finePaid && (
                            <button
                              onClick={() => {
                                setFineModalRecord(borrow);
                                setFineModalMode('receipt');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] shadow-sm inline-flex items-center gap-1"
                            >
                              <Receipt className="w-3 h-3 text-teal-600" /> Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pre-Booking Queue Monitor */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
            {['all', 'pending', 'allocated', 'fulfilled', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setReservationFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                  reservationFilter === st
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Book Title</th>
                    <th className="py-3.5 px-4">Reserved By</th>
                    <th className="py-3.5 px-4">Queue Position</th>
                    <th className="py-3.5 px-4">Reserved Date</th>
                    <th className="py-3.5 px-4">Status & Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reservations.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.book?.title || 'Unknown Book'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{r.user?.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.user?.membershipId} ({r.user?.email})
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {r.status === 'pending' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
                            #{r.queuePosition || 1} in queue
                          </span>
                        ) : r.status === 'allocated' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                            Allocated (Claim Active)
                          </span>
                        ) : (
                          <span className="text-slate-400 capitalize">{r.status}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {new Date(r.reservedAt).toLocaleDateString()} at{' '}
                        {new Date(r.reservedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        {r.status === 'allocated' && r.expiryDate && (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Expires: {new Date(r.expiryDate).toLocaleTimeString()}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px] block capitalize">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Registered Users & Member Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Summary KPI Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Registered
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalUsersCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Active Members
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1">{activeUsersCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Deactivated Accounts
                </span>
                <div className="text-2xl font-black text-rose-700 mt-1">{deactivatedUsersCount}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <UserX className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, phone, ID..."
                className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {userSearch && (
                <button
                  onClick={() => setUserSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                >
                  <option value="all">All ({totalUsersCount})</option>
                  <option value="active">Active Only ({activeUsersCount})</option>
                  <option value="deactivated">Deactivated ({deactivatedUsersCount})</option>
                </select>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredUsers.length} of {totalUsersCount}
              </span>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No members found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search query or filter options.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Member Name</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Membership ID</th>
                      <th className="py-3.5 px-4">Active Activity</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Joined Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.map((u) => {
                      const isSelf = currentAdmin && u._id === currentAdmin._id;

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Member Name & Role */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  u.role === 'admin'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-teal-100 text-teal-700'
                                }`}
                              >
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] rounded font-bold uppercase">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    u.role === 'admin'
                                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-900 font-medium">{u.email}</div>
                            {u.phone && (
                              <div className="text-[11px] text-slate-400">{u.phone}</div>
                            )}
                          </td>

                          {/* Membership ID */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                            {u.membershipId || '—'}
                          </td>

                          {/* Active Activity Counters */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                  (u.activeBorrowsCount || 0) > 0
                                    ? 'text-teal-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                {u.activeBorrowsCount || 0} borrowed
                              </span>
                              {(u.activeReservationsCount || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                  <BookmarkCheck className="w-3.5 h-3.5" />
                                  {u.activeReservationsCount} queued
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => handleToggleUserStatus(u)}
                              title={
                                isSelf
                                  ? 'You cannot deactivate your own admin account'
                                  : u.isActive !== false
                                  ? 'Click to Deactivate'
                                  : 'Click to Activate'
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                isSelf ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                              } ${
                                u.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              {u.isActive !== false ? 'Active' : 'Deactivated'}
                            </button>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details & Activity */}
                              <button
                                type="button"
                                onClick={() => openUserDetails(u._id)}
                                title="View User Details & Activity History"
                                className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Profile */}
                              <button
                                type="button"
                                onClick={() => openEditUser(u)}
                                title="Edit User Details"
                                className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Toggle Status Button */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u)}
                                  title={
                                    u.isActive !== false
                                      ? 'Deactivate User Account'
                                      : 'Activate User Account'
                                  }
                                  className={`p-2 rounded-xl border border-transparent transition-colors ${
                                    u.isActive !== false
                                      ? 'text-amber-600 hover:bg-amber-50 hover:border-amber-200'
                                      : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                                  }`}
                                >
                                  {u.isActive !== false ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              {/* Delete User */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmUser(u)}
                                  title="Delete User"
                                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:border-rose-200 border border-transparent transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Member Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-slate-800">"{deleteConfirmUser.name}"</span> (
                {deleteConfirmUser.email})?
              </p>
              {(deleteConfirmUser.activeBorrowsCount || 0) > 0 && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium text-left">
                  ⚠️ This member currently has {deleteConfirmUser.activeBorrowsCount} unreturned book(s).
                  They cannot be deleted until all books are returned to the library!
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteConfirmUser)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all"
              >
                Yes, Delete Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditUserOpen}
        onClose={() => {
          setIsEditUserOpen(false);
          setEditingUser(null);
        }}
        onSave={handleUpdateUser}
        user={editingUser}
        loading={userActionLoading}
        currentAdminId={currentAdmin?._id}
      />

      {/* User Details & History Modal */}
      <UserDetailsModal
        isOpen={isUserDetailsOpen}
        onClose={() => {
          setIsUserDetailsOpen(false);
          setSelectedUserIdForDetails(null);
        }}
        userId={selectedUserIdForDetails}
      />

      {/* Add / Edit Book Modal */}
      <AddEditBookModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setEditingBook(null);
        }}
        onSave={handleSaveBook}
        book={editingBook}
        loading={actionLoading}
      />

      {/* Pay Fine / Receipt Settlement Modal */}
      <PayFineModal
        record={fineModalRecord}
        isOpen={Boolean(fineModalRecord)}
        onClose={() => setFineModalRecord(null)}
        isAdmin={true}
        initialMode={fineModalMode}
        onSuccess={() => {
          setFeedback({ type: 'success', text: 'Overdue fine settled successfully.' });
          loadAllAdminData();
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
