import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reservedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'allocated', 'fulfilled', 'cancelled', 'expired'],
    default: 'pending'
  },
  allocatedAt: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
});

// Ensure a user cannot have multiple active (pending or allocated) reservations for the same book
reservationSchema.index({ book: 1, user: 1, status: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
