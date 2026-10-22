import { Reservation } from '../models/Reservation.js';
import { Book } from '../models/Book.js';
import { Notification } from '../models/Notification.js';

const RESERVATION_EXPIRY_HOURS = Number(process.env.RESERVATION_EXPIRY_HOURS) || 48;

// @desc    Pre-book / Reserve a book
// @route   POST /api/reservations/reserve/:bookId
// @access  Private (Member or Admin)
export const createReservation = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user already has an active reservation
    const existingActiveReservation = await Reservation.findOne({
      book: bookId,
      user: userId,
      status: { $in: ['pending', 'allocated'] }
    });

    if (existingActiveReservation) {
      return res.status(400).json({
        message: 'You already have an active reservation for this book.',
        status: existingActiveReservation.status
      });
    }

    // Determine current queue position
    const queueCountBefore = await Reservation.countDocuments({
      book: bookId,
      status: 'pending'
    });

    const queuePosition = queueCountBefore + 1;

    const reservation = await Reservation.create({
      book: bookId,
      user: userId,
      status: 'pending',
      reservedAt: new Date()
    });

    // Notify user of successful reservation
    await Notification.create({
      user: userId,
      title: '📖 Book Pre-Booked Successfully',
      message: `You have successfully reserved "${book.title}". Your position in queue: #${queuePosition}. We'll notify you as soon as a copy is returned!`,
      type: 'general',
      relatedBook: book._id
    });

    res.status(201).json({
      message: `Successfully reserved "${book.title}". You are #${queuePosition} in the queue.`,
      queuePosition,
      reservation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's reservations
// @route   GET /api/reservations/my
// @access  Private
export const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('book', 'title author isbn coverImage category availableCopies totalCopies')
      .sort({ reservedAt: -1 });

    // Compute queue position for any 'pending' reservations
    const enriched = await Promise.all(
      reservations.map(async (resItem) => {
        const item = resItem.toObject();
        if (item.status === 'pending') {
          const aheadInQueue = await Reservation.countDocuments({
            book: item.book._id,
            status: 'pending',
            reservedAt: { $lt: item.reservedAt }
          });
          item.queuePosition = aheadInQueue + 1;
        }
        return item;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reservations (Admin)
// @route   GET /api/reservations
// @access  Private/Admin
export const getAllReservations = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('user', 'name email membershipId phone')
      .populate('book', 'title author isbn coverImage')
      .sort({ reservedAt: -1 });

    const enriched = await Promise.all(
      reservations.map(async (resItem) => {
        const item = resItem.toObject();
        if (item.status === 'pending' && item.book) {
          const ahead = await Reservation.countDocuments({
            book: item.book._id,
            status: 'pending',
            reservedAt: { $lt: item.reservedAt }
          });
          item.queuePosition = ahead + 1;
        }
        return item;
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a reservation
// @route   DELETE /api/reservations/:id
// @access  Private
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('book');
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Verify ownership if not admin
    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    const wasAllocated = reservation.status === 'allocated';
    reservation.status = 'cancelled';
    await reservation.save();

    // If it was allocated, hand it over to the next person in queue or restore to book stock!
    if (wasAllocated && reservation.book) {
      const book = await Book.findById(reservation.book._id);
      const nextReservation = await Reservation.findOne({
        book: book._id,
        status: 'pending'
      }).sort({ reservedAt: 1 }).populate('user');

      if (nextReservation) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + RESERVATION_EXPIRY_HOURS);
        nextReservation.status = 'allocated';
        nextReservation.allocatedAt = new Date();
        nextReservation.expiryDate = expiry;
        await nextReservation.save();

        await Notification.create({
          user: nextReservation.user._id,
          title: '🎉 Reserved Book Is Now Available!',
          message: `Great news! "${book.title}" is now allocated to you as the previous reservation was cancelled. Please collect it within ${RESERVATION_EXPIRY_HOURS} hours.`,
          type: 'reservation_available',
          relatedBook: book._id
        });
      } else {
        book.availableCopies += 1;
        await book.save();
      }
    }

    res.json({ message: 'Reservation cancelled successfully', reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
