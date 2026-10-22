import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { bookAPI, borrowAPI, reservationAPI } from '../api/client';
import { BookCard } from '../components/BookCard';
import { PreBookModal } from '../components/PreBookModal';
import { BookDetailsModal } from '../components/BookDetailsModal';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const BookCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const keywordParam = searchParams.get('keyword') || '';
  const categoryParam = searchParams.get('category') || 'All';
  const availabilityParam = searchParams.get('availability') || 'all';

  const [searchInput, setSearchInput] = useState(keywordParam);
  const [preBookModalBook, setPreBookModalBook] = useState(null);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 18;

  // Fetch Categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await bookAPI.getCategories();
        setCategories(['All', ...res.data]);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch Books whenever search parameters change
  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      setCurrentPage(1);
      try {
        const res = await bookAPI.getBooks({
          keyword: keywordParam || undefined,
          category: categoryParam !== 'All' ? categoryParam : undefined,
          availability: availabilityParam !== 'all' ? availabilityParam : undefined,
        });
        setBooks(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch books:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [keywordParam, categoryParam, availabilityParam]);

  const updateFilters = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };
    // Remove empty parameters
    Object.keys(merged).forEach((k) => {
      if (!merged[k] || merged[k] === 'All' || merged[k] === 'all') {
        delete merged[k];
      }
    });
    setSearchParams(merged);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ keyword: searchInput.trim() });
  };

  const handleBorrow = async (book) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await borrowAPI.issueBook({ bookId: book._id });
      setFeedback({
        type: 'success',
        message:
          res.data?.message ||
          `You have successfully borrowed "${book.title}"! A confirmation email with due dates has been sent to your registered Gmail.`,
      });
      // Update local available copy count
      setBooks((prev) =>
        prev.map((b) =>
          b._id === book._id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
        )
      );
      fetchNotifications();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Could not borrow book.',
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
      setFeedback({
        type: 'success',
        message: res.data.message || 'Book pre-booked successfully! Check your dashboard.',
      });
      setPreBookModalBook(null);
      fetchNotifications();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to place pre-booking.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Library Book Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, borrow directly, or join the queue for reserved titles.
          </p>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, author, ISBN..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </form>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Availability Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => updateFilters({ availability: 'all' })}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                availabilityParam === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Books
            </button>
            <button
              onClick={() => updateFilters({ availability: 'available' })}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                availabilityParam === 'available'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              Available Now
            </button>
            <button
              onClick={() => updateFilters({ availability: 'unavailable' })}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                availabilityParam === 'unavailable'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Pre-Booking Queue Active
            </button>
          </div>

          {/* Reset Filters */}
          {(keywordParam || categoryParam !== 'All' || availabilityParam !== 'all') && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchParams({});
              }}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilters({ category: cat })}
              className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-all ${
                categoryParam === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No books found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters to see more results.
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              setSearchParams({});
            }}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-teal-700"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>
              Found <strong>{books.length}</strong> books in catalog
            </span>
            <span>
              Page {currentPage} of {Math.max(1, Math.ceil(books.length / booksPerPage))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books
              .slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage)
              .map((book) => (
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

          {/* Pagination Controls */}
          {Math.ceil(books.length / booksPerPage) > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                Showing{' '}
                <strong className="text-slate-800">
                  {(currentPage - 1) * booksPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800">
                  {Math.min(currentPage * booksPerPage, books.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{books.length}</strong> books
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl">
                  {currentPage} / {Math.ceil(books.length / booksPerPage)}
                </span>

                <button
                  onClick={() => {
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(books.length / booksPerPage), p + 1)
                    );
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === Math.ceil(books.length / booksPerPage)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

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

export default BookCatalogPage;
