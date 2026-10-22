import express from 'express';
import {
  borrowBook,
  returnBook,
  getMyBorrows,
  getAllBorrows,
  payFine,
  getAdminStats
} from '../controllers/borrowController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/issue', protect, borrowBook);
router.post('/return/:id', protect, returnBook);
router.get('/my', protect, getMyBorrows);

// Admin-only routes
router.get('/', protect, adminOnly, getAllBorrows);
router.get('/stats', protect, adminOnly, getAdminStats);

// Fine settlement (Member can pay their own, Admin can pay on behalf)
router.put('/:id/pay-fine', protect, payFine);

export default router;
