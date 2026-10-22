import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { OTP } from '../models/OTP.js';
import { BorrowRecord } from '../models/BorrowRecord.js';
import { Reservation } from '../models/Reservation.js';
import { sendRegistrationOtpEmail } from '../utils/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_library_key_2026_jwt_token!', {
    expiresIn: '30d'
  });
};

const generate6DigitOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// @desc    Send 6-digit OTP to email for new registration
// @route   POST /api/auth/send-registration-otp
// @access  Public
export const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Generate secure 6-digit OTP
    const otp = generate6DigitOTP();

    // Remove any previous OTPs for this email to avoid confusion
    await OTP.deleteMany({ email: cleanEmail });

    // Store the new OTP (valid for 5 minutes via MongoDB TTL)
    await OTP.create({
      email: cleanEmail,
      otp,
      createdAt: new Date(),
    });

    // Send the OTP via Email Service
    const emailResult = await sendRegistrationOtpEmail({
      email: cleanEmail,
      name: name ? name.trim() : 'Valued Member',
      otp,
    });

    if (!emailResult.success) {
      return res.status(500).json({
        message: emailResult.error || 'Failed to dispatch email verification code. Please check SMTP settings.'
      });
    }

    if (emailResult.simulated) {
      return res.status(200).json({
        success: true,
        simulated: true,
        simulatedOtp: otp,
        message: `Verification code generated: ${otp} (Simulation mode: credentials not configured in backend/.env).`,
      });
    }

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your Gmail inbox (and Spam folder). It will expire in 5 minutes.`,
    });
  } catch (error) {
    console.error('Error in sendRegistrationOtp:', error);
    res.status(500).json({ message: error.message || 'Internal server error while sending OTP' });
  }
};

// @desc    Resend 6-digit OTP to email
// @route   POST /api/auth/resend-registration-otp
// @access  Public
export const resendRegistrationOtp = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Generate fresh 6-digit OTP
    const otp = generate6DigitOTP();

    // Remove existing OTPs
    await OTP.deleteMany({ email: cleanEmail });

    // Save new OTP
    await OTP.create({
      email: cleanEmail,
      otp,
      createdAt: new Date(),
    });

    // Send email
    const emailResult = await sendRegistrationOtpEmail({
      email: cleanEmail,
      name: name ? name.trim() : 'Valued Member',
      otp,
    });

    if (!emailResult.success) {
      return res.status(500).json({
        message: emailResult.error || 'Failed to dispatch verification code. Please check SMTP settings.'
      });
    }

    if (emailResult.simulated) {
      return res.status(200).json({
        success: true,
        simulated: true,
        simulatedOtp: otp,
        message: `Fresh verification code generated: ${otp} (Simulation mode: credentials not configured in backend/.env).`,
      });
    }

    res.status(200).json({
      success: true,
      message: `A fresh 6-digit verification code has been sent to ${cleanEmail}. Please check your Gmail inbox.`,
    });
  } catch (error) {
    console.error('Error in resendRegistrationOtp:', error);
    res.status(500).json({ message: error.message || 'Internal server error while resending OTP' });
  }
};

// @desc    Register a new user (with verified OTP)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, otp } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!otp || !otp.toString().trim()) {
      return res.status(400).json({ message: 'Please enter the 6-digit email verification code (OTP)' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Verify OTP in database
    const otpRecord = await OTP.findOne({
      email: cleanEmail,
      otp: cleanOtp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'Invalid or expired verification code (OTP). Please request a new one.'
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Strictly enforce: Only ONE admin allowed in the system!
    // Disallow registering as admin
    if (role === 'admin') {
      return res.status(403).json({
        message: 'Admin creation is disabled. Only one system administrator is allowed.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'member',
      phone: phone ? phone.trim() : ''
    });

    if (user) {
      // Clean up the used OTP record
      await OTP.deleteMany({ email: cleanEmail });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipId: user.membershipId,
        phone: user.phone,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });
    
    // Fallback: If logging in with generic admin email, match the configured system admin
    if (!user && cleanEmail === 'admin@library.com') {
      user = await User.findOne({ role: 'admin' });
    }

    if (user && (await user.matchPassword(password))) {
      // Check if user is deactivated
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Your account has been deactivated. Please contact the library administrator.'
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipId: user.membershipId || user.memberId || 'ADM-1001',
        phone: user.phone || '',
        isActive: user.isActive !== false,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with search, filters & stats (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { search, status, role } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { membershipId: regex },
        { phone: regex }
      ];
    }

    if (status === 'active') {
      query.isActive = { $ne: false };
    } else if (status === 'inactive' || status === 'deactivated') {
      query.isActive = false;
    }

    if (role && ['admin', 'member'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    // Aggregate counts of active borrows and active reservations for each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [activeBorrowsCount, activeReservationsCount] = await Promise.all([
          BorrowRecord.countDocuments({ user: u._id, status: { $in: ['borrowed', 'overdue'] } }),
          Reservation.countDocuments({ user: u._id, status: { $in: ['pending', 'allocated'] } })
        ]);

        return {
          ...u.toObject(),
          isActive: u.isActive !== false,
          activeBorrowsCount,
          activeReservationsCount
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user by ID with summary stats (admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [totalBorrows, activeBorrows, returnedBorrows, totalReservations, activeReservations] = await Promise.all([
      BorrowRecord.countDocuments({ user: user._id }),
      BorrowRecord.countDocuments({ user: user._id, status: { $in: ['borrowed', 'overdue'] } }),
      BorrowRecord.countDocuments({ user: user._id, status: 'returned' }),
      Reservation.countDocuments({ user: user._id }),
      Reservation.countDocuments({ user: user._id, status: { $in: ['pending', 'allocated'] } })
    ]);

    res.json({
      ...user.toObject(),
      isActive: user.isActive !== false,
      stats: {
        totalBorrows,
        activeBorrows,
        returnedBorrows,
        totalReservations,
        activeReservations
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user details (admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check email uniqueness if email is changing
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id }
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another user' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // Prevent deactivating own admin account
    if (isActive !== undefined) {
      if (req.user._id.toString() === user._id.toString() && isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own administrator account.' });
      }
      user.isActive = Boolean(isActive);
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipId: user.membershipId,
      phone: user.phone,
      isActive: user.isActive !== false,
      message: 'User details updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active/inactive status (admin only)
// @route   PATCH /api/auth/users/:id/status
// @access  Private/Admin
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating own account
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change the active status of your own account.' });
    }

    const newStatus = user.isActive === false ? true : false;
    user.isActive = newStatus;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      isActive: user.isActive,
      message: `User "${user.name}" has been ${user.isActive ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user with safety checks (admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safety 1: Cannot delete own account
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own administrator account.' });
    }

    // Safety 2: Cannot delete user with active borrowed books
    const activeBorrows = await BorrowRecord.find({
      user: user._id,
      status: { $in: ['borrowed', 'overdue'] }
    }).populate('book', 'title');

    if (activeBorrows.length > 0) {
      const bookTitles = activeBorrows.map((b) => `"${b.book?.title || 'Unknown Book'}"`).join(', ');
      return res.status(400).json({
        message: `Cannot delete user! They currently have ${activeBorrows.length} unreturned book(s): ${bookTitles}. All books must be returned first.`
      });
    }

    // Cancel pending/allocated reservations for this user
    await Reservation.deleteMany({
      user: user._id,
      status: { $in: ['pending', 'allocated'] }
    });

    await User.findByIdAndDelete(user._id);

    res.json({
      message: `User "${user.name}" (${user.email}) was deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's full borrowing and reservation history (admin only)
// @route   GET /api/auth/users/:id/history
// @access  Private/Admin
export const getUserHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Current active borrows
    const currentBorrows = await BorrowRecord.find({
      user: user._id,
      status: { $in: ['borrowed', 'overdue'] }
    })
      .populate('book')
      .sort({ dueDate: 1 });

    // 2. Returned borrow history
    const borrowHistory = await BorrowRecord.find({
      user: user._id,
      status: 'returned'
    })
      .populate('book')
      .sort({ returnDate: -1 });

    // 3. Pre-booking / reservations history
    const reservations = await Reservation.find({ user: user._id })
      .populate('book')
      .sort({ reservedAt: -1 });

    // Calculate fine amounts
    const allRecords = await BorrowRecord.find({ user: user._id });
    let totalFineAmount = 0;
    let paidFineAmount = 0;
    let unpaidFineAmount = 0;

    for (const record of allRecords) {
      const fine = Number(record.fineAmount) || 0;
      totalFineAmount += fine;
      if (record.finePaid) {
        paidFineAmount += fine;
      } else {
        unpaidFineAmount += fine;
      }
    }

    res.json({
      user: {
        ...user.toObject(),
        isActive: user.isActive !== false
      },
      currentBorrows,
      borrowHistory,
      reservations,
      metrics: {
        activeBorrowsCount: currentBorrows.length,
        borrowHistoryCount: borrowHistory.length,
        reservationsCount: reservations.length,
        totalFineAmount,
        paidFineAmount,
        unpaidFineAmount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
