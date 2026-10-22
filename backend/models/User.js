import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please enter email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please enter password'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },
  membershipId: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate membershipId and enforce single admin rule
userSchema.pre('save', async function (next) {
  // Enforce only ONE admin in system
  if (this.role === 'admin' && (this.isNew || this.isModified('role'))) {
    const existingAdmin = await mongoose.models.User.findOne({
      role: 'admin',
      _id: { $ne: this._id }
    });
    if (existingAdmin) {
      return next(new Error('Only ONE system administrator is permitted in this library system.'));
    }
  }

  if (!this.membershipId) {
    const prefix = this.role === 'admin' ? 'ADM' : 'LIB';
    const random = Math.floor(1000 + Math.random() * 9000);
    this.membershipId = `${prefix}-${Date.now().toString().slice(-4)}${random}`;
  }

  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
