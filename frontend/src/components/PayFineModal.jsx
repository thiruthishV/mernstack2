import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  ShieldCheck,
  Clock,
  ArrowRight,
  BookOpen,
  Sparkles,
  Lock
} from 'lucide-react';
import { borrowAPI } from '../api/client';

export const PayFineModal = ({
  record,
  isOpen,
  onClose,
  onSuccess,
  isAdmin = false,
  initialMode = null
}) => {
  if (!isOpen || !record) return null;

  const book = record.book || {};
  const fineAmount = record.fineAmount || record.calculatedFine || 0;
  const isAlreadyPaid = record.finePaid === true;

  // Determine current screen: 'receipt' if already paid, otherwise 'pay'
  const [screen, setScreen] = useState(
    initialMode ? initialMode : isAlreadyPaid ? 'receipt' : 'pay'
  );
  const [paymentMethod, setPaymentMethod] = useState(
    isAdmin ? 'Cash at Counter' : 'UPI Online'
  );
  const [upiId, setUpiId] = useState('reader@oksbi');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [receiptData, setReceiptData] = useState(
    isAlreadyPaid
      ? {
          transactionId: record.transactionId || 'TXN-SETTLED-001',
          paidAt: record.paidAt || new Date().toISOString(),
          paymentMethod: record.paymentMethod || 'Settled at Counter',
          fineAmount: record.fineAmount || fineAmount,
        }
      : null
  );

  // Compute overdue days
  const dueDate = record.dueDate ? new Date(record.dueDate) : null;
  const returnDate = record.returnDate ? new Date(record.returnDate) : new Date();
  let overdueDays = 0;
  if (dueDate && returnDate > dueDate) {
    overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
  } else if (fineAmount > 0) {
    overdueDays = Math.ceil(fineAmount / 5);
  }

  // Handle Pay Action
  const handlePayment = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await borrowAPI.payFine(record._id, {
        paymentMethod: paymentMethod,
      });

      const data = res.data;
      setReceiptData({
        transactionId: data.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
        paidAt: data.paidAt || new Date().toISOString(),
        paymentMethod: data.paymentMethod || paymentMethod,
        fineAmount: fineAmount,
      });

      setScreen('receipt');
      if (onSuccess) {
        onSuccess(data.record || { ...record, finePaid: true, paymentMethod, transactionId: data.transactionId });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMsg(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Print receipt helper
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div
          className={`px-6 py-5 text-white flex items-center justify-between transition-colors ${
            screen === 'receipt'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900'
              : 'bg-gradient-to-r from-rose-600 via-rose-700 to-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {screen === 'receipt' ? (
                <Receipt className="w-5 h-5 text-white" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {screen === 'receipt' ? 'Payment Receipt & Confirmation' : 'Library Overdue Fine'}
              </h3>
              <p className="text-xs text-white/80">
                {screen === 'receipt'
                  ? 'Official Librio e-Settlement Receipt'
                  : 'Settle overdue charges to resume book borrowing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-[10px] uppercase font-bold">
                Dismiss
              </button>
            </div>
          )}

          {/* ==================================================== */}
          {/* SCREEN 1: PAYMENT GATEWAY SIMULATOR */}
          {/* ==================================================== */}
          {screen === 'pay' && (
            <>
              {/* Book Summary Card */}
              <div className="flex gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 items-center">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title || 'Book Cover'}
                    className="w-14 h-20 object-cover rounded-xl shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-20 bg-rose-100 rounded-xl flex items-center justify-center text-rose-700 font-bold text-xs flex-shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    {book.category || 'Overdue Return'}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 truncate">
                    {book.title || 'Library Book'}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">by {book.author || 'Author'}</p>
                  
                  {record.user?.name && (
                    <p className="text-[11px] text-slate-600 mt-1">
                      Member: <strong className="text-slate-800">{record.user.name}</strong> ({record.user.membershipId || record.user.email})
                    </p>
                  )}
                </div>
              </div>

              {/* Fine Calculation Breakdown Banner */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">
                      Overdue Fine Summary
                    </span>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      {overdueDays} days late × ₹5/day rate
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-600">₹{fineAmount}</span>
                    <span className="text-[10px] block font-semibold text-rose-500 uppercase tracking-wider">
                      Unpaid Dues
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-rose-200/60 grid grid-cols-2 gap-2 text-[11px] text-rose-900/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Due Date:</span>
                    <strong>{dueDate ? dueDate.toLocaleDateString() : 'Overdue'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Return Status:</span>
                    <strong>
                      {record.status === 'returned'
                        ? `Returned on ${new Date(record.returnDate).toLocaleDateString()}`
                        : 'Active / Overdue'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Payment Method:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI Online')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'UPI Online'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 text-teal-800'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-teal-600" />
                    <span className="text-[11px] font-bold">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'Card'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 text-teal-800'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-teal-600" />
                    <span className="text-[11px] font-bold">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Net Banking')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'Net Banking'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 text-teal-800'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building className="w-5 h-5 text-teal-600" />
                    <span className="text-[11px] font-bold">Net Banking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash at Counter')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'Cash at Counter'
                        ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20 text-teal-800'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-teal-600" />
                    <span className="text-[11px] font-bold">Cash Desk</span>
                  </button>
                </div>

                {/* Sub-inputs based on payment method */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  {paymentMethod === 'UPI Online' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-700">UPI Virtual ID / App:</span>
                        <span className="text-[10px] text-teal-600 font-bold">GPay / PhonePe / Paytm</span>
                      </div>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-600" /> A dynamic UPI payment approval request will be simulated instantly.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'Card' && (
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Card Number:</span>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          defaultValue="12/28"
                          placeholder="MM/YY"
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs text-center"
                        />
                        <input
                          type="password"
                          defaultValue="•••"
                          placeholder="CVV"
                          maxLength={3}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs text-center"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Net Banking' && (
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Select Bank:</span>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option>HDFC Bank</option>
                        <option>State Bank of India (SBI)</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Kotak Mahindra</option>
                      </select>
                    </div>
                  )}

                  {paymentMethod === 'Cash at Counter' && (
                    <div className="text-slate-600 space-y-1">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" /> Librarian Counter Settlement
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        The reader submits physical cash ₹{fineAmount} at the reception circulation desk. Clicking below marks the record as settled and issues an official digital receipt.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Shield badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                <span>256-Bit Encrypted Library Fine Settlement Gateway</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading || fineAmount <= 0}
                  className="w-2/3 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Processing Payment...
                    </span>
                  ) : (
                    <>
                      Pay ₹{fineAmount} via {paymentMethod} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ==================================================== */}
          {/* SCREEN 2: OFFICIAL PAYMENT RECEIPT */}
          {/* ==================================================== */}
          {screen === 'receipt' && receiptData && (
            <div className="space-y-4">
              {/* Green Success Badge */}
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-sm animate-in zoom-in-50">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-900">Fine Paid Successfully!</h4>
                <p className="text-xs text-slate-500">
                  The overdue penalty has been cleared in full.
                </p>
              </div>

              {/* Printable Receipt Card */}
              <div
                id="fine-receipt-card"
                className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-5 space-y-4 text-xs font-mono text-slate-700 relative overflow-hidden"
              >
                {/* Watermark badge */}
                <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                  <Receipt className="w-40 h-40 text-slate-900" />
                </div>

                {/* Receipt Header */}
                <div className="text-center pb-3 border-b border-slate-200">
                  <h5 className="font-extrabold text-sm text-slate-900 tracking-wider">
                    LIBRIO CENTRAL LIBRARY
                  </h5>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Automated Circulation & Fine Settlement System
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-sans font-bold">
                    OFFICIAL E-RECEIPT
                  </span>
                </div>

                {/* Line Items */}
                <div className="space-y-2 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Transaction ID:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {receiptData.transactionId}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Date & Time:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(receiptData.paidAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Book Title:</span>
                    <span className="font-bold text-slate-900 max-w-[220px] truncate text-right">
                      {book.title || 'Library Book'}
                    </span>
                  </div>

                  {record.user?.name && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[11px]">Member:</span>
                      <span className="font-medium text-slate-800">
                        {record.user.name} ({record.user.membershipId || 'LIB'})
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Payment Mode:</span>
                    <span className="font-semibold text-slate-800">
                      {receiptData.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Overdue Penalty:</span>
                    <span className="text-slate-800">{overdueDays} days @ ₹5/day</span>
                  </div>
                </div>

                {/* Total Settled */}
                <div className="pt-3 border-t-2 border-dashed border-slate-300 flex items-center justify-between font-sans">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Total Amount Settled
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">STATUS: ZERO DUES</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{receiptData.fineAmount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-slate-600" /> Print Receipt
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Close & Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayFineModal;
