import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  BookOpen,
  MapPin,
  Calendar,
  Barcode,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const BookDetailsModal = ({
  book,
  isOpen,
  onClose,
  onBorrow,
  onPreBook,
  borrowingId,
  prebookingId,
}) => {
  if (!isOpen || !book) return null;

  const isAvailable = book.availableCopies > 0;
  const isBorrowing = borrowingId === book._id;
  const isPrebooking = prebookingId === book._id;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
              {book.category}
            </span>
            <span className="text-xs text-slate-400 font-medium">ISBN: {book.isbn}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Book Cover */}
            <div className="sm:col-span-5 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg bg-slate-900 relative flex items-center justify-center">
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
                <div className="w-full h-full flex flex-col items-center justify-center bg-teal-800 text-teal-200 p-4 text-center">
                  <BookOpen className="w-12 h-12 stroke-[1.5] mb-2" />
                  <span className="font-bold text-xs">{book.title}</span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                {isAvailable ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In Stock ({book.availableCopies})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-md animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Waitlist Queue
                  </span>
                )}
              </div>
            </div>

            {/* Book Info Column */}
            <div className="sm:col-span-7 space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {book.title}
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">by {book.author}</p>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  About This Book
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-h-36 overflow-y-auto">
                  {book.description ||
                    'Comprehensive institutional copy available for study and research.'}
                </p>
              </div>

              {/* Quick Details Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Shelf Location</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    {book.shelfLocation || 'Rack CS-01'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Publication</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {book.publicationYear || 2023}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Total Copies</span>
                  <span className="font-bold text-slate-800">{book.totalCopies} Copies</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Available Now</span>
                  <span
                    className={`font-bold ${
                      isAvailable ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {book.availableCopies} Copies
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to={`/books/${book._id}`}
              onClick={onClose}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Full Dedicated Page
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>

              {isAvailable ? (
                <button
                  type="button"
                  onClick={() => onBorrow && onBorrow(book)}
                  disabled={isBorrowing}
                  className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isBorrowing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" /> Borrow Now (14 Days)
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPreBook && onPreBook(book)}
                  disabled={isPrebooking}
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isPrebooking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Users className="w-4 h-4" /> Pre-Book / Join Waitlist
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
