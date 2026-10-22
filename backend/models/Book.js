import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter book title'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Please enter author name'],
    trim: true
  },
  isbn: {
    type: String,
    required: [true, 'Please enter ISBN'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select category'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'
  },
  totalCopies: {
    type: Number,
    required: [true, 'Please enter total copies'],
    min: 0,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: [true, 'Please enter available copies'],
    min: 0,
    default: 1
  },
  shelfLocation: {
    type: String,
    default: 'Rack A-1'
  },
  publicationYear: {
    type: Number,
    default: new Date().getFullYear()
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast search
bookSchema.index({ title: 'text', author: 'text', category: 'text', isbn: 'text' });

export const Book = mongoose.model('Book', bookSchema);
