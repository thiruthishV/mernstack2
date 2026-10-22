import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Calendar,
  Barcode,
  Users,
  CheckCircle2,
  Clock,
  Share2,
  AlertCircle
} from 'lucide-react';
import { bookAPI, borrowAPI, reservationAPI } from '../api/client';
import { PreBookModal } from '../components/PreBookModal';
import { BookCard } from '../components/BookCard';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [book, setBook] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [preBookModalOpen, setPreBookModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const res = await bookAPI.getBookById(id);
        setBook(res.data);
        if (res.data?.category) {
          const simRes = await bookAPI.getBooks({ category: res.data.category });
          const list = Array.isArray(simRes.data) ? simRes.data : [];
          setSimilarBooks(list.filter((b) => b._id !== id).slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load book details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleBorrow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await borrowAPI.issueBook({ bookId: book._id });
      setNotification({
        type: 'success',
        message:
          res.data?.message ||
          `Successfully borrowed "${book.title}"! A confirmation email with due dates has been sent to your registered Gmail.`,
      });
      setBook((prev) => ({ ...prev, availableCopies: Math.max(0, prev.availableCopies - 1) }));
      fetchNotifications();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Could not borrow book.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreBookConfirm = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await reservationAPI.reserveBook(book._id);
      setNotification({
        type: 'success',
        message: res.data.message || 'Book pre-booked! You are in queue.',
      });
      setPreBookModalOpen(false);
      // Reload book to update active reservation count
      const updated = await bookAPI.getBookById(book._id);
      setBook(updated.data);
      fetchNotifications();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to place reservation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading book details...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Book Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested book does not exist or was removed.</p>
        <Link
          to="/books"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold shadow hover:bg-teal-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back to Catalog */}
      <Link
        to="/books"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Cover Image */}
          <div className="md:col-span-5 aspect-[3/4] rounded-2xl overflow-hidden shadow-md bg-slate-900 relative group flex items-center justify-center">
            {book.coverImage ? (
              <>
                <img
                  src={book.coverImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-30 pointer-events-none"
                />
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="relative z-10 max-h-full max-w-full object-contain p-2 drop-shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 text-teal-600">
                <BookOpen className="w-16 h-16 stroke-[1.5]" />
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  {book.category}
                </span>
                {isAvailable ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    In Stock ({book.availableCopies} available)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Out of Stock ({book.activeReservationsCount || 0} in queue)
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {book.title}
              </h1>
              <p className="text-sm font-semibold text-slate-500 mt-1">by {book.author}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Overview
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {book.description ||
                  'No overview provided. This book is a verified catalog item within our institutional collection.'}
              </p>
            </div>

            {/* Meta Attributes Table */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Location Rack</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  {book.shelfLocation || 'Rack CS-01'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">ISBN Number</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-slate-500" />
                  {book.isbn}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Publication Year</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {book.publicationYear || 2023}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Total Holdings</span>
                <span className="font-bold text-slate-800">{book.totalCopies} Copies</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Available Now</span>
                <span
                  className={`font-bold ${isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {book.availableCopies} Copies
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Waiting Queue</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {book.activeReservationsCount || 0} Waiting
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              {isAvailable ? (
                <button
                  type="button"
                  onClick={handleBorrow}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      Borrow This Book (14 Days)
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) navigate('/login');
                      else setPreBookModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Pre-Book / Join Waitlist Queue
                  </button>
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    ℹ️ When any copy is returned by another reader, Librio will automatically allocate
                    it to the next person in line and notify you with a 48-hour claim window.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Books in this Category */}
      {similarBooks.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                More Books in {book.category}
              </h3>
              <p className="text-xs text-slate-500">Explore related titles in this collection</p>
            </div>
            <Link
              to={`/books?category=${encodeURIComponent(book.category)}`}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {similarBooks.map((simBook) => (
              <BookCard
                key={simBook._id}
                book={simBook}
                onSelectBook={(b) => navigate(`/books/${b._id}`)}
                onBorrow={() => navigate(`/books/${simBook._id}`)}
                onPreBook={() => navigate(`/books/${simBook._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pre-Booking Modal */}
      <PreBookModal
        book={book}
        isOpen={preBookModalOpen}
        onClose={() => setPreBookModalOpen(false)}
        onConfirm={handlePreBookConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default BookDetailsPage;
