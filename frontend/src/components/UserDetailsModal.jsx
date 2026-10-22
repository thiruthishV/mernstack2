import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookmarkCheck,
  Calendar,
  CreditCard,
  History,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { authAPI } from '../api/client';

export const UserDetailsModal = ({ isOpen, onClose, userId }) => {
  const [activeSubTab, setActiveSubTab] = useState('current'); // 'current' | 'history' | 'queue'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.getUserHistory(userId);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load user history:', err);
      setError(err.response?.data?.message || 'Failed to load user activity history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
      setActiveSubTab('current');
    } else {
      setData(null);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const user = data?.user;
  const currentBorrows = data?.currentBorrows || [];
  const borrowHistory = data?.borrowHistory || [];
  const reservations = data?.reservations || [];
  const metrics = data?.metrics || {};

  // Due date urgency calculation helper
  const getDueStatus = (dueDate, status) => {
    if (status === 'overdue') {
      const diffDays = Math.max(1, Math.ceil((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24)));
      return {
        type: 'danger',
        label: `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }

    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = (due - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      const diffDays = Math.max(1, Math.ceil(Math.abs(diffHours) / 24));
      return {
        type: 'danger',
        label: `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }

    if (diffHours <= 24) {
      return {
        type: 'warning',
        label: 'Due Today',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }

    const diffDays = Math.ceil(diffHours / 24);
    return {
      type: 'success',
      label: `Due in ${diffDays} days`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-teal-600/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{user?.name || 'User Profile'}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user?.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-teal-100 text-teal-700'
                  }`}
                >
                  {user?.role || 'Member'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user?.isActive !== false
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {user?.isActive !== false ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                  ID: {user?.membershipId || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {user?.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-sm font-medium">Loading user activity history...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Activity Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex flex-col">
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                    Currently Reading
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-teal-900">
                      {metrics.activeBorrowsCount || 0}
                    </span>
                    <span className="text-xs text-teal-600 font-medium">book(s)</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Returned Books
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-slate-800">
                      {metrics.borrowHistoryCount || 0}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">completed</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Pre-Booking Queue
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-amber-900">
                      {metrics.reservationsCount || 0}
                    </span>
                    <span className="text-xs text-amber-600 font-medium">reserved</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    Unpaid Fines
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-rose-900">
                      ₹{metrics.unpaidFineAmount || 0}
                    </span>
                    <span className="text-[11px] text-rose-600 font-medium">
                      (Total: ₹{metrics.totalFineAmount || 0})
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs Navigation */}
              <div className="flex border-b border-slate-200 gap-6">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('current')}
                  className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                    activeSubTab === 'current'
                      ? 'text-teal-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Currently Borrowed ({currentBorrows.length})
                  {activeSubTab === 'current' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('history')}
                  className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                    activeSubTab === 'history'
                      ? 'text-teal-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Borrowing History ({borrowHistory.length})
                  {activeSubTab === 'history' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('queue')}
                  className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                    activeSubTab === 'queue'
                      ? 'text-teal-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  Reservations & Queue ({reservations.length})
                  {activeSubTab === 'queue' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
                  )}
                </button>
              </div>

              {/* Tab 1 Content: Currently Borrowed Books & Due Dates */}
              {activeSubTab === 'current' && (
                <div className="space-y-3">
                  {currentBorrows.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No active borrowed books</p>
                      <p className="text-xs text-slate-400">
                        This member does not currently hold any books.
                      </p>
                    </div>
                  ) : (
                    currentBorrows.map((record) => {
                      const book = record.book || {};
                      const dueStatus = getDueStatus(record.dueDate, record.status);

                      return (
                        <div
                          key={record._id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3.5">
                            {book.coverImage ? (
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="w-12 h-16 object-cover rounded-xl shadow-sm border border-slate-100 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                                <BookOpen className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                                {book.title || 'Untitled Book'}
                              </h4>
                              <p className="text-xs text-slate-500">By {book.author || 'Unknown'}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-mono">
                                <span>ISBN: {book.isbn || 'N/A'}</span>
                                <span>•</span>
                                <span>Shelf: {book.shelfLocation || 'Rack CS-01'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${dueStatus.color}`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {dueStatus.label}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span>Borrowed: {new Date(record.borrowDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">
                                Due: {new Date(record.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            {record.fineAmount > 0 && (
                              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                Accrued Fine: ₹{record.fineAmount} ({record.finePaid ? 'Paid' : 'Unpaid'})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2 Content: Borrowing History */}
              {activeSubTab === 'history' && (
                <div className="space-y-3">
                  {borrowHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No past borrowing history</p>
                      <p className="text-xs text-slate-400">
                        This user hasn't returned any borrowed books yet.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Book Title</th>
                            <th className="py-3 px-4">Borrowed Date</th>
                            <th className="py-3 px-4">Returned Date</th>
                            <th className="py-3 px-4">Fine Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {borrowHistory.map((item) => {
                            const book = item.book || {};
                            return (
                              <tr key={item._id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {book.title || 'Unknown Title'}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {new Date(item.borrowDate).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {item.returnDate
                                    ? new Date(item.returnDate).toLocaleDateString()
                                    : 'Returned'}
                                </td>
                                <td className="py-3 px-4">
                                  {item.fineAmount > 0 ? (
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        item.finePaid
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-rose-100 text-rose-700'
                                      }`}
                                    >
                                      ₹{item.fineAmount} ({item.finePaid ? 'Paid' : 'Unpaid'})
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">No fine</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3 Content: Pre-Booking & Reservation History */}
              {activeSubTab === 'queue' && (
                <div className="space-y-3">
                  {reservations.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <BookmarkCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No reservations or queue records</p>
                      <p className="text-xs text-slate-400">
                        This user has not pre-booked any books.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Book Title</th>
                            <th className="py-3 px-4">Reserved At</th>
                            <th className="py-3 px-4">Queue Status</th>
                            <th className="py-3 px-4">Allocation Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {reservations.map((resItem) => {
                            const book = resItem.book || {};
                            return (
                              <tr key={resItem._id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {book.title || 'Unknown Title'}
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {new Date(resItem.reservedAt).toLocaleDateString()} at{' '}
                                  {new Date(resItem.reservedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      resItem.status === 'allocated'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : resItem.status === 'pending'
                                        ? 'bg-amber-100 text-amber-800'
                                        : resItem.status === 'fulfilled'
                                        ? 'bg-teal-100 text-teal-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {resItem.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-500">
                                  {resItem.expiryDate && resItem.status === 'allocated' ? (
                                    <span className="text-emerald-700 font-semibold text-[11px]">
                                      Claim before: {new Date(resItem.expiryDate).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
