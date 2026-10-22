import express from 'express';
import {
  registerUser,
  sendRegistrationOtp,
  resendRegistrationOtp,
  loginUser,
  getMe,
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserHistory
} from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-registration-otp', sendRegistrationOtp);
router.post('/resend-registration-otp', resendRegistrationOtp);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Admin-only User Management Routes
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/users/:id', protect, adminOnly, getUserById);
router.put('/users/:id', protect, adminOnly, updateUser);
router.patch('/users/:id/status', protect, adminOnly, toggleUserStatus);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.get('/users/:id/history', protect, adminOnly, getUserHistory);

export default router;
