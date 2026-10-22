import { Book } from '../models/Book.js';
import { Reservation } from '../models/Reservation.js';

// @desc    Get all books with search & filter
// @route   GET /api/books
// @access  Public
export const getBooks = async (req, res) => {
  try {
    const { keyword, category, availability } = req.query;

    let query = {};

    // Search by title, author, or ISBN
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { author: { $regex: keyword, $options: 'i' } },
        { isbn: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by Availability
    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    } else if (availability === 'unavailable') {
      query.availableCopies = { $lte: 0 };
    }

    const books = await Book.find(query).sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Also get active reservations count for this book
    const reservationCount = await Reservation.countDocuments({
      book: book._id,
      status: { $in: ['pending', 'allocated'] }
    });

    res.json({
      ...book.toObject(),
      activeReservationsCount: reservationCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private/Admin
export const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      description,
      coverImage,
      totalCopies,
      availableCopies,
      shelfLocation,
      publicationYear
    } = req.body;

    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({ message: 'Book with this ISBN already exists' });
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      description: description || '',
      coverImage: coverImage || undefined,
      totalCopies: Number(totalCopies) || 1,
      availableCopies: availableCopies !== undefined ? Number(availableCopies) : Number(totalCopies) || 1,
      shelfLocation: shelfLocation || 'Rack A-1',
      publicationYear: publicationYear || new Date().getFullYear()
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update book details
// @route   PUT /api/books/:id
// @access  Private/Admin
export const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const {
      title,
      author,
      isbn,
      category,
      description,
      coverImage,
      totalCopies,
      availableCopies,
      shelfLocation,
      publicationYear
    } = req.body;

    book.title = title ?? book.title;
    book.author = author ?? book.author;
    book.isbn = isbn ?? book.isbn;
    book.category = category ?? book.category;
    book.description = description ?? book.description;
    book.coverImage = coverImage ?? book.coverImage;
    book.totalCopies = totalCopies !== undefined ? Number(totalCopies) : book.totalCopies;
    book.availableCopies = availableCopies !== undefined ? Number(availableCopies) : book.availableCopies;
    book.shelfLocation = shelfLocation ?? book.shelfLocation;
    book.publicationYear = publicationYear ?? book.publicationYear;

    const updatedBook = await book.save();
    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.deleteOne();
    res.json({ message: 'Book removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all unique categories
// @route   GET /api/books/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Book.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
