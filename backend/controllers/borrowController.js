import { BorrowRecord } from '../models/BorrowRecord.js';
import { Book } from '../models/Book.js';
import { Reservation } from '../models/Reservation.js';
import { Notification } from '../models/Notification.js';
import { sendBorrowConfirmationEmail } from '../utils/emailService.js';

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 5;
const STANDARD_BORROW_DAYS = Number(process.env.STANDARD_BORROW_DAYS) || 14;
const RESERVATION_EXPIRY_HOURS = Number(process.env.RESERVATION_EXPIRY_HOURS) || 48;

// @desc    Borrow a book
// @route   POST /api/borrows/issue
// @access  Private (Member or Admin issuing to member)
export const borrowBook = async (req, res) => {
  try {
    const { bookId, userId } = req.body;

    // Target user is either specified by admin or the logged-in user
    const targetUserId = req.user.role === 'admin' && userId ? userId : req.user._id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user already has an active borrow of this book
    const existingBorrow = await BorrowRecord.findOne({
      user: targetUserId,
      book: bookId,
      status: 'borrowed'
    });
    if (existingBorrow) {
      return res.status(400).json({ message: 'You have already borrowed this book and have not returned it yet.' });
    }

    // Check if user has an allocated reservation for this book
    const userReservation = await Reservation.findOne({
      user: targetUserId,
      book: bookId,
      status: 'allocated'
    });

    // If no allocated reservation, check general availability
    if (!userReservation && book.availableCopies <= 0) {
      return res.status(400).json({
        message: 'No copies currently available in stock. You can pre-book / reserve this book to get notified when it is returned!',
        canReserve: true
      });
    }

    // Calculate due date (14 days from now)
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + STANDARD_BORROW_DAYS);

    // If fulfilling a reservation, mark reservation fulfilled
    if (userReservation) {
      userReservation.status = 'fulfilled';
      await userReservation.save();
    } else {
      // Regular borrow from open inventory
      book.availableCopies = Math.max(0, book.availableCopies - 1);
      await book.save();
    }

    const borrowRecord = await BorrowRecord.create({
      user: targetUserId,
      book: bookId,
      borrowDate,
      dueDate,
      status: 'borrowed'
    });

    const populatedRecord = await BorrowRecord.findById(borrowRecord._id)
      .populate('book', 'title author isbn coverImage shelfLocation')
      .populate('user', 'name email membershipId');

    // Asynchronously dispatch confirmation email to the user's registered Gmail address
    sendBorrowConfirmationEmail({
      user: populatedRecord.user,
      book: populatedRecord.book,
      borrowDate,
      dueDate,
    }).catch((err) =>
      console.error('❌ Background borrow email error:', err.message)
    );

    // Create in-app activity notification
    await Notification.create({
      user: targetUserId,
      title: '📖 Book Borrowed Successfully',
      message: `You borrowed "${populatedRecord.book?.title}". Return due date: ${new Date(
        dueDate
      ).toLocaleDateString()}. A confirmation email has been sent to ${
        populatedRecord.user?.email
      }.`,
      type: 'general',
      relatedBook: populatedRecord.book?._id
    });

    res.status(201).json({
      message: `Book borrowed successfully! A confirmation email has been sent to ${populatedRecord.user?.email}.`,
      borrowRecord: populatedRecord,
      emailSent: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Return a borrowed book (Triggers pre-booking queue notification)
// @route   POST /api/borrows/return/:id
// @access  Private (Member or Admin)
export const returnBook = async (req, res) => {
  try {
    const borrowRecord = await BorrowRecord.findById(req.params.id)
      .populate('book')
      .populate('user', 'name email');

    if (!borrowRecord) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    if (borrowRecord.status === 'returned') {
      return res.status(400).json({ message: 'This book has already been returned' });
    }

    // Non-admin can only return their own borrow
    if (req.user.role !== 'admin' && borrowRecord.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to return this book' });
    }

    const returnDate = new Date();
    let fineAmount = 0;

    // Calculate overdue fine if applicable
    if (returnDate > borrowRecord.dueDate) {
      const diffTime = Math.abs(returnDate - borrowRecord.dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * FINE_PER_DAY;
    }

    borrowRecord.returnDate = returnDate;
    borrowRecord.status = 'returned';
    borrowRecord.fineAmount = fineAmount;
    await borrowRecord.save();

    const book = await Book.findById(borrowRecord.book._id);

    // ==========================================
    // PRE-BOOKING QUEUE RESOLUTION LOGIC
    // ==========================================
    // Check if there is a pending reservation waiting in queue (FIFO - oldest first)
    const nextReservation = await Reservation.findOne({
      book: book._id,
      status: 'pending'
    }).sort({ reservedAt: 1 }).populate('user', 'name email');

    let reservationHandled = false;

    if (nextReservation) {
      // Allocate to first reserved user in queue
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + RESERVATION_EXPIRY_HOURS);

      nextReservation.status = 'allocated';
      nextReservation.allocatedAt = new Date();
      nextReservation.expiryDate = expiry;
      await nextReservation.save();

      // Send real-time notification alert to that user
      await Notification.create({
        user: nextReservation.user._id,
        title: '🎉 Reserved Book Is Now Available!',
        message: `Great news! "${book.title}" that you reserved is now ready for pickup. Please collect it within ${RESERVATION_EXPIRY_HOURS} hours before it is released to the next person.`,
        type: 'reservation_available',
        relatedBook: book._id
      });

      reservationHandled = true;
      // Note: availableCopies is kept reserved for this user
    } else {
      // No waiting reservations in queue: return copy to open catalog
      book.availableCopies += 1;
      await book.save();
    }

    res.json({
      message: 'Book returned successfully',
      fineAmount,
      isOverdue: fineAmount > 0,
      reservationQueueNotified: reservationHandled,
      notifiedUser: reservationHandled ? nextReservation.user.name : null,
      borrowRecord
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's borrows
// @route   GET /api/borrows/my
// @access  Private
export const getMyBorrows = async (req, res) => {
  try {
    const records = await BorrowRecord.find({ user: req.user._id })
      .populate('book', 'title author isbn coverImage category shelfLocation')
      .sort({ createdAt: -1 });

    const now = new Date();
    // Dynamically calculate pending fine for currently borrowed overdue books
    const enrichedRecords = records.map(record => {
      const rec = record.toObject();
      if (rec.status === 'borrowed' && now > new Date(rec.dueDate)) {
        const diffTime = Math.abs(now - new Date(rec.dueDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        rec.calculatedFine = diffDays * FINE_PER_DAY;
        rec.isOverdue = true;
      } else {
        rec.calculatedFine = rec.fineAmount;
        rec.isOverdue = false;
      }
      return rec;
    });

    res.json(enrichedRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all borrow records (Admin)
// @route   GET /api/borrows
// @access  Private/Admin
export const getAllBorrows = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const records = await BorrowRecord.find(query)
      .populate('user', 'name email membershipId phone')
      .populate('book', 'title author isbn coverImage shelfLocation')
      .sort({ createdAt: -1 });

    const now = new Date();
    const enriched = records.map(r => {
      const obj = r.toObject();
      if (obj.status === 'borrowed' && now > new Date(obj.dueDate)) {
        const diffDays = Math.ceil(Math.abs(now - new Date(obj.dueDate)) / (1000 * 60 * 60 * 24));
        obj.calculatedFine = diffDays * FINE_PER_DAY;
        obj.isOverdue = true;
      } else {
        obj.calculatedFine = obj.fineAmount;
        obj.isOverdue = false;
      }
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pay / Settle overdue fine
// @route   PUT /api/borrows/:id/pay-fine
// @access  Private (Member or Admin)
export const payFine = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id)
      .populate('book', 'title author coverImage')
      .populate('user', 'name email');

    if (!record) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    // Allow if user is admin OR if the record belongs to the logged-in member!
    const isOwner =
      record.user &&
      (record.user._id ? record.user._id.toString() : record.user.toString()) ===
        req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to pay fine for this record' });
    }

    if (record.finePaid) {
      return res.status(400).json({ message: 'Fine for this record has already been paid.' });
    }

    const { paymentMethod } = req.body || {};
    const method =
      paymentMethod || (req.user.role === 'admin' ? 'Cash at Counter' : 'UPI Online');
    const txnId = `TXN-${Date.now().toString().slice(-6)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    record.finePaid = true;
    record.paymentMethod = method;
    record.paidAt = new Date();
    record.transactionId = txnId;
    await record.save();

    // Create payment receipt notification
    await Notification.create({
      user: record.user._id || record.user,
      title: '🧾 Fine Payment Received',
      message: `Your overdue fine of ₹${record.fineAmount} for "${
        record.book?.title || 'Book'
      }" has been settled via ${method}. Reference ID: ${txnId}.`,
      type: 'general',
      relatedBook: record.book?._id
    });

    res.json({
      message: `Fine of ₹${record.fineAmount} paid successfully via ${method}!`,
      transactionId: txnId,
      paidAt: record.paidAt,
      paymentMethod: method,
      record
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard metrics & stats
// @route   GET /api/borrows/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const books = await Book.find();
    const totalCopies = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
    const availableCopies = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);

    const activeBorrows = await BorrowRecord.countDocuments({ status: 'borrowed' });
    const returnedBorrows = await BorrowRecord.countDocuments({ status: 'returned' });

    const now = new Date();
    const overdueBorrows = await BorrowRecord.countDocuments({
      status: 'borrowed',
      dueDate: { $lt: now }
    });

    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });
    const allocatedReservations = await Reservation.countDocuments({ status: 'allocated' });

    const borrowsWithFines = await BorrowRecord.find({ fineAmount: { $gt: 0 } });
    const totalFines = borrowsWithFines.reduce((sum, b) => sum + b.fineAmount, 0);

    res.json({
      totalBooks,
      totalCopies,
      availableCopies,
      activeBorrows,
      returnedBorrows,
      overdueBorrows,
      pendingReservations,
      allocatedReservations,
      totalFines
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
