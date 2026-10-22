import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Users,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { bookAPI, borrowAPI, reservationAPI } from '../api/client';
import { BookCard } from '../components/BookCard';
import { PreBookModal } from '../components/PreBookModal';
import { BookDetailsModal } from '../components/BookDetailsModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preBookModalBook, setPreBookModalBook] = useState(null);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await bookAPI.getBooks({});
        setFeaturedBooks(res.data.slice(0, 6));
      } catch (err) {
        console.error('Failed to load featured books:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/books?keyword=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/books');
    }
  };

  const handleBorrow = async (book) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await borrowAPI.issueBook({ bookId: book._id });
      setActionMessage({ type: 'success', text: `Success! "${book.title}" borrowed.` });
      // Refresh featured books count
      setFeaturedBooks((prev) =>
        prev.map((b) =>
          b._id === book._id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
        )
      );
      fetchNotifications();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to borrow book.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreBookConfirm = async (bookId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await reservationAPI.reserveBook(bookId);
      setActionMessage({
        type: 'success',
        text: res.data.message || 'Book pre-booked! You are in queue.',
      });
      setPreBookModalBook(null);
      fetchNotifications();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reserve book.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Action Notification Alert Bar */}
      {actionMessage && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-sm font-medium shadow-sm ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Clock className="w-5 h-5 text-rose-600" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs uppercase font-bold tracking-wider px-2 py-1 rounded hover:bg-black/5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-500/10 via-slate-50 to-white pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-bold tracking-wide animate-in fade-in duration-500">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Automated FIFO Pre-Booking Queue System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Borrow Instantly or{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                Pre-Book in Queue
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              A modern library system where out-of-stock books are never missed. Join the automated
              queue, track your position, and get notified the moment a copy is returned!
            </p>

            {/* Quick Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-xl mx-auto flex items-center bg-white rounded-2xl p-2 shadow-lg shadow-teal-900/5 border border-slate-200 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all"
            >
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, category, or ISBN..."
                className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/30 transition-all flex items-center gap-1.5"
              >
                Find
              </button>
            </form>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Instant 14-Day Lending
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" /> Fair Pre-Booking Queue
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" /> 48-Hour Claim Window
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How the Pre-Booking Queue System Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Smart Feature Spotlight
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
              How the Pre-Booking Queue System Works
            </h2>
            <p className="text-slate-300 text-sm mt-2">
              Book out of stock? Don't refresh the page manually. Librio's FIFO algorithm handles it
              fairly for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-base">One-Click Pre-Booking</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When available copies are 0, click "Pre-Book" to reserve your spot in the waiting
                queue. You instantly get your queue position (#1, #2, etc.).
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-base">Auto-Allocation On Return</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When another member returns a copy, Librio automatically detects the queue and locks
                the book for the first waiting member.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-base">48-Hr Claim Notification</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You receive an instant notification in your Librio notification bell with a 48-hour
                exclusive window to collect the book!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Catalog Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Curated Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Popular & Trending Books
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Try borrowing available books, or test pre-booking with out-of-stock titles!
            </p>
          </div>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 group"
          >
            Explore All Books{' '}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-slate-200 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                onSelectBook={(b) => setSelectedBookForDetails(b)}
                onBorrow={handleBorrow}
                onPreBook={(b) => {
                  if (!user) navigate('/login');
                  else setPreBookModalBook(b);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pre-Booking Modal */}
      <PreBookModal
        book={preBookModalBook}
        isOpen={!!preBookModalBook}
        onClose={() => setPreBookModalBook(null)}
        onConfirm={handlePreBookConfirm}
        loading={actionLoading}
      />

      {/* Interactive Full Book Details Modal */}
      <BookDetailsModal
        book={selectedBookForDetails}
        isOpen={!!selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
        onBorrow={handleBorrow}
        onPreBook={(b) => {
          setSelectedBookForDetails(null);
          if (!user) navigate('/login');
          else setPreBookModalBook(b);
        }}
        borrowingId={actionLoading ? selectedBookForDetails?._id : null}
      />
    </div>
  );
};

export default HomePage;
