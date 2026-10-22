import React from 'react';
import { X, Users, Clock, Bell, CheckCircle, AlertTriangle } from 'lucide-react';

export const PreBookModal = ({ book, isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pre-Booking Queue</h3>
              <p className="text-xs text-amber-100">Automated Waitlist System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Book Summary Card */}
          <div className="flex gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 items-center">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-14 h-20 object-cover rounded-xl shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-20 bg-teal-100 rounded-xl flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                Book
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                {book.category}
              </span>
              <h4 className="font-bold text-sm text-slate-900 truncate">{book.title}</h4>
              <p className="text-xs text-slate-500 truncate">by {book.author}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Total Copies: {book.totalCopies}
                </span>
                <span className="text-[11px] font-bold text-rose-600">0 Available</span>
              </div>
            </div>
          </div>

          {/* How Queue Works */}
          <div className="space-y-2.5 text-xs text-slate-600 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" /> How Pre-Booking Works
            </h5>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>You will join the **FIFO queue** for this book immediately.</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  The moment any member returns this book, it is **locked exclusively for you**.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  You will have **48 hours** to pick up the book before it passes to the next person.
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(book._id)}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Confirm Pre-Book
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreBookModal;
