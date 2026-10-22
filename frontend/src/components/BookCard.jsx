import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Users, Calendar, ArrowRight, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

const getCategoryBadgeClass = (cat) => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('program') || c.includes('software')) return 'bg-emerald-600 text-white';
  if (c.includes('ai') || c.includes('artificial') || c.includes('intelligence')) return 'bg-purple-600 text-white';
  if (c.includes('data science')) return 'bg-blue-600 text-white';
  if (c.includes('cyber') || c.includes('security')) return 'bg-rose-600 text-white';
  if (c.includes('network')) return 'bg-cyan-700 text-white';
  if (c.includes('web')) return 'bg-teal-600 text-white';
  if (c.includes('database')) return 'bg-amber-600 text-white';
  if (c.includes('compet') || c.includes('aptitude')) return 'bg-orange-600 text-white';
  if (c.includes('math')) return 'bg-indigo-600 text-white';
  if (c.includes('med') || c.includes('health')) return 'bg-red-600 text-white';
  if (c.includes('law')) return 'bg-slate-800 text-white';
  if (c.includes('agri') || c.includes('environ')) return 'bg-lime-700 text-white';
  if (c.includes('art') || c.includes('hobby')) return 'bg-pink-600 text-white';
  if (c.includes('fict')) return 'bg-violet-700 text-white';
  return 'bg-slate-800 text-white';
};

export const BookCard = ({
  book,
  onBorrow,
  onPreBook,
  onSelectBook,
  borrowingId,
  prebookingId,
}) => {
  const isAvailable = book.availableCopies > 0;
  const isProcessingBorrow = borrowingId === book._id;
  const isProcessingPrebook = prebookingId === book._id;

  const handleCardClick = () => {
    if (onSelectBook) {
      onSelectBook(book);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-400 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer hover:-translate-y-1"
    >
      {/* Cover Image Header */}
      <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden flex items-center justify-center">
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
              loading="lazy"
              className="relative z-10 max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-800 to-slate-900 text-teal-300">
            <BookOpen className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-teal-600" /> Click to View Details
          </span>
        </div>

        {/* Gradient shadow for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20 pointer-events-none" />

        {/* Availability Badge */}
        <div className="absolute top-3 right-3 z-10">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-white shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {book.availableCopies} of {book.totalCopies} Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-white shadow-md animate-pulse-slow">
              <AlertCircle className="w-3.5 h-3.5" />
              0 Available (Queue Open)
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-3 left-3 z-10">
          <span
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${getCategoryBadgeClass(
              book.category
            )}`}
          >
            {book.category}
          </span>
        </div>
      </div>

      {/* Book Information Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-teal-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-1">by {book.author}</p>

          <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
            {book.description ||
              'Comprehensive edition available for library borrowing and student research.'}
          </p>
        </div>

        {/* Meta details & action button */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              {book.shelfLocation || 'Rack A-1'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {book.publicationYear || '2023'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/books/${book._id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
              title="Full Book Page"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>

            {isAvailable ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBorrow && onBorrow(book);
                }}
                disabled={isProcessingBorrow}
                className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs tracking-wide shadow-sm shadow-teal-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessingBorrow ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5" />
                    Borrow Now
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreBook && onPreBook(book);
                }}
                disabled={isProcessingPrebook}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs tracking-wide shadow-sm shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessingPrebook ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    Pre-Book / Join Queue
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
