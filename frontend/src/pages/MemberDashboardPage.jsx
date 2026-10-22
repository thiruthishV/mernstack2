import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  Bell,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Sparkles,
  Receipt,
  CreditCard
} from 'lucide-react';
import { borrowAPI, reservationAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PayFineModal from '../components/PayFineModal';

export const MemberDashboardPage = () => {
  const { user } = useAuth();
  const { notifications, markAsRead, fetchNotifications } = useNotifications();

  const [activeTab, setActiveTab] = useState('borrows'); // 'borrows' | 'reservations' | 'history' | 'notifications'
  const [borrows, setBorrows] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnModalResult, setReturnModalResult] = useState(null);
  const [fineModalRecord, setFineModalRecord] = useState(null);
  const [fineModalMode, setFineModalMode] = useState('pay');
  const [errorMsg, setErrorMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [borrowsRes, reservationsRes] = await Promise.all([
        borrowAPI.getMyBorrows(),
        reservationAPI.getMyReservations(),
      ]);
      setBorrows(Array.isArray(borrowsRes.data) ? borrowsRes.data : []);
      setReservations(Array.isArray(reservationsRes.data) ? reservationsRes.data : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setErrorMsg('Could not fetch data. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle returning a book
  const handleReturn = async (borrowId) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await borrowAPI.returnBook(borrowId);
      setReturnModalResult(res.data);
      // Refresh list and notifications
      await loadData();
      fetchNotifications();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to return book.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancelling a reservation
  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this pre-booking?')) return;
    setActionLoading(true);
    try {
      await reservationAPI.cancelReservation(reservationId);
      await loadData();
      fetchNotifications();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate high-level stats
  const activeBorrows = borrows.filter((b) => b.status === 'borrowed');
  const pastBorrows = borrows.filter((b) => b.status === 'returned');
  const activeReservations = reservations.filter((r) =>
    ['pending', 'allocated'].includes(r.status)
  );
  const activeFines = activeBorrows.reduce(
    (sum, b) => sum + (b.calculatedFine || 0),
    0
  );
  const unpaidPastFines = pastBorrows
    .filter((b) => b.fineAmount > 0 && !b.finePaid)
    .reduce((sum, b) => sum + b.fineAmount, 0);
  const totalPendingFines = activeFines + unpaidPastFines;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile & Stats */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-teal-100">
              {user?.role === 'admin' ? 'Administrator' : 'Member Account'}
            </span>
            <span className="text-xs text-teal-200">ID: {user?.membershipId || 'LIB-2001'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/80 mt-1">
            Track your borrowed titles, automated waitlist reservations, and pickup notifications.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-200 block">
              Active Borrows
            </span>
            <span className="text-xl font-extrabold">{activeBorrows.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-300 block">
              In Waitlist
            </span>
            <span className="text-xl font-extrabold">{activeReservations.length}</span>
          </div>
          {totalPendingFines > 0 && (
            <div className="bg-rose-500/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-rose-400/30 text-center">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-200 block">
                Overdue Fine
              </span>
              <span className="text-xl font-extrabold text-rose-300">₹{totalPendingFines}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="uppercase text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Dashboard Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('borrows')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'borrows'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Active Borrows ({activeBorrows.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reservations'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Pre-Bookings & Queue ({activeReservations.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Past History ({pastBorrows.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'notifications'
              ? 'bg-teal-50 text-teal-700 font-bold border border-teal-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          Alerts ({notifications.length})
        </button>
      </div>

      {/* Tab 1: Active Borrows */}
      {activeTab === 'borrows' && (
        <div className="space-y-4">
          {activeBorrows.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No books currently borrowed</h3>
              <p className="text-xs text-slate-500 mt-1">
                Browse our catalog to borrow books or reserve high-demand titles.
              </p>
              <Link
                to="/books"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-teal-700"
              >
                Explore Books <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBorrows.map((borrow) => {
                const book = borrow.book;
                const dueDate = new Date(borrow.dueDate);
                const isOverdue = borrow.isOverdue;
                const fine = borrow.calculatedFine || 0;

                return (
                  <div
                    key={borrow._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="flex gap-4">
                      {book?.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded-xl shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-24 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                          Book
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                          {book?.category || 'General'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                          <Link to={`/books/${book?._id}`} className="hover:text-teal-600">
                            {book?.title || 'Unknown Title'}
                          </Link>
                        </h4>
                        <p className="text-xs text-slate-500 truncate">by {book?.author}</p>

                        <div className="mt-2.5 space-y-1 text-xs">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Borrowed: {new Date(borrow.borrowDate).toLocaleDateString()}</span>
                          </div>
                          <div
                            className={`flex items-center gap-1 font-semibold ${
                              isOverdue ? 'text-rose-600' : 'text-slate-700'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Due Date: {dueDate.toLocaleDateString()}</span>
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] uppercase font-bold">
                                Overdue
                              </span>
                            )}
                          </div>
                          {fine > 0 && (
                            <div className="flex items-center gap-1 text-rose-600 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Fine: ₹{fine} (₹5/day)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Shelf: {book?.shelfLocation || 'Rack CS-01'}
                      </span>
                      <button
                        onClick={() => handleReturn(borrow._id)}
                        disabled={actionLoading}
                        className="py-1.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Return Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pre-Bookings & Queue (Hero Feature!) */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Pre-Booking Queue Status:</strong> When a book has 0 copies, you enter the
              queue. Once any reader returns a copy, it is automatically locked for you with an
              instant alert!
            </span>
          </div>

          {activeReservations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No active pre-bookings</h3>
              <p className="text-xs text-slate-500 mt-1">
                You haven't queued for any out-of-stock books yet.
              </p>
              <Link
                to="/books?availability=unavailable"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold shadow hover:bg-amber-600"
              >
                View Reserved Titles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeReservations.map((resItem) => {
                const book = resItem.book;
                const isAllocated = resItem.status === 'allocated';
                const isPending = resItem.status === 'pending';

                return (
                  <div
                    key={resItem._id}
                    className={`rounded-2xl border p-5 shadow-sm transition-shadow flex flex-col justify-between ${
                      isAllocated
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Status Header Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {isAllocated ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm animate-bounce">
                            <Sparkles className="w-3.5 h-3.5" />
                            Book Ready For Pickup!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            Queue Position #{resItem.queuePosition || 1}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400">
                          Reserved on {new Date(resItem.reservedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Book info */}
                      <div className="flex gap-4">
                        {book?.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-16 h-24 object-cover rounded-xl shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-24 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0">
                            Book
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                            <Link to={`/books/${book?._id}`} className="hover:text-teal-600">
                              {book?.title || 'Book Title'}
                            </Link>
                          </h4>
                          <p className="text-xs text-slate-500 truncate">by {book?.author}</p>

                          {/* Allocation Alert Banner */}
                          {isAllocated ? (
                            <div className="mt-3 p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-200 text-xs text-emerald-900">
                              <p className="font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                Copy Allocated!
                              </p>
                              <p className="text-[11px] text-emerald-800 mt-0.5">
                                Please collect before:{' '}
                                <strong>
                                  {resItem.expiryDate
                                    ? new Date(resItem.expiryDate).toLocaleString()
                                    : 'Within 48 hours'}
                                </strong>
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <p className="font-semibold text-slate-700">
                                ⏳ Waiting for a member to return this title.
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Librio will automatically assign the copy to you when it arrives.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {isAllocated ? (
                        <Link
                          to={`/books/${book?._id}`}
                          className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Claim / View Book
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400">Position updates in real time</span>
                      )}

                      <button
                        onClick={() => handleCancelReservation(resItem._id)}
                        disabled={actionLoading}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Leave Queue
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Past Borrow History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {pastBorrows.length === 0 ? (
            <div className="text-center py-12 p-8">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No completed borrow history</h3>
              <p className="text-xs text-slate-500 mt-1">Returned books will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Book Title</th>
                    <th className="py-3.5 px-4">Borrowed On</th>
                    <th className="py-3.5 px-4">Returned On</th>
                    <th className="py-3.5 px-4">Overdue Fine</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pastBorrows.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.book?.title || 'Unknown Title'}
                      </td>
                      <td className="py-3.5 px-4">
                        {new Date(item.borrowDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.returnDate
                          ? new Date(item.returnDate).toLocaleDateString()
                          : 'Returned'}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.fineAmount > 0 ? (
                          item.finePaid ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                ₹{item.fineAmount}
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                                  PAID
                                </span>
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                {item.paymentMethod || 'Settled'}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="font-bold text-rose-600 flex items-center gap-1.5">
                                ₹{item.fineAmount}
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">
                                  DUE
                                </span>
                              </span>
                              <span className="text-[10px] text-rose-500 font-semibold block">
                                Payment Required
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-400 font-medium">₹0 (On Time)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.fineAmount > 0 && !item.finePaid && (
                          <button
                            onClick={() => {
                              setFineModalRecord(item);
                              setFineModalMode('pay');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/30 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay Fine (₹{item.fineAmount})
                          </button>
                        )}
                        {item.fineAmount > 0 && item.finePaid && (
                          <button
                            onClick={() => {
                              setFineModalRecord(item);
                              setFineModalMode('receipt');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5 text-teal-600" /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-base mb-4">Activity & System Alerts</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No alerts recorded.</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
                className={`p-4 rounded-2xl border transition-colors flex items-start justify-between gap-4 ${
                  notif.isRead
                    ? 'bg-slate-50/60 border-slate-200/60'
                    : 'bg-teal-50/70 border-teal-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-900 text-sm">{notif.title}</h5>
                    {!notif.isRead && (
                      <span className="px-1.5 py-0.2 rounded bg-teal-600 text-white text-[10px] font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Return Success Modal */}
      {returnModalResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Book Returned Successfully!</h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              {returnModalResult.message || 'The book has been returned to the library inventory.'}
            </p>

            {returnModalResult.isOverdue && (
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Overdue Fine Incurred
                  </span>
                  <span className="text-base font-black text-rose-600">
                    ₹{returnModalResult.fineAmount}
                  </span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Late return penalty has been applied. You can settle it online now or later via borrow history.
                </p>
              </div>
            )}

            {/* If return triggered allocation to a queued member! */}
            {returnModalResult.reservationQueueNotified && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Pre-Booking Queue Triggered!
                </span>
                <p className="text-xs text-amber-900">
                  This returned copy was automatically allocated to waiting user{' '}
                  <strong>{returnModalResult.notifiedUser}</strong>. They have been notified with a
                  48-hour pickup window!
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              {returnModalResult.fineAmount > 0 && (
                <button
                  onClick={() => {
                    const recordToPay = returnModalResult.borrowRecord || {
                      _id: returnModalResult.borrowRecord?._id,
                      fineAmount: returnModalResult.fineAmount,
                      book: returnModalResult.borrowRecord?.book
                    };
                    setReturnModalResult(null);
                    setFineModalRecord(recordToPay);
                    setFineModalMode('pay');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay Fine (₹{returnModalResult.fineAmount})
                </button>
              )}
              <button
                onClick={() => setReturnModalResult(null)}
                className={`py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors ${
                  returnModalResult.fineAmount > 0 ? 'flex-1' : 'w-full'
                }`}
              >
                {returnModalResult.fineAmount > 0 ? 'Pay Later' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Fine & Receipt Modal */}
      <PayFineModal
        record={fineModalRecord}
        isOpen={Boolean(fineModalRecord)}
        onClose={() => setFineModalRecord(null)}
        initialMode={fineModalMode}
        onSuccess={async () => {
          await loadData();
          fetchNotifications();
        }}
      />
    </div>
  );
};

export default MemberDashboardPage;
