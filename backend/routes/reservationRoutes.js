import express from 'express';
import {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation
} from '../controllers/reservationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/reserve/:bookId', protect, createReservation);
router.get('/my', protect, getMyReservations);
router.delete('/:id', protect, cancelReservation);

// Admin-only route
router.get('/', protect, adminOnly, getAllReservations);

export default router;
